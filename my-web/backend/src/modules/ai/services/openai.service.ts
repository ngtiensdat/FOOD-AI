import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { appConfig } from '../../../config/app.config';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';
import { EmbeddingCacheService } from './embedding-cache.service';
import { CircuitBreaker } from '../../../common/utils/circuit-breaker';
import { retry } from '../../../common/utils/retry.helper';
import { RedisService } from './redis.service';
import { BudgetTrackerService } from './budget-tracker.service';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly embeddingBreaker: CircuitBreaker<[string], number[]>;
  private readonly chatBreaker: CircuitBreaker<
    [string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]],
    string
  >;

  constructor(
    private readonly cacheService: EmbeddingCacheService,
    private readonly redisService: RedisService,
    private readonly budgetTracker: BudgetTrackerService,
  ) {
    this.openai = new OpenAI({
      apiKey: appConfig().openaiApiKey || 'dummy-key',
    });

    // Thiết lập Circuit Breaker cho Embedding: Ngắt mạch sau 5 lần lỗi liên tiếp, cooldown 30s
    this.embeddingBreaker = new CircuitBreaker(
      async (text: string) => {
        return retry(
          async () => {
            const response = await this.openai.embeddings.create({
              model: AI_CONSTANTS.MODELS.EMBEDDING,
              input: text,
            });
            return response.data[0].embedding;
          },
          3, // 3 lần retry
          500, // delay 500ms
          2, // exponential backoff multiplier
        );
      },
      {
        failureThreshold: 5,
        cooldownPeriodMs: 30000,
        // Fallback: Vector mặc định (1536 chiều) tránh cascade crash
        fallbackValue: new Array(1536).fill(0),
      },
    );

    // Thiết lập Circuit Breaker cho Chat Completion: Ngắt mạch sau 5 lần lỗi liên tiếp, cooldown 30s
    this.chatBreaker = new CircuitBreaker(
      async (
        systemPrompt: string,
        chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      ) => {
        return retry(
          async () => {
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

            // Ghi nhận và theo dõi Token Usage
            const usage = completion.usage;
            if (usage) {
              this.logger.log(
                `[Token Usage] Prompt: ${usage.prompt_tokens} | Completion: ${usage.completion_tokens} | Total: ${usage.total_tokens}`,
              );

              // Lưu lượng tiêu thụ hàng ngày trong Redis để theo dõi chi phí
              const todayStr = new Date().toISOString().split('T')[0];
              void Promise.all([
                this.redisService.incrBy(
                  `tokens:usage:${todayStr}:prompt`,
                  usage.prompt_tokens,
                  86400 * 7,
                ),
                this.redisService.incrBy(
                  `tokens:usage:${todayStr}:completion`,
                  usage.completion_tokens,
                  86400 * 7,
                ),
                this.redisService.incrBy(
                  `tokens:usage:${todayStr}:total`,
                  usage.total_tokens,
                  86400 * 7,
                ),
              ])
                .then(async () => {
                  await this.budgetTracker.checkBudget();
                })
                .catch((err) => {
                  this.logger.warn(
                    `Failed to track daily token usage or check budget in Redis: ${err instanceof Error ? err.message : String(err)}`,
                  );
                });
            }

            return completion.choices[0].message.content || '{}';
          },
          3,
          500,
          2,
        );
      },
      {
        failureThreshold: 5,
        cooldownPeriodMs: 30000,
        fallbackValue: JSON.stringify({
          reply:
            'Xin lỗi, dịch vụ AI hiện tại đang quá tải hoặc gặp sự cố. Bạn vui lòng thử lại sau giây lát!',
          intent: 'unknown',
        }),
      },
    );
  }

  async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();

    const cached = await this.cacheService.get(normalizedText);
    if (cached) return cached;

    const vector = await this.embeddingBreaker.execute(text);
    await this.cacheService.set(normalizedText, vector);

    return vector;
  }

  async chatCompletion(
    systemPrompt: string,
    chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<string> {
    return this.chatBreaker.execute(systemPrompt, chatHistory);
  }
}
