import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

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

  @Get('profile/:id')
  async getProfile(
    @Param('id') id: string,
    @Query('requesterId') requesterId?: string,
  ) {
    return this.authService.getProfile(
      parseInt(id),
      requesterId ? parseInt(requesterId) : undefined,
    );
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

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('toggle-follow-user')
  @UseGuards(JwtAuthGuard)
  async toggleFollowUser(
    @GetUser('id') userId: number,
    @Body() body: { followingId: number },
  ) {
    return this.authService.toggleFollow(userId, body.followingId);
  }

  @Post('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @GetUser('id') userId: number,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(userId, dto.preferences);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const result = await this.authService.refreshToken(refreshToken);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
