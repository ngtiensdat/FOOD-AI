import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiService } from '../modules/ai/ai.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);
  const prisma = app.get(PrismaService);

  console.log('Finding a customer to run the test...');
  const customer = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER },
  });

  if (!customer) {
    console.error(
      'No customer found in the database. Please register/create a customer first.',
    );
    await app.close();
    return;
  }

  console.log(`Using customer ID: ${customer.id}, email: ${customer.email}`);

  // Test cases
  const queries = [
    'Tôi muốn ăn bún ngan',
    'Tìm quán xôi ở Hà Nội',
    'gợi ý cho tôi món ăn hàn quốc',
    'tôi muốn 1 bữa ăn sang chảnh',
    'tôi buồn quá',
  ];

  for (const query of queries) {
    console.log('\n======================================');
    console.log(`USER QUERY: "${query}"`);
    console.log('======================================');
    try {
      const result = await aiService.chat(
        customer.id,
        query,
        21.0285, // lat (Hanoi)
        105.8542, // lng (Hanoi)
        'Hà Nội',
        undefined,
        undefined,
        undefined,
      );
      console.log('AI REPLY:', result.reply);
      console.log('SUGGESTIONS COUNT:', result.suggestions.length);
      console.log(
        'SUGGESTIONS:',
        result.suggestions.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          restaurantName: s.restaurantName,
          similarity: s.similarity,
        })),
      );
    } catch (e) {
      console.error(`ERROR running query "${query}":`, e);
    }
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error in test-chatbot:', err);
});
