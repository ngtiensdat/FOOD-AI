import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3001;
  console.log(`--- HỆ THỐNG ĐANG KHỞI ĐỘNG TRÊN CỔNG: ${port} ---`);
  await app.listen(port);
  console.log(`--- BACKEND ĐÃ SẴN SÀNG ---`);
}
bootstrap();
