import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
// Mục đích: Định nghĩa chiến lược xác thực (Strategy) bằng JWT token.
// Ý nghĩa: Tự động chạy mỗi khi có request gửi lên kèm token, giúp xác thực người dùng.
// Chức năng đặc biệt: Kế thừa PassportStrategy, đọc token từ Authorization Header (Bearer Token).
// Kiến thức/Design Pattern: Strategy Pattern (Passport), Dependency Injection.
// Biến/hàm đặc biệt: Hàm validate() được gọi tự động nếu token hợp lệ để query DB kiểm tra user có bị khóa không.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';
import { UserStatus } from '@prisma/client';
import { JwtPayload } from '../types/jwt-payload';
import { appConfig } from '../../config/app.config';
import { MESSAGES } from '../constants/messages.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const token = (req?.cookies?.['accessToken'] as string) || null;
        return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: appConfig().jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const userId = Number(payload.sub);

    if (isNaN(userId)) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException(MESSAGES.USER.NOT_FOUND);
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_LOCKED);
    }

    return user;
  }
}
