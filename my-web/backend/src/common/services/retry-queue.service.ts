import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { RedisService } from '../../modules/ai/services/redis.service';

export interface RetryJob {
  type: 'food' | 'user' | 'post';
  id: number;
}

@Injectable()
export class RetryQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetryQueueService.name);
  private readonly queueKey = 'ai:embeddings:dlq';
  private intervalId: NodeJS.Timeout | null = null;
  private processHandler: ((job: RetryJob) => Promise<void>) | null = null;

  constructor(private readonly redisService: RedisService) {}

  registerHandler(handler: (job: RetryJob) => Promise<void>) {
    this.processHandler = handler;
  }

  async pushToQueue(type: 'food' | 'user' | 'post', id: number) {
    const jobPayload: RetryJob = { type, id };
    this.logger.log(
      `Pushing failed embedding job to DLQ: ${JSON.stringify(jobPayload)}`,
    );
    await this.redisService.rpush(this.queueKey, JSON.stringify(jobPayload));
  }

  onModuleInit() {
    // Start background queue processing interval (every 30 minutes)
    // 30 minutes = 30 * 60 * 1000 = 1,800,000 ms
    const intervalMs = 30 * 60 * 1000;
    this.intervalId = setInterval(() => {
      void this.processQueue();
    }, intervalMs);
    this.logger.log(
      `RetryQueueService initialized with a 30-minute processing interval.`,
    );
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async processQueue() {
    if (!this.processHandler) {
      this.logger.warn(
        'No handler registered in RetryQueueService. Skipping queue processing.',
      );
      return;
    }

    this.logger.log('Starting DLQ background reprocessing...');
    let processedCount = 0;
    let jobStr = await this.redisService.lpop(this.queueKey);

    while (jobStr) {
      try {
        const job = JSON.parse(jobStr) as RetryJob;
        this.logger.log(`Reprocessing queued embedding job: ${jobStr}`);
        await this.processHandler(job);
        processedCount++;
      } catch (err) {
        this.logger.error(
          `Failed to reprocess queued embedding job: ${jobStr}. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      jobStr = await this.redisService.lpop(this.queueKey);
    }

    this.logger.log(
      `Finished DLQ background reprocessing. Total processed: ${processedCount}`,
    );
  }
}
