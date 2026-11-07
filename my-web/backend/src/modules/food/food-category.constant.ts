/**
 * @fileoverview food-category.constant.ts
 * @description Các hằng số, từ điển từ khóa danh mục và helper xây dựng điều kiện truy vấn Prisma cho Food & Restaurant.
 * Áp dụng nguyên tắc DRY, Single Source of Truth cho toàn bộ nghiệp vụ tìm kiếm danh mục/từ khóa.
 */

import { Prisma } from '@prisma/client';

export const CATEGORY_PRICE_THRESHOLDS = {
  BUDGET_MAX: 45000,
  LUXURY_MIN: 80000,
} as const;

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cơm / xôi': ['cơm', 'xôi', 'rice'],
  'cơm/xôi': ['cơm', 'xôi', 'rice'],
  cơm: ['cơm', 'rice'],
  xôi: ['xôi'],
  'món nước': [
    'nước',
    'phở',
    'bún',
    'miến',
    'mì',
    'cháo',
    'hủ tiếu',
    'hủ tiểu',
    'lẩu',
    'canh',
    'soup',
    'ramen',
    'udon',
  ],
  'ăn vặt': [
    'ăn vặt',
    'khoai',
    'nem',
    'bánh tráng',
    'trà sữa',
    'xiên',
    'xúc xích',
    'chè',
    'snack',
    'ô mai',
    'chả cá',
    'gà rán',
  ],
  'tráng miệng': [
    'tráng miệng',
    'chè',
    'kem',
    'bánh',
    'hoa quả',
    'sinh tố',
    'nước ép',
    'pudding',
    'dessert',
    'flan',
    'trái cây',
  ],
  'bình dân': ['bình dân', 'tiết kiệm', 'cơm bình dân', 'giá rẻ', 'quán cóc'],
  'cao cấp': [
    'cao cấp',
    'sang trọng',
    'luxury',
    'lẩu',
    'nướng',
    'hải sản',
    'bò',
    'sushi',
    'buffet',
    'steak',
    'sashimi',
    'bít tết',
  ],
};

/**
 * Mở rộng từ khóa tìm kiếm dựa trên từ điển danh mục hoặc phân tách từ ghép.
 */
export function expandSearchKeywords(input?: string): string[] {
  if (!input) return [];
  const normalized = input.trim().toLowerCase();
  if (CATEGORY_KEYWORDS[normalized]) {
    return CATEGORY_KEYWORDS[normalized];
  }

  const parts = normalized
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const keywords = new Set<string>();
  for (const part of parts) {
    if (CATEGORY_KEYWORDS[part]) {
      CATEGORY_KEYWORDS[part].forEach((k) => keywords.add(k));
    } else if (part.length > 0) {
      keywords.add(part);
    }
  }
  if (keywords.size === 0 && normalized) {
    keywords.add(normalized);
  }
  return Array.from(keywords);
}

/**
 * Xây dựng danh sách điều kiện OR cho Food dựa trên tag hoặc từ khóa tìm kiếm.
 * Tái sử dụng giữa FoodService và các truy vấn liên quan.
 */
export function buildFoodFilterConditions(
  term: string,
  isTag: boolean,
): Prisma.FoodWhereInput[] {
  const termLower = term.trim().toLowerCase();
  const keywords = expandSearchKeywords(termLower);

  const conditions: Prisma.FoodWhereInput[] = [
    { tags: { has: term } },
    { tags: { has: termLower } },
    { name: { contains: term, mode: 'insensitive' } },
    { description: { contains: term, mode: 'insensitive' } },
  ];

  if (termLower === 'bình dân') {
    conditions.push({ price: { lte: CATEGORY_PRICE_THRESHOLDS.BUDGET_MAX } });
  } else if (termLower === 'cao cấp') {
    conditions.push({ price: { gte: CATEGORY_PRICE_THRESHOLDS.LUXURY_MIN } });
  }

  for (const k of keywords) {
    conditions.push(
      { name: { contains: k, mode: 'insensitive' } },
      { description: { contains: k, mode: 'insensitive' } },
      { tags: { has: k } },
    );
  }

  return conditions;
}
