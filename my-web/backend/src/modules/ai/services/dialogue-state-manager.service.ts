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

  private normalizeArray(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) {
      if (
        val.length > 1 &&
        val.every((item) => typeof item === 'string' && item.length === 1)
      ) {
        return [val.join('')];
      }
      return val.filter(
        (x) => typeof x === 'string' && x.trim() && x.toLowerCase() !== 'none',
      );
    }
    if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'none') {
      return val.includes(',')
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [val.trim()];
    }
    return [];
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
    const existingSlots = currentState.slots || {};
    const mergedAllergies = Array.from(
      new Set([
        ...this.normalizeArray(existingSlots.allergies),
        ...this.normalizeArray(newSlots?.allergies),
      ]),
    );
    const mergedDislikes = Array.from(
      new Set([
        ...this.normalizeArray(existingSlots.dislikes),
        ...this.normalizeArray(newSlots?.dislikes),
      ]),
    );

    const mergedState: DialogueState = {
      title: title || currentState.title,
      current_stage: stage,
      slots: {
        ...existingSlots,
        ...newSlots,
        allergies: mergedAllergies.length > 0 ? mergedAllergies : undefined,
        dislikes: mergedDislikes.length > 0 ? mergedDislikes : undefined,
        persona:
          existingSlots.persona === 'PREGNANT' &&
          newSlots?.persona !== 'PREGNANT'
            ? 'PREGNANT'
            : newSlots?.persona || existingSlots.persona,
        specialNotes: newSlots?.specialNotes || existingSlots.specialNotes,
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
