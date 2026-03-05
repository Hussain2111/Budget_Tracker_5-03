import {Controller, Post, Body, Get, UseGuards, Req, Res} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/create-auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {AuthGuard} from "@nestjs/passport";
import type { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  profile(@Req() req: any) {
    const user = req.user;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Passport redirect
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendUrl}/?token=${encodeURIComponent(result.access_token)}`;

    return res.redirect(redirectUrl);
  }
}