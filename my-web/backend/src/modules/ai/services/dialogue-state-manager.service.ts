/**
 * Mục đích: Service quản lý và cập nhật tiến trình Dialogue State (COLLECTING, RECOMMENDED, FEEDBACK).
 * File quan hệ: Gọi ConversationStateService và cung cấp API trạng thái hội thoại cho AiService.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { ConversationStateService } from './conversation-state.service';
import { MessageRole } from '@prisma/client';

@Injectable()
export class DialogueStateManagerService {
  private readonly logger = new Logger(DialogueStateManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationState: ConversationStateService,
  ) {}

  async loadOrCreateState(
    conversationId: number,
    userId: number,
    defaultTitle: string,
  ): Promise<DialogueState> {
    return this.conversationState.getConversationMetadata(conversationId);
  }

  async saveMessage(
    conversationId: number,
    role: MessageRole,
    content: string,
  ): Promise<void> {
    await this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  async getChatHistory(
    conversationId: number,
    limit: number,
  ): Promise<
    Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  > {
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return [...history].reverse().map((m) => {
      const role = (
        m.role === MessageRole.AI ? 'assistant' : m.role.toLowerCase()
      ) as 'user' | 'assistant' | 'system';
      return {
        role,
        content: m.content,
      };
    });
  }

  async updateState(
    conversationId: number,
    currentState: DialogueState,
    newSlots: Partial<DialogueState['slots']>,
    stage: 'COLLECTING' | 'RECOMMENDED' | 'FEEDBACK',
    title?: string,
    suggestedFoodIds: number[] = [],
    rejectedFoodIds: number[] = [],
  ): Promise<DialogueState> {
    const mergedState: DialogueState = {
      title: title || currentState.title,
      current_stage: stage,
      slots: {
        ...(currentState.slots || {}),
        ...newSlots,
      },
      rejected_food_ids: Array.from(
        new Set([
          ...(currentState.rejected_food_ids || []),
          ...rejectedFoodIds,
        ]),
      ),
      suggested_food_ids: suggestedFoodIds,
    };

    if (mergedState.slots.budget) {
      mergedState.slots.budget = Number(mergedState.slots.budget);
    }

    await this.conversationState.updateConversationMetadata(
      conversationId,
      mergedState,
    );
    return mergedState;
  }
}
