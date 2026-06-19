// Mục đích: Khai báo module xác thực (AuthModule), cấu hình JwtModule bất đồng bộ và cung cấp các dịch vụ liên quan đến phân quyền và xác thực.
// File quan hệ: Import PrismaModule, AiModule, UserModule, JwtModule; cung cấp AuthController, AuthService, JwtStrategy, RolesGuard, AuthorizationService; export AuthService, JwtStrategy, RolesGuard, AuthorizationService.
// Chức năng đặc biệt: Đăng ký JwtModule không đồng bộ sử dụng cấu hình JWT Secret và Jwt Access Expiration từ appConfig.
// Kiến thức/Design Pattern: NestJS Module Pattern, Dependency Injection, Configuration Pattern.
// Các biến, hàm đặc biệt: Class AuthModule.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';

import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthorizationService } from '../../common/services/authorization.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from '../../config/app.config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: appConfig().jwtSecret,
        signOptions: { expiresIn: appConfig().jwtAccessExpiration as '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, AuthorizationService],
  exports: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    AuthorizationService,
    JwtModule,
  ],
})
export class AuthModule {}
