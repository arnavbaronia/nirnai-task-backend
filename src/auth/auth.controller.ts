import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // auth.controller.ts
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login({
      email: body.email,
      password: body.password
    });
    
    // Set cookie with proper attributes
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'yourdomain.com' : undefined
    });
    
    return { 
      success: true,
      user: result.user
    };
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    const user = await this.authService.register({ 
      email: body.email, 
      password: body.password 
    });
    return { success: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    return { success: true, user: req.user };
  }
}