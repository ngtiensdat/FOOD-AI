import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PARAMETERS } from '../constants/ai-parameters.constant';
import {
  DialogueState,
  SlotExtractionResult,
} from '../interfaces/dialogue-state.interface';
import { AI_RULES } from '../constants/ai-rules.constant';

@Injectable()
export class SlotExtractorService {
  private readonly logger = new Logger(SlotExtractorService.name);

  constructor(private readonly configService: ConfigService) {}

  private getParam<T>(path: string, defaultValue: T): T {
    return this.configService.get<T>(`ai.${path}`) ?? defaultValue;
  }

  extractSlotsLocally(message: string): SlotExtractionResult {
    const localSlots: SlotExtractionResult = {};
    const msgLower = message.toLowerCase().trim();

    // 1. Trích xuất ngân sách tiếng Việt tinh chuẩn (Sửa lỗi 1.5 triệu và hỗ trợ toàn diện các ca biên)
    const budget = this.parseBudget(msgLower);
    if (budget !== undefined) {
      localSlots.budget = budget;
    }

    // 1.1. Trích xuất thông tin phủ định / những thứ KHÔNG THÍCH / KIÊNG (Dislikes)
    const dislikes = this.extractDislikes(msgLower);
    if (dislikes.length > 0) {
      localSlots.dislikes = dislikes;
    }

    // 1.2. Trích xuất DỊ ỨNG (Allergies)
    const allergies = this.extractAllergies(msgLower);
    if (allergies.length > 0) {
      localSlots.allergies = allergies;
    }

    // 1.3. Trích xuất PERSONA đặc thù (GYM, PREGNANT, VEGAN, STUDENT, WEIGHT_LOSS, WELLNESS, OFFICE)
    const persona = this.extractPersona(msgLower);
    if (persona) {
      localSlots.persona = persona;
    }

    // 2. Trích xuất khẩu vị/món ăn (cuisineType) - ĐÃ BẢO VỆ CHỐNG BẪY PHỦ ĐỊNH
    const cuisineType = this.extractCuisineType(msgLower);
    if (cuisineType) {
      const isDisliked = (localSlots.dislikes || []).some(
        (d) =>
          cuisineType.toLowerCase().includes(d.toLowerCase()) ||
          d.toLowerCase().includes(cuisineType.toLowerCase()),
      );
      const isAllergen = (localSlots.allergies || []).some(
        (a) =>
          cuisineType.toLowerCase().includes(a.toLowerCase()) ||
          a.toLowerCase().includes(cuisineType.toLowerCase()),
      );
      if (!isDisliked && !isAllergen) {
        localSlots.cuisineType = cuisineType;
      }
    }

    // 3. Trích xuất các thuộc tính khác sử dụng Synonym Dictionary & Fuzzy Matching
    const synonyms = this.getParam<typeof AI_PARAMETERS.SYNONYMS>(
      'synonyms',
      AI_PARAMETERS.SYNONYMS,
    );
    const companion = this.findFuzzySlot<
      'SINGLE' | 'FAMILY' | 'DATE' | 'FRIENDS'
    >(msgLower, synonyms.companion);
    if (companion) localSlots.companion = companion;

    const mobility = this.findFuzzySlot<'LAZY' | 'EXPLORE'>(
      msgLower,
      synonyms.mobility,
    );
    if (mobility) localSlots.mobility = mobility;

    const emotion = this.findFuzzySlot<'TIRED' | 'REWARD' | 'STRESSED'>(
      msgLower,
      synonyms.emotion,
    );
    if (emotion) localSlots.emotion = emotion;

    const category = this.findFuzzySlot<'DRINK' | 'FOOD'>(
      msgLower,
      synonyms.category,
    );
    if (category) localSlots.category = category;

    return localSlots;
  }

  parseBudget(text: string): number | undefined {
    const msgLower = text.toLowerCase().trim();
    // Regex trích xuất ngân sách cao cấp hỗ trợ các ký tự phân tách hàng nghìn và phần thập phân tiếng Việt
    const budgetMatch = msgLower.match(
      /(?:dưới|tầm|khoảng|<|ngân sách)\s*([\d.,]+)\s*(k|triệu|tr|nghìn|ngàn|đ|đồng|vnd)?/i,
    );
    if (!budgetMatch) return undefined;

    let numStr = budgetMatch[1];
    const unit = budgetMatch[2]?.toLowerCase() || '';

    // Thuật toán phát hiện và chuẩn hóa số thập phân/hàng nghìn cực kỳ thông minh
    let isDecimal = false;
    if (
      (unit === 'triệu' || unit === 'tr') &&
      (numStr.includes('.') || numStr.includes(','))
    ) {
      isDecimal = true;
    }

    if (isDecimal) {
      numStr = numStr.replace(/,/g, '.'); // Chuyển phần thập phân sang dấu chấm của JS
    } else {
      numStr = numStr.replace(/[.,]/g, ''); // Bỏ dấu phân cách hàng nghìn (ví dụ "50.000" -> "50000")
    }

    let val = parseFloat(numStr);
    if (isNaN(val)) return undefined;

    if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') {
      val = val * 1000;
    } else if (unit === 'triệu' || unit === 'tr') {
      val = val * 1000000;
    } else if (val < 1000) {
      val = val * 1000; // Fallback "50" -> 50000
    }

