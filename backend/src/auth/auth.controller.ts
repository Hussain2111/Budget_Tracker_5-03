import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateProfileDto,
} from "./dto/create-auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post("resend-verification")
  resendVerification(@Body("email") email: string) {
    return this.authService.resendVerification(email);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  profile(@Req() req: any) {
    const user = req.user;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      baseCurrency: user.baseCurrency,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/?token=${encodeURIComponent(result.access_token)}`,
    );
  }
}