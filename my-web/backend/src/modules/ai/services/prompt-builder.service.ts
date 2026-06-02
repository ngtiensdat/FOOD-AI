import { Injectable } from '@nestjs/common';
import { Favorite, History, UserProfile } from '@prisma/client';
import { SYSTEM_PROMPT_TEMPLATE } from '../prompts/system.prompt';
import { RECOMMENDATION_PROMPT_TEMPLATE } from '../prompts/recommendation.prompt';
import { SLOT_FILLING_PROMPT_TEMPLATE } from '../prompts/slot-filling.prompt';
import { AI_CONSTANTS } from '../../../common/constants/ai.constant';

type FavoriteWithFood = Favorite & { food: { name: string } };
type HistoryWithFood = History & { food: { name: string } | null };

@Injectable()
export class PromptBuilderService {
  buildUserPrefContext(
    profile: UserProfile | null,
    favorites: FavoriteWithFood[],
    histories: HistoryWithFood[],
  ): string {
    const prefList: string[] = [];
    if (profile && profile.preferences) {
      const prefs = profile.preferences as Record<string, string>;
      if (prefs.goal) {
        prefList.push(
          `Mục tiêu: ${AI_CONSTANTS.GOAL_MAP[prefs.goal] || prefs.goal}`,
        );
      }
      if (prefs.cuisine) prefList.push(`Gu: ${prefs.cuisine}`);
      if (prefs.budget) prefList.push(`Ngân sách: ${prefs.budget}`);
    }

    if (favorites.length > 0) {
      prefList.push(
        `Yêu thích: ${favorites.map((f) => f.food.name).join(', ')}`,
      );
    }
    if (histories.length > 0) {
      prefList.push(
        `Vừa xem: ${histories
          .map((h) => h.food?.name)
          .filter(Boolean)
          .join(', ')}`,
      );
    }

    return prefList.length > 0
      ? `\nĐÂY LÀ THÔNG TIN NGƯỜI DÙNG:\n${prefList.map((item) => `- ${item}`).join('\n')}\n`
      : '';
  }

  buildRecommendationPrompt(
    candidates: Array<{
      id: number;
      name: string;
      price: number;
      similarity: number;
    }>,
  ): string {
    // Tối ưu hóa tối đa Token Cost: chỉ giữ lại { id, name, price, similarity } đúng theo Yêu cầu 8
    const optimizedCandidates = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      price: c.price,
      similarity: c.similarity,
    }));

    return RECOMMENDATION_PROMPT_TEMPLATE.replace(
      '{candidatesJson}',
      JSON.stringify(optimizedCandidates),
    );
  }

  buildSlotFillingPrompt(missingSlots: string[]): string {
    return SLOT_FILLING_PROMPT_TEMPLATE.replace(
      '{missingSlots}',
      missingSlots.join(', '),
    );
  }

  buildSystemPrompt(
    currentDayTimeStr: string,
    userPrefContext: string,
    promptInstructions: string,
    currentSlotsJson: string,
  ): string {
    return SYSTEM_PROMPT_TEMPLATE.replace(
      '{currentDayTimeStr}',
      currentDayTimeStr,
    )
      .replace(
        '{userPrefContext}',
        userPrefContext || '- Chưa có thông tin sở thích',
      )
      .replace('{promptInstructions}', promptInstructions)
      .replace('{currentSlotsJson}', currentSlotsJson);
  }
}