    return val;
  }

  extractCuisineType(text: string): string | undefined {
    const msgLower = text.toLowerCase().trim();
    const triggersWithoutMon = AI_RULES.CUISINE_TRIGGERS.filter(
      (t) => t !== 'món',
    );
    const triggersPattern = triggersWithoutMon.join('|');
    const cuisineRegex = new RegExp(
      `(?:${triggersPattern})\\s+([^,.\\s]+(?:\\s+[^,.\\s]+){0,2})`,
      'i',
    );
    const cuisineMatch = msgLower.match(cuisineRegex);
    if (!cuisineMatch) return undefined;

    // Kiểm tra xem vị trí khớp có bị tiền tố phủ định chi phối không (ví dụ: "không thích", "đừng ăn", "ghét")
    if (this.isNegated(msgLower, cuisineMatch.index ?? 0)) {
      return undefined;
    }

    const extracted = cuisineMatch[1].trim();
    let filtered = extracted;

    const noiseWords = this.getParam<string[]>(
      'noiseWords',
      AI_PARAMETERS.NOISE_WORDS,
    );

    // Loại bỏ các từ khóa nhiễu ở cuối
    for (const word of noiseWords) {
      const idx = filtered.indexOf(' ' + word);
      if (idx !== -1) {
        filtered = filtered.substring(0, idx);
      }
    }

    // Loại bỏ từ thừa ở đầu
    const replacePattern = AI_RULES.CUISINE_TRIGGERS.join('|');
    const replaceRegex = new RegExp(`^(?:${replacePattern})\\s+`, 'i');
    filtered = filtered.replace(replaceRegex, '').trim();

    if (filtered && filtered.length > 2 && !noiseWords.includes(filtered)) {
      return filtered;
    }

    return undefined;
  }

  isNegated(fullText: string, matchIndex: number): boolean {
    const textBefore = fullText
      .substring(Math.max(0, matchIndex - 30), matchIndex)
      .trim();
    const negationKeywords = [
      'không',
      'chẳng',
      'chả',
      'đừng',
      'né',
      'tránh',
      'ghét',
      'sợ',
      'kiêng',
      'dị ứng',
      'hổng',
      'ko',
      'k',
    ];
    return negationKeywords.some((neg) => {
      const regex = new RegExp(
        `(?:^|\\s)${neg}(?:\\s+(?:thích|muốn|ăn|uống|dùng|cho))?\\s*$`,
        'i',
      );
      return regex.test(textBefore);
    });
  }

  extractDislikes(text: string): string[] {
    const dislikesSet = new Set<string>();
    const patterns = [
      /(?:không thích|chẳng thích|chả thích|không ăn|chẳng ăn|đừng cho|đừng ăn|né|tránh|ghét|kiêng|sợ|ko ăn|k ăn|không dùng)\s+(?:ăn\s+|món\s+)?([^.;!?\n]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const raw = match[1].trim();
        const items = raw.split(/\s+(?:và|với|hoặc)\s+|,\s*/i);
        for (const item of items) {
          const words = item.trim().split(/\s+/).slice(0, 3).join(' ');
          const cleaned = words.replace(/^(gì|món|quán|đồ)\s+/i, '').trim();
          if (cleaned.length >= 2) {
            dislikesSet.add(cleaned);
          }
        }
      }
    }
    return Array.from(dislikesSet);
  }

  extractAllergies(text: string): string[] {
    const allergiesSet = new Set<string>();
    const patterns = [/(?:dị ứng|dị ứng với|bị dị ứng)\s+([^.;!?\n]+)/gi];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const raw = match[1].trim();
        const items = raw.split(/\s+(?:và|với|hoặc)\s+|,\s*/i);
        for (const item of items) {
          const words = item.trim().split(/\s+/).slice(0, 3).join(' ');
          const cleaned = words.replace(/^(đồ|món)\s+/i, '').trim();
          if (cleaned.length >= 2) {
            allergiesSet.add(cleaned);
          }
        }
      }
    }
    return Array.from(allergiesSet);
  }

  extractPersona(text: string): DialogueState['slots']['persona'] | undefined {
    const clean = this.stripDiacritics(text.toLowerCase());

    if (
      clean.includes('tap gym') ||
      clean.includes('gym') ||
      clean.includes('tang co') ||
      clean.includes('the hinh') ||
      clean.includes('fitness') ||
      clean.includes('workout') ||
      clean.includes('bulking') ||
      clean.includes('cutting') ||
      clean.includes('do body') ||
      clean.includes('tap ta')
    ) {
      return 'GYM';
    }

    if (
      clean.includes('mang thai') ||
      clean.includes('me bau') ||
      clean.includes('thai ky') ||
      clean.includes('co em be') ||
      clean.includes('sau sinh') ||
      clean.includes('o cu') ||
      clean.includes('cho con bu') ||
      clean.includes('me bim') ||
      /\bbau\b/.test(clean)
    ) {
      return 'PREGNANT';
    }

    if (
      clean.includes('an chay') ||
      clean.includes('chay truong') ||
      clean.includes('thuan chay') ||
      clean.includes('vegan') ||
      clean.includes('thanh tinh')
    ) {
      return 'VEGAN';
    }

    if (
      clean.includes('sinh vien') ||
      clean.includes('hoc sinh') ||
      clean.includes('ngon bo re') ||
      clean.includes('cuoi thang') ||
      clean.includes('chay tui') ||
      clean.includes('hat de')
    ) {
      return 'STUDENT';
    }

    if (
      clean.includes('giam can') ||
      clean.includes('eat clean') ||
      clean.includes('low carb') ||
      clean.includes('keto') ||
      clean.includes('giam mo') ||
      clean.includes('it calo')
    ) {
      return 'WEIGHT_LOSS';
    }

    if (
      clean.includes('om') ||
      clean.includes('cam cum') ||
      clean.includes('dau dau') ||
      clean.includes('sot') ||
      clean.includes('dau da day') ||
      clean.includes('tieu hoa kem') ||
      clean.includes('boi bo') ||
      clean.includes('duong sinh') ||
      clean.includes('nguoi gia')
    ) {
      return 'WELLNESS';
    }

    if (
      clean.includes('van phong') ||
      clean.includes('cong so') ||
      clean.includes('an trua cong ty') ||
      clean.includes('dong nghiep')
    ) {
      return 'OFFICE';
    }

    return undefined;
  }

  private stripDiacritics(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  private findFuzzySlot<T extends string>(
    message: string,
    mapping: Record<T, string[]>,
  ): T | undefined {
    const msgLower = message.toLowerCase();
    const msgClean = this.stripDiacritics(msgLower);

    // 1. Khớp chính xác hoặc tìm cụm từ đồng nghĩa hoàn chỉnh trước (hỗ trợ cả gõ không dấu)
    for (const key of Object.keys(mapping) as T[]) {
      const synonyms = mapping[key];
      for (const syn of synonyms) {
        const synClean = this.stripDiacritics(syn.toLowerCase());
        if (msgClean.includes(synClean)) {
          return key;
        }
      }
    }

    // 2. Fuzzy Matcher Levenshtein bậc cao đối với các từ đơn bị gõ sai chính tả (ngưỡng 0.82)
    const msgWords = msgLower.split(/\s+/);
    const FUZZY_THRESHOLD = 0.82;
    for (const key of Object.keys(mapping) as T[]) {
      const synonyms = mapping[key];
      for (const syn of synonyms) {
        const synWords = syn.toLowerCase().split(/\s+/);
        if (synWords.length === 1) {
          for (const msgWord of msgWords) {
            if (
              this.calculateSimilarity(msgWord, synWords[0]) >= FUZZY_THRESHOLD
            ) {
              this.logger.debug(
                `Fuzzy matched synonym typo: "${msgWord}" with "${synWords[0]}" -> ${key}`,
              );
              return key;
            }
          }
        }
      }
    }

    return undefined;
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const s1Clean = this.stripDiacritics(
      s1.toLowerCase().replace(/[.,]/g, ''),
    ).trim();
    const s2Clean = this.stripDiacritics(
      s2.toLowerCase().replace(/[.,]/g, ''),
    ).trim();
    if (s1Clean === s2Clean) return 1.0;

    // Levenshtein Distance
    const track = Array(s2Clean.length + 1)
      .fill(null)
      .map(() => Array(s1Clean.length + 1).fill(null));
    for (let i = 0; i <= s1Clean.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2Clean.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2Clean.length; j += 1) {
      for (let i = 1; i <= s1Clean.length; i += 1) {
        const indicator = s1Clean[i - 1] === s2Clean[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j - 1][i] + 1, // deletion
          track[j][i - 1] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    const distance = track[s2Clean.length][s1Clean.length];
    const maxLength = Math.max(s1Clean.length, s2Clean.length);
    return maxLength === 0 ? 0.0 : (maxLength - distance) / maxLength;
  }
}
