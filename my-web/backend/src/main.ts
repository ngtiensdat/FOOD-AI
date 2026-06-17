import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

import { Request, Response, NextFunction } from 'express';

import { appConfig } from './config/app.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = appConfig();

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ThrottlerExceptionFilter(),
  );

  // Thêm logger đơn giản để kiểm tra request có đến được server không (chỉ log ở môi trường development)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log(
        `[Request] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`,
      );
    }
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [config.frontendUrl, 'http://127.0.0.1:3000'];
      const isDev = process.env.NODE_ENV !== 'production';

      // Cho phép localhost, 127.0.0.1 và các dải IP cục bộ trong môi trường dev
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDev &&
          (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin)))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  await app.listen(config.port);
  logger.log(`--- BACKEND ĐÃ SẴN SÀNG TRÊN CỔNG: ${config.port} ---`);
}
bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Error during bootstrap:', err);
});
// Trigger clean reload
