import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';
import { RecurringService } from '../recurring/recurring.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => RecurringService))
    private readonly recurringService: RecurringService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: 'User registered successfully',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (!user.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Auto-generate any overdue recurring transactions
    try {
      await this.recurringService.processRecurringForUser(user.id);
    } catch (err) {
      // Non-fatal — don't block login if this fails
      console.error('Recurring processing failed:', err);
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async loginWithGoogle(googleUser: {
    googleId: string;
    email?: string;
    username?: string;
  }) {
    const email = googleUser.email?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.userRepository.findOne({
      where: [{ googleId: googleUser.googleId }, { email }],
    });

    if (!user) {
      const baseUsername = (
        googleUser.username || email.split('@')[0]
      ).replace(/\s+/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await this.userRepository.findOne({ where: { username } })) {
        username = `${baseUsername}${counter++}`;
      }

      user = this.userRepository.create({
        googleId: googleUser.googleId,
        email,
        username,
      });

      user = await this.userRepository.save(user);
    }

    // Auto-generate recurring on Google login too
    try {
      await this.recurringService.processRecurringForUser(user.id);
    } catch (err) {
      console.error('Recurring processing failed:', err);
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Google login successful',
      access_token: token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }
}