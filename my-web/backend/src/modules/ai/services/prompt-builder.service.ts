// Mục đích file này để làm gì: Xây dựng các nội dung prompt hệ thống động (tổng hợp bối cảnh, dị ứng, địa lý, món ăn gợi ý).
// Các file khác hay file này có ý nghĩa như nào: Được gọi bởi AiService để sinh các prompt chỉ dẫn trước khi gửi cho LLM.
// Các chức năng đặc biệt: Tích hợp LangChain PromptTemplate để format prompt động và quản lý placeholders.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: Single Responsibility, Dependency Injection.
// Các biến, hàm đặc biệt trong file: PromptBuilderService.

import { Injectable } from '@nestjs/common';
import { Favorite, History, UserProfile } from '@prisma/client';
import { PromptTemplate } from '@langchain/core/prompts';
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
    feedbackProfile?: {
      likedFoods: string[];
      likedCategories: string[];
      dislikedFoods: string[];
      dislikedCategories: string[];
    },
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

    let contextStr =
      prefList.length > 0
        ? `\nĐÂY LÀ THÔNG TIN NGƯỜI DÙNG:\n${prefList.map((item) => `- ${item}`).join('\n')}\n`
        : '';

    if (feedbackProfile) {
      let feedbackContext = `\nTHÔNG TIN HỌC ĐƯỢC TỪ FEEDBACK:\n`;
      let hasFeedback = false;
      if (
        feedbackProfile.likedFoods.length > 0 ||
        feedbackProfile.likedCategories.length > 0
      ) {
        feedbackContext += `- Người dùng thích:\n`;
        feedbackProfile.likedFoods.forEach((food) => {
          feedbackContext += `  + ${food}\n`;
        });
        feedbackProfile.likedCategories.forEach((cat) => {
          feedbackContext += `  + Thể loại: ${cat}\n`;
        });
        hasFeedback = true;
      }
      if (
        feedbackProfile.dislikedFoods.length > 0 ||
        feedbackProfile.dislikedCategories.length > 0
      ) {
        feedbackContext += `- Người dùng không thích:\n`;
        feedbackProfile.dislikedFoods.forEach((food) => {
          feedbackContext += `  + ${food}\n`;
        });
        feedbackProfile.dislikedCategories.forEach((cat) => {
          feedbackContext += `  + Thể loại: ${cat}\n`;
        });
        hasFeedback = true;
      }

      if (hasFeedback) {
        contextStr += feedbackContext;
      }
    }

    return contextStr;
  }

  async buildRecommendationPrompt(): Promise<string> {
    const template = PromptTemplate.fromTemplate(
      RECOMMENDATION_PROMPT_TEMPLATE,
    );
    return template.format({});
  }

  buildCandidatesSection(
    candidates: Array<{
      id: number;
      name: string;
      price: number;
      similarity: number;
      restaurantName: string;
      distance_km: number | null;
      image: string | null;
    }>,
  ): string {
    if (!candidates || candidates.length === 0) {
      return '- Không có món ăn nào phù hợp trong cơ sở dữ liệu hiện tại.';
    }

    // Tối ưu hóa: chỉ gửi tối đa top 5 ứng viên tương đồng nhất để tiết kiệm token
    const topCandidates = candidates.slice(0, 5);

    const optimized = topCandidates.map((c) => ({
      id: c.id,
      name: c.name,
      price: c.price,
      similarity: c.similarity,
      restaurantName: c.restaurantName,
      distance_km:
        c.distance_km !== null ? Number(c.distance_km.toFixed(1)) : null,
      image: c.image || '/placeholder-food.png',
    }));

    return JSON.stringify(optimized, null, 2);
  }

  async buildSlotFillingPrompt(missingSlots: string[]): Promise<string> {
    const template = PromptTemplate.fromTemplate(SLOT_FILLING_PROMPT_TEMPLATE);
    return template.format({
      missingSlots: missingSlots.join(', '),
    });
  }

  async buildSystemPrompt(
    currentDayTimeStr: string,
    userPrefContext: string,
    promptInstructions: string,
    currentSlotsJson: string,
    candidatesSection: string,
  ): Promise<string> {
    const template = PromptTemplate.fromTemplate(SYSTEM_PROMPT_TEMPLATE);
    return template.format({
      currentDayTimeStr,
      userPrefContext: userPrefContext || '- Chưa có thông tin sở thích',
      promptInstructions,
      currentSlotsJson,
      candidatesSection,
    });
  }
}
