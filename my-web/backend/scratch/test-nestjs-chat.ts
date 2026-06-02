import * as path from 'path';
import * as fs from 'fs';

// Load .env file thủ công từ thư mục backend
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/modules/ai/ai.service';
import { PrismaService } from '../src/database/prisma.service';
import { UserRole } from '@prisma/client';

async function bootstrap() {
  console.log('Khởi tạo NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);
  const prisma = app.get(PrismaService);

  console.log('Tìm kiếm user CUSTOMER trong DB...');
  const customer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER }
  });

  if (!customer) {
    console.error('KHÔNG TÌM THẤY USER CUSTOMER NÀO TRONG DB!');
    await app.close();
    return;
  }

  console.log(`Tìm thấy user CUSTOMER ID = ${customer.id}. Tiến hành gọi AiService.chat()...`);
  try {
    const result = await aiService.chat(
      customer.id, // userId CUSTOMER hợp lệ
      'Tôi muốn ăn cơm trưa dưới 100k đi cùng bạn bè', // message để sinh ra gợi ý hoặc hỏi thêm
      10.7769, // lat
      106.7009, // lng
      'TP. Hồ Chí Minh', // city
      'Quận 1', // district
      28, // temperature
      false // isRaining
    );
    console.log('KẾT QUẢ CHAT THÀNH CÔNG:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('KẾT QUẢ CHAT BỊ LỖI:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
