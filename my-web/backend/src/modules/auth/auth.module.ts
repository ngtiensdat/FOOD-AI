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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signOptions: { expiresIn: appConfig().jwtAccessExpiration as any },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, AuthorizationService],
  exports: [AuthService, JwtStrategy, RolesGuard, AuthorizationService],
})
export class AuthModule {}
