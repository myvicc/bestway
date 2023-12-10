import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login-users.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string } | { success: boolean; error: string }> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Internal server error',
      };
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('user-info')
  async getUserInfo(@Req() req): Promise<any> {
    const token = req.headers.authorization.replace('Bearer ', '');
    return this.authService.getUserInfoFromToken(token);
  }
}
