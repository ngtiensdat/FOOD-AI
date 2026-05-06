import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key', // Nên để trong .env
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
