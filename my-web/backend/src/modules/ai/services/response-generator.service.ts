// Mục đích file này để làm gì: Sinh ra câu trả lời hội thoại và đề xuất món ăn ở dạng JSON có cấu trúc.
// Các file khác hay file này có ý nghĩa như nào: Được gọi bởi AiService ở cuối luồng xử lý hội thoại để chuẩn bị phản hồi cho người dùng.
// Các chức năng đặc biệt: Tích hợp LangChain .withStructuredOutput() để sinh JSON theo đúng schema, xác thực danh sách món ăn đề xuất tránh ảo giác (hallucination).
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility, Dependency Injection.
// Các biến, hàm đặc biệt trong file: ResponseGeneratorService.

import { Injectable, Logger } from '@nestjs/common';
import { SearchResult } from '../vector.repository';
import { MESSAGES } from '../../../common/constants/messages.constant';
import { DialogueState } from '../interfaces/dialogue-state.interface';
import { LangchainService } from './langchain.service';

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

  constructor(private readonly langchainService: LangchainService) {}

  async generateResponse(
    systemPrompt: string,
    chatHistory: Array<{ role: string; content: string }>,
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
    const structuredLlm = this.langchainService.chatModel.withStructuredOutput(
      {
        type: 'object',
        properties: {
          slots: {
            type: 'object',
            properties: {
              cuisineType: { type: 'string' },
              category: { type: 'string', enum: ['FOOD', 'DRINK', 'ALL'] },
              budget: { type: 'number' },
              companion: {
                type: 'string',
                enum: ['SINGLE', 'FAMILY', 'DATE', 'FRIENDS'],
              },
              mobility: { type: 'string', enum: ['LAZY', 'EXPLORE', 'NORMAL'] },
              emotion: {
                type: 'string',
                enum: ['TIRED', 'REWARD', 'STRESSED', 'NORMAL'],
              },
              allergies: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          current_stage: {
            type: 'string',
            enum: ['COLLECTING', 'RECOMMENDED', 'FEEDBACK'],
          },
          rejected_food_ids: {
            type: 'array',
            items: { type: 'number' },
          },
          title: { type: 'string' },
          reply: { type: 'string' },
          suggestedFoodIds: {
            type: 'array',
            items: { type: 'number' },
          },
          quickReplies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                text: { type: 'string' },
              },
              required: ['label', 'text'],
            },
          },
          assessment: {
            type: 'object',
            properties: {
              mainNeed: { type: 'string' },
              secondaryNeeds: {
                type: 'array',
                items: { type: 'string' },
              },
              confidence: { type: 'number' },
              explanation: { type: 'string' },
            },
            required: [
              'mainNeed',
              'secondaryNeeds',
              'confidence',
              'explanation',
            ],
          },
        },
        required: [
          'slots',
          'current_stage',
          'reply',
          'suggestedFoodIds',
          'quickReplies',
        ],
      },
      {
        name: 'response_generator',
      },
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((m) => ({
        role:
          m.role === 'assistant'
            ? 'assistant'
            : m.role === 'system'
              ? 'system'
              : 'user',
        content:
          typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    ];

    let parsed: ParsedOpenAiResponse;
    try {
      parsed = await structuredLlm.invoke(messages);
    } catch (err) {
      this.logger.error(
        'Failed to generate response using LangChain structured LLM, falling back to empty response.',
        err,
      );
      parsed = {
        reply: MESSAGES.AI.SYSTEM_ERROR_FALLBACK,
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
