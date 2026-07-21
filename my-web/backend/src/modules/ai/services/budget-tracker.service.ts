import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class BudgetTrackerService {
  private readonly logger = new Logger(BudgetTrackerService.name);
  private readonly dailyBudgetLimit = 200000; // 200,000 tokens mặc định mỗi ngày (~$1-$2)

  constructor(private readonly redisService: RedisService) {}

  async getDailyTokenUsage(): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    const usageStr = await this.redisService.get(
      `tokens:usage:${todayStr}:total`,
    );
    return usageStr ? parseInt(usageStr, 10) : 0;
  }

  async checkBudget(): Promise<boolean> {
    const usage = await this.getDailyTokenUsage();
    if (usage > this.dailyBudgetLimit) {
      this.logger.warn(
        `CRITICAL: Lượng tiêu thụ token trong ngày (${usage}) đã vượt ngưỡng daily budget (${this.dailyBudgetLimit})!`,
      );
      return true;
    }
    return false;
  }
}
