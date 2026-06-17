/**
 * Mục đích: Service gửi prompt hoàn thiện lên OpenAI để sinh phản hồi JSON chuẩn hóa.
 * File quan hệ: Được gọi bởi AiService ở cuối luồng hội thoại.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { SearchResult } from '../vector.repository';
import { MESSAGES } from '../../../common/constants/messages.constant';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import OpenAI from 'openai';

interface ParsedOpenAiResponse {
  reply?: string;
  suggestedFoodIds?: unknown[];
  quickReplies?: Array<{ label: string; text: string }>;
  slots?: Partial<DialogueState['slots']>;
  title?: string;
  current_stage?: 'COLLECTING' | 'RECOMMENDED' | 'FEEDBACK';
  rejected_food_ids?: unknown[];
  assessment?: {
    mainNeed?: string;
    secondaryNeeds?: string[];
    confidence?: number | string;
    explanation?: string;
  };
}

@Injectable()
export class ResponseGeneratorService {
  private readonly logger = new Logger(ResponseGeneratorService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  async generateResponse(
    systemPrompt: string,
    chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    candidates: SearchResult[],
  ): Promise<{
    reply: string;
    suggestedFoodIds: number[];
    quickReplies: Array<{ label: string; text: string }>;
    slots: Partial<DialogueState['slots']>;
    title?: string;
    current_stage: 'COLLECTING' | 'RECOMMENDED' | 'FEEDBACK';
    rejected_food_ids: number[];
    assessment?: {
      mainNeed: string;
      secondaryNeeds: string[];
      confidence: number;
      explanation: string;
    };
  }> {
    const responseText = await this.openaiService.chatCompletion(
      systemPrompt,
      chatHistory,
    );

    let parsed: ParsedOpenAiResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch (err) {
      this.logger.error(
        'Failed to parse OpenAI response as JSON, falling back to text wrapper.',
      );
      parsed = {
        reply: responseText,
        suggestedFoodIds: [],
        quickReplies: [],
        slots: {},
        current_stage: 'COLLECTING',
        rejected_food_ids: [],
      };
    }

    // Standardize types and fill defaults
    const reply = parsed.reply || MESSAGES.AI.SYSTEM_ERROR_FALLBACK;
    const quickReplies = Array.isArray(parsed.quickReplies)
      ? parsed.quickReplies
      : [];
    const slots =
      parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {};
    const current_stage = parsed.current_stage || 'COLLECTING';
    const rejected_food_ids = Array.isArray(parsed.rejected_food_ids)
      ? parsed.rejected_food_ids.map((id: unknown) => Number(id))
      : [];

    // STRICT VALIDATION: suggestedFoodIds must belong to candidate list (no AI hallucination of IDs)
    const rawSuggestedIds = Array.isArray(parsed.suggestedFoodIds)
      ? parsed.suggestedFoodIds.map((id: unknown) => Number(id))
      : [];
    const validCandidateIds = new Set(candidates.map((c) => c.id));
    const suggestedFoodIds = rawSuggestedIds.filter((id) =>
      validCandidateIds.has(id),
    );

    // Parse and validate assessment block
    const assessment =
      parsed.assessment && typeof parsed.assessment === 'object'
        ? {
            mainNeed: String(parsed.assessment.mainNeed || ''),
            secondaryNeeds: Array.isArray(parsed.assessment.secondaryNeeds)
              ? parsed.assessment.secondaryNeeds.map(String)
              : [],
            confidence:
              typeof parsed.assessment.confidence === 'number'
                ? parsed.assessment.confidence
                : typeof parsed.assessment.confidence === 'string'
                  ? parseFloat(parsed.assessment.confidence) || 0.0
                  : 0.0,
            explanation: String(parsed.assessment.explanation || ''),
          }
        : undefined;

    this.logger.log(
      `OpenAI reply: "${reply.substring(0, 50)}..." | Validated Suggested IDs: ${JSON.stringify(suggestedFoodIds)}`,
    );

    return {
      reply,
      suggestedFoodIds,
      quickReplies,
      slots,
      title: parsed.title,
      current_stage,
      rejected_food_ids,
      assessment,
    };
  }
}
