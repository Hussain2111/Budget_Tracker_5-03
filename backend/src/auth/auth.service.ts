import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User } from "./entities/user.entity";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateProfileDto,
} from "./dto/create-auth.dto";
import { EmailService } from "../email/email.service";
import { RecurringService } from "../recurring/recurring.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly recurringService: RecurringService,
  ) {}

  // ── Register ───────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const { username, email, password } = dto;

    const existing = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existing) {
      throw new BadRequestException("Username or email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = this.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.userRepository.save(user);

    // Send verification email (non-blocking in dev)
    await this.emailService.sendVerificationEmail(
      email,
      username,
      verificationToken,
    );

    return {
      message:
        "Registration successful. Please check your email to verify your account.",
      requiresVerification: true,
    };
  }

  // ── Verify Email ───────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException(
        "Verification token has expired. Please request a new one.",
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await this.userRepository.save(user);

    // Generate JWT so user is immediately logged in after verification
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: "Email verified successfully",
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        baseCurrency: user.baseCurrency,
      },
    };
  }

  // ── Resend Verification ────────────────────────────────────────
  async resendVerification(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return { message: "If that email exists and is unverified, we've sent a new link." };
    }

    const verificationToken = this.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await this.userRepository.save(user);

    await this.emailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationToken,
    );

    return { message: "If that email exists and is unverified, we've sent a new link." };
  }

  // ── Login (username OR email) ──────────────────────────────────
  async login(dto: LoginDto) {
    const { usernameOrEmail, password } = dto;

    // Determine if input looks like an email
    const isEmail = usernameOrEmail.includes("@");

    const user = await this.userRepository.findOne({
      where: isEmail
        ? { email: usernameOrEmail.toLowerCase() }
        : { username: usernameOrEmail },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        "Please verify your email before logging in. Check your inbox for the verification link.",
      );
    }

    // Auto-generate recurring transactions
    try {
      await this.recurringService.processRecurringForUser(user.id);
    } catch (err) {
      console.error("Recurring processing failed:", err);
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: "Login successful",
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        baseCurrency: user.baseCurrency,
      },
    };
  }

  // ── Forgot Password ────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "If that email is registered, you'll receive a reset link shortly." };
    }

    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await this.userRepository.save(user);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken,
    );

    return { message: "If that email is registered, you'll receive a reset link shortly." };
  }

  // ── Reset Password ─────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException(
        "Reset token has expired. Please request a new one.",
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Also mark email as verified if they reset via email
    user.isEmailVerified = true;
    await this.userRepository.save(user);

    return { message: "Password reset successfully. You can now log in." };
  }

  // ── Validate User (JWT strategy) ──────────────────────────────
  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }

  // ── Google OAuth ───────────────────────────────────────────────
  async loginWithGoogle(googleUser: {
    googleId: string;
    email?: string;
    username?: string;
  }) {
    const email = googleUser.email?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException("Google account has no email");
    }

    let user = await this.userRepository.findOne({
      where: [{ googleId: googleUser.googleId }, { email }],
    });

    if (!user) {
      const baseUsername = (
        googleUser.username || email.split("@")[0]
      ).replace(/\s+/g, "");
      let username = baseUsername;
      let counter = 1;

      while (await this.userRepository.findOne({ where: { username } })) {
        username = `${baseUsername}${counter++}`;
      }

      user = this.userRepository.create({
        googleId: googleUser.googleId,
        email,
        username,
        isEmailVerified: true, // Google accounts are pre-verified
      });

      user = await this.userRepository.save(user);
    }

    try {
      await this.recurringService.processRecurringForUser(user.id);
    } catch (err) {
      console.error("Recurring processing failed:", err);
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: "Google login successful",
      access_token: token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        baseCurrency: user.baseCurrency 
      },
    };
  }

  // ── Update Profile ─────────────────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update allowed fields
    if (dto.username !== undefined) {
      // Check if username is already taken by another user
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException("Username already taken");
      }
      user.username = dto.username;
    }

    if (dto.baseCurrency !== undefined) {
      user.baseCurrency = dto.baseCurrency;
    }

    await this.userRepository.save(user);

    return {
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        baseCurrency: user.baseCurrency,
        createdAt: user.createdAt,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}