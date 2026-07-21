/**
 * Mục đích: Service quản lý việc lưu và đọc trạng thái hội thoại (DialogueState) trong database.
 * File quan hệ: Được gọi bởi DialogueStateManagerService để đồng bộ bối cảnh.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { RedisService } from '../../../common/redis/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationStateService {
  private readonly logger = new Logger(ConversationStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async acquireLock(conversationId: number): Promise<() => Promise<void>> {
    const lockKey = `lock:conversation:${conversationId}`;
    return this.redisService.acquireLock(lockKey, 10000, 10, 150);
  }

  async getConversationMetadata(
    conversationId: number,
  ): Promise<DialogueState> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { metadata: true },
    });
    return (
      (conversation?.metadata as unknown as DialogueState) || {
        slots: {},
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
        suggested_food_ids: [],
      }
    );
  }

  async updateConversationMetadata(
    conversationId: number,
    metadata: DialogueState,
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { metadata: metadata as unknown as Prisma.InputJsonValue },
    });
  }
}
