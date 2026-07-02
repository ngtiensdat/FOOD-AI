// Mục đích: Định nghĩa các API cửa ngõ xác thực người dùng (đăng nhập, đăng ký, đăng xuất, đổi mật khẩu, onboard chi nhánh, refresh token, và xác thực OTP/forgot password).
// File quan hệ: Nhận request từ Client, gọi AuthService để xử lý nghiệp vụ, sử dụng Cookie và các Guards để bảo mật thông tin.
// Chức năng đặc biệt: Tự động lưu Access Token và Refresh Token vào HTTP-Only Cookies có thuộc tính bảo mật phù hợp môi trường (production/development).
// Kiến thức/Design Pattern: Single Responsibility (chỉ xử lý routing, cookies và validate đầu vào), Dependency Injection, Guard Pattern (JwtAuthGuard, CustomThrottlerGuard).
// Các biến, hàm đặc biệt: register(), login(), logout(), changePassword(), completeOnboarding(), refresh(), checkAuth(), setCookies(), verifyEmail(), resendOtp(), forgotPassword(), resetPassword().

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { CustomThrottlerGuard } from '../../common/guards/custom-throttler.guard';
import { MESSAGES } from '../../common/constants/messages.constant';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @UseGuards(CustomThrottlerGuard)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(dto.email, dto.otp);
    if (result && 'accessToken' in result && result.accessToken) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      return { user: result.user };
    }
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CustomThrottlerGuard)
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CustomThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @GetUser('id') userId: number,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(userId, body.password);
    // Xóa cookies sau khi xóa tài khoản thành công
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return result;
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return { message: MESSAGES.AUTH.LOGOUT_SUCCESS };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
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
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }
}
