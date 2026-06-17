import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';

import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthorizationService } from '../../common/services/authorization.service';
import { UserRepository } from './user.repository';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [
    AuthService,
    AdminService,
    UserRepository,
    JwtStrategy,
    RolesGuard,
    AuthorizationService,
  ],
  exports: [
    AuthService,
    AdminService,
    UserRepository,
    JwtStrategy,
    RolesGuard,
    AuthorizationService,
  ],
})
export class AuthModule {}
