import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { appConfig } from '../../../config/app.config';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';
import { EmbeddingCacheService } from './embedding-cache.service';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private readonly cacheService: EmbeddingCacheService) {
    this.openai = new OpenAI({
      apiKey: appConfig().openaiApiKey || 'dummy-key',
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();

    const cached = await this.cacheService.get(normalizedText);
    if (cached) return cached;

    const response = await this.openai.embeddings.create({
      model: AI_CONSTANTS.MODELS.EMBEDDING,
      input: text,
    });

    const vector = response.data[0].embedding;
    await this.cacheService.set(normalizedText, vector);

    return vector;
  }

  async chatCompletion(
    systemPrompt: string,
    chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: AI_CONSTANTS.MODELS.CHAT,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...chatHistory,
      ],
      response_format: { type: 'json_object' },
      temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE,
    });

    return completion.choices[0].message.content || '{}';
  }
}
