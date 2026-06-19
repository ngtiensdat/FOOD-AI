// Mục đích file này để làm gì: Đóng vai trò là lớp Caching và Circuit Breaker bọc ngoài LangChain Embeddings.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng bởi các service (như Reranking, AiService) để lấy vector embeddings một cách an toàn và tối ưu chi phí.
// Các chức năng đặc biệt: Tích hợp Redis Caching để tránh gọi API trùng lặp, và Circuit Breaker để tự ngắt mạch khi OpenAI lỗi.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Circuit Breaker Pattern, Caching Pattern, Dependency Injection.
// Các biến, hàm đặc biệt trong file: OpenAIService.

import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingCacheService } from './embedding-cache.service';
import { CircuitBreaker } from '../../../common/utils/circuit-breaker';
import { retry } from '../../../common/utils/retry.helper';
import { LangchainService } from './langchain.service';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly embeddingBreaker: CircuitBreaker<[string], number[]>;

  constructor(
    private readonly cacheService: EmbeddingCacheService,
    private readonly langchainService: LangchainService,
  ) {
    // Thiết lập Circuit Breaker cho Embedding: Ngắt mạch sau 5 lần lỗi liên tiếp, cooldown 30s
    this.embeddingBreaker = new CircuitBreaker(
      async (text: string) => {
        return retry(
          async () => {
            return await this.langchainService.embeddings.embedQuery(text);
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
  }

  async getEmbedding(text: string): Promise<number[]> {
    const normalizedText = text.toLowerCase().trim();

    const cached = await this.cacheService.get(normalizedText);
    if (cached) return cached;

    const vector = await this.embeddingBreaker.execute(text);
    await this.cacheService.set(normalizedText, vector);

    return vector;
  }
}
