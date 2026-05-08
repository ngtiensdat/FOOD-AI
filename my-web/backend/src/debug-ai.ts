import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AiService } from './modules/ai/ai.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);

  console.log('Testing AI Service...');
  try {
    const result = await aiService.getEmbedding('Test');
    console.log('Success! Vector length:', result.length);
  } catch (e) {
    console.error('FAILED TO CALL AI SERVICE:', e);
  }
  await app.close();
}

bootstrap();
