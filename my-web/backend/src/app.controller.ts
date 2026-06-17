import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AiService } from './modules/ai/ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-ai')
  async testAi(@Query('text') text: string) {
    const embedding = await this.aiService.getEmbedding(
      text || 'Cơm tấm Sài Gòn',
    );
    return {
      text: text || 'Cơm tấm Sài Gòn',
      vectorLength: embedding.length,
      firstTenValues: embedding.slice(0, 10),
    };
  }
}
