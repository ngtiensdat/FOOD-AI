/**
 * Mục đích: Service cung cấp kiến thức ẩm thực, tư vấn sức khỏe và cảnh báo nguy cơ thực phẩm gây hại cho người dùng.
 * File quan hệ: Được gọi bởi AiService để đính kèm lời khuyên và chỉ thị cảnh báo sức khỏe vào prompt.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AI_RULES } from '../constants/ai-rules.constant';
import {
  expandAllergens,
  stripVietnameseDiacritics,
} from '../constants/allergen-ontology.constant';

export interface HealthHazardInfo {
  hazardType: string;
  warningMessage: string;
  scientificReason: string;
  safeAlternativeSuggestion: string;
}

@Injectable()
export class FoodKnowledgeService {
  private readonly logger = new Logger(FoodKnowledgeService.name);

  getWellnessAdvice(
    message: string,
  ): { advice: string; targetCuisines: string[] } | null {
    const msgLower = message.toLowerCase().trim();

    if (
      AI_RULES.WELLNESS_KEYWORDS.STRESSED.some((kw) => msgLower.includes(kw))
    ) {
      return AI_RULES.WELLNESS_ADVICE.STRESSED;
    }
    if (AI_RULES.WELLNESS_KEYWORDS.TIRED.some((kw) => msgLower.includes(kw))) {
      return AI_RULES.WELLNESS_ADVICE.TIRED;
    }
    if (AI_RULES.WELLNESS_KEYWORDS.DIET.some((kw) => msgLower.includes(kw))) {
      return AI_RULES.WELLNESS_ADVICE.DIET;
    }
    if (
      AI_RULES.WELLNESS_KEYWORDS.COLD_WEATHER.some((kw) =>
        msgLower.includes(kw),
      )
    ) {
      return AI_RULES.WELLNESS_ADVICE.COLD_WEATHER;
    }

    return null;
  }

  /**
   * Phát hiện các trường hợp thực phẩm hoặc yêu cầu món ăn GÂY HẠI cho sức khỏe người dùng:
   * 1. Mẹ bầu (PREGNANT): Cháo lòng, nội tạng, tiết canh, đồ sống/tái, rau co bóp tử cung, rượu bia.
   * 2. Dị ứng (ALLERGIES): Yêu cầu hoặc đề cập đến chất dị ứng hay dị ứng chéo.
   * 3. Bệnh lý dạ dày (STOMACH): Món cay nóng nồng độ cao, chua gắt, rượu bia.
   * 4. Bệnh tiểu đường (DIABETIC): Đồ ngọt nhiều đường hấp thu nhanh.
   * 5. Bệnh Gout (GOUT): Món giàu purin, nội tạng, hải sản, rượu bia.
   * 6. Người đang ốm sốt (FEVER): Đồ lạnh buốt, kem, đồ chiên ngập dầu.
   */
  detectHealthHazard(
    message: string,
    userSlots?: Record<string, any>,
    userProfilePrefs?: Record<string, any>,
  ): HealthHazardInfo | null {
    const msgRaw = message.toLowerCase().trim();
    const msgNormalized = stripVietnameseDiacritics(msgRaw);

    const persona = userSlots?.persona || userProfilePrefs?.persona;
    const specialNotes = (
      (userSlots?.specialNotes ||
        userProfilePrefs?.specialNotes ||
        '') as string
    ).toLowerCase();
    const allergies = userSlots?.allergies || userProfilePrefs?.allergies || [];

    // Kiểm tra bối cảnh mẹ bầu
    const isPregnant =
      persona === 'PREGNANT' ||
      specialNotes.includes('bầu') ||
      specialNotes.includes('mang thai') ||
      specialNotes.includes('thai kỳ') ||
      msgRaw.includes('bầu') ||
      msgRaw.includes('mang thai') ||
      msgRaw.includes('có thai');

    if (isPregnant) {
      const hazardOrgans = AI_RULES.HEALTH_HAZARDS.PREGNANT_ORGAN_AND_RAW;
      const isOrganOrRaw = hazardOrgans.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isOrganOrRaw) {
        return {
          hazardType: hazardOrgans.hazardType,
          warningMessage: hazardOrgans.warningMessage,
          scientificReason: hazardOrgans.scientificReason,
          safeAlternativeSuggestion: hazardOrgans.safeAlternativeSuggestion,
        };
      }

      const hazardUterine =
        AI_RULES.HEALTH_HAZARDS.PREGNANT_UTERINE_CONTRACTION;
      const isUterine = hazardUterine.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isUterine) {
        return {
          hazardType: hazardUterine.hazardType,
          warningMessage: hazardUterine.warningMessage,
          scientificReason: hazardUterine.scientificReason,
          safeAlternativeSuggestion: hazardUterine.safeAlternativeSuggestion,
        };
      }
    }

    // Kiểm tra bối cảnh dị ứng
    if (Array.isArray(allergies) && allergies.length > 0) {
      const { canonicalNames, crossReactionsInfo, searchKeywords } =
        expandAllergens(allergies);
      const isAllergenMentioned =
        canonicalNames.some((allergen) => {
          const aNorm = stripVietnameseDiacritics(allergen.toLowerCase());
          return (
            msgRaw.includes(allergen.toLowerCase()) ||
            msgNormalized.includes(aNorm)
          );
        }) ||
        searchKeywords.some((keyword) => {
          const kNorm = stripVietnameseDiacritics(keyword.toLowerCase());
          // Sử dụng boundary hoặc includes với từ khóa có độ dài >= 2 ký tự
          if (kNorm.length < 2) return false;
          return msgNormalized.includes(kNorm);
        });

      if (isAllergenMentioned) {
        return {
          hazardType: `Dị ứng thực phẩm (${canonicalNames.join(', ')})`,
          warningMessage: `⚠️ Cảnh báo nguy cơ sốc phản vệ: Bạn đang yêu cầu hoặc đề cập đến thực phẩm thuộc nhóm dị ứng đã đăng ký (${canonicalNames.join(', ')})!`,
          scientificReason: `Ăn phải thực phẩm dị ứng có thể kích hoạt phản ứng miễn dịch cấp tính nghiêm trọng: nổi mề đay, khó thở, co thắt phế quản, tụt huyết áp và sốc phản vệ nguy hiểm tính mạng. ${crossReactionsInfo.join(' ')}`,
          safeAlternativeSuggestion:
            'Các món ăn thanh đạm, chế biến lành tính hoàn toàn không chứa thành phần gây dị ứng trên.',
        };
      }
    }

    // Kiểm tra bệnh lý dạ dày
    const isStomach =
      specialNotes.includes('dạ dày') ||
      specialNotes.includes('bao tử') ||
      specialNotes.includes('trào ngược') ||
      msgRaw.includes('đau dạ dày') ||
      msgRaw.includes('đau bao tử');

    if (isStomach) {
      const hazardStomach = AI_RULES.HEALTH_HAZARDS.STOMACH_ULCER_SPICY;
      const isSpicy = hazardStomach.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isSpicy) {
        return {
          hazardType: hazardStomach.hazardType,
          warningMessage: hazardStomach.warningMessage,
          scientificReason: hazardStomach.scientificReason,
          safeAlternativeSuggestion: hazardStomach.safeAlternativeSuggestion,
        };
      }
    }

    // Kiểm tra bệnh tiểu đường
    const isDiabetic =
      specialNotes.includes('tiểu đường') ||
      specialNotes.includes('đái tháo đường') ||
      specialNotes.includes('đường huyết') ||
      msgRaw.includes('tiểu đường');

    if (isDiabetic) {
      const hazardDiabetic = AI_RULES.HEALTH_HAZARDS.DIABETIC_HIGH_SUGAR;
      const isSweet = hazardDiabetic.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isSweet) {
        return {
          hazardType: hazardDiabetic.hazardType,
          warningMessage: hazardDiabetic.warningMessage,
          scientificReason: hazardDiabetic.scientificReason,
          safeAlternativeSuggestion: hazardDiabetic.safeAlternativeSuggestion,
        };
      }
    }

    // Kiểm tra bệnh Gout
    const isGout =
      specialNotes.includes('gout') ||
      specialNotes.includes('gút') ||
      specialNotes.includes('axit uric') ||
      msgRaw.includes('bị gout') ||
      msgRaw.includes('bị gút');

    if (isGout) {
      const hazardGout = AI_RULES.HEALTH_HAZARDS.GOUT_HIGH_PURINE;
      const isPurine = hazardGout.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isPurine) {
        return {
          hazardType: hazardGout.hazardType,
          warningMessage: hazardGout.warningMessage,
          scientificReason: hazardGout.scientificReason,
          safeAlternativeSuggestion: hazardGout.safeAlternativeSuggestion,
        };
      }
    }

    // Kiểm tra người đang ốm sốt
    const isFever =
      persona === 'WELLNESS' ||
      specialNotes.includes('ốm') ||
      specialNotes.includes('sốt') ||
      msgRaw.includes('đang ốm') ||
      msgRaw.includes('bị sốt') ||
      msgRaw.includes('cảm cúm');

    if (isFever) {
      const hazardCold = AI_RULES.HEALTH_HAZARDS.FEVER_COLD_IRRITATION;
      const isColdFood = hazardCold.triggers.some((tr) => {
        const trNorm = stripVietnameseDiacritics(tr);
        return msgRaw.includes(tr) || msgNormalized.includes(trNorm);
      });
      if (isColdFood) {
        return {
          hazardType: hazardCold.hazardType,
          warningMessage: hazardCold.warningMessage,
          scientificReason: hazardCold.scientificReason,
          safeAlternativeSuggestion: hazardCold.safeAlternativeSuggestion,
        };
      }
    }

    return null;
  }
}
