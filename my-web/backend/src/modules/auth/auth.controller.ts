import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { profile: true }
    });
  }

  @Post('change-password')
  async changePassword(@Body() body: any) {
    return this.authService.changePassword(body);
  }

  @Post('verify-profile-email')
  async verifyProfileEmail(@Body() body: any) {
    return this.authService.verifyProfileEmail(body);
  }
}
