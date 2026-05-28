// Mục đích: Định nghĩa các API cửa ngõ xác thực người dùng (đăng nhập, đăng ký, đăng xuất, đổi mật khẩu, onboard chi nhánh, và refresh token).
// File quan hệ: Nhận request từ Client, gọi AuthService để xử lý nghiệp vụ, sử dụng Cookie và các Guards để bảo mật thông tin.
// Chức năng đặc biệt: Tự động lưu Access Token và Refresh Token vào HTTP-Only Cookies có thuộc tính bảo mật phù hợp môi trường (production/development).
// Kiến thức/Design Pattern: Single Responsibility (chỉ xử lý routing, cookies và validate đầu vào), Dependency Injection, Guard Pattern (JwtAuthGuard, CustomThrottlerGuard).
// Các biến, hàm đặc biệt: register(), login(), logout(), changePassword(), completeOnboarding(), refresh(), checkAuth(), setCookies().

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CustomThrottlerGuard } from '../../common/guards/custom-throttler.guard';
import { MESSAGES } from '../../common/constants/messages.constant';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @UseGuards(CustomThrottlerGuard)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser('id') userId: number,
    @Body() body: { oldPassword?: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Post('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @GetUser('id') userId: number,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(userId, dto);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException(MESSAGES.AUTH.NO_REFRESH_TOKEN);
    }

    const result = await this.authService.refreshToken(refreshToken);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  async checkAuth(@GetUser('id') userId: number) {
    const user = await this.authService.getProfile(userId);
    return { user };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }
}
