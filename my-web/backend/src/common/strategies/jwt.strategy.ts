import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';
import { UserStatus } from '@prisma/client';
import { JwtPayload } from '../types/jwt-payload';

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
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'super-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const userId = Number(payload.sub);

    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException(
        'Tài khoản chưa được phê duyệt hoặc đã bị khóa',
      );
    }

    return user;
  }
}
