import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { access_token } = await this.authService.login({
      email: body.email,
      password: body.password
    });
    
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
      domain: 'localhost',
      path: '/',
    });
    
    return { success: true };
  }
  
  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register({ 
      email: body.email, 
      password: body.password 
    });
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }
}