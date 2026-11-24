/**
 * Bản đồ Tri thức Dị ứng Thực phẩm & Nguy cơ Dị ứng Chéo (Food Allergen & Cross-Reactivity Ontology)
 * Phục vụ chuẩn hóa Tiếng Việt, mở rộng quan hệ đồng nghĩa, dị ứng chéo sinh học trong ẩm thực Việt Nam.
 */

export interface AllergenDefinition {
  id: string;
  canonicalVi: string;
  aliases: string[]; // Đồng nghĩa, tên gọi theo phương ngữ, tiếng Anh
  crossReactions: string[]; // Các thực phẩm có nguy cơ dị ứng chéo cao (cùng nhóm sinh học / kháng nguyên tương đồng)
  derivatives: string[]; // Các loại gia vị, chế phẩm, nước chấm chứa thành phần này
  explanation: string; // Giải thích cơ chế sinh học / ẩm thực ngắn gọn
}

export const ALLERGEN_TAXONOMY: Record<string, AllergenDefinition> = {
  CRUSTACEAN: {
    id: 'CRUSTACEAN',
    canonicalVi: 'Tôm & Động vật giáp xác',
    aliases: [
      'tôm',
      'tom',
      'shrimp',
      'prawn',
      'tép',
      'tep',
      'tôm sú',
      'tom su',
      'tôm càng',
      'tom cang',
      'giáp xác',
      'giap xac',
      'crustacean',
      'crustaceans',
    ],
    crossReactions: [
      'bề bề',
      'be be',
      'tôm tít',
      'tom tit',
      'tôm tích',
      'tom tich',
      'cua',
      'ghẹ',
      'ghe',
      'cua đồng',
      'cua biển',
      'tôm hùm',
      'tom hum',
    ],
    derivatives: [
      'mắm tôm',
      'mam tom',
      'muối tôm',
      'muoi tom',
      'chả tôm',
      'cha tom',
      'nem tôm',
      'nem tom',
      'ruốc tôm',
      'ruoc tom',
      'tôm khô',
      'tom kho',
      'nước cốt tôm',
    ],
    explanation:
      'Dị ứng protein Tropomyosin trong động vật giáp xác. Có nguy cơ dị ứng chéo rất cao (75-90%) với bề bề (tôm tít), tép, cua, ghẹ, tôm hùm và gia vị mắm tôm, muối tôm.',
  },

  SEAFOOD: {
    id: 'SEAFOOD',
    canonicalVi: 'Hải sản tổng hợp',
    aliases: [
      'hải sản',
      'hai san',
      'seafood',
      'đồ biển',
      'do bien',
      'thủy hải sản',
    ],
    crossReactions: [
      'tôm',
      'cua',
      'ghẹ',
      'bề bề',
      'tôm tít',
      'tép',
      'mực',
      'bạch tuộc',
      'sò',
      'ốc',
      'hàu',
      'nghêu',
      'ngao',
      'hến',
      'cá biển',
    ],
    derivatives: [
      'mắm tôm',
      'nước mắm cốt',
      'mắm tép',
      'chả cá',
      'chả mực',
      'dầu hào',
    ],
    explanation:
      'Dị ứng nhóm hải sản nói chung bao gồm cả giáp xác, thân mềm và cá biển.',
  },

  MOLLUSK: {
    id: 'MOLLUSK',
    canonicalVi: 'Động vật thân mềm (Mực, Bạch tuộc, Sò, Ốc)',
    aliases: [
      'mực',
      'muc',
      'squid',
      'bạch tuộc',
      'bach tuoc',
      'octopus',
      'sò',
      'so',
      'ốc',
      'oc',
      'hàu',
      'hau',
      'oyster',
      'nghêu',
      'ngheu',
      'clam',
      'ngao',
      'hến',
      'hen',
      'thân mềm',
      'mollusk',
      'mollusks',
      'shellfish',
    ],
    crossReactions: [
      'bạch tuộc',
      'mực ống',
      'mực lá',
      'mực sim',
      'sò huyết',
      'sò lông',
      'sò điệp',
      'ốc hương',
      'ốc móng tay',
      'hàu sữa',
      'chem chép',
    ],
    derivatives: ['dầu hào', 'chả mực', 'mực khô', 'mực một nắng'],
    explanation:
      'Dị ứng nhóm động vật thân mềm. Dị ứng mực thường liên quan đến bạch tuộc, sò, điệp và hàu.',
  },

  PEANUT: {
    id: 'PEANUT',
    canonicalVi: 'Đậu phộng (Lạc)',
    aliases: [
      'đậu phộng',
      'dau phong',
      'lạc',
      'lac',
      'peanuts',
      'peanut',
      'đậu phụng',
      'dau phung',
      'groundnut',
    ],
    crossReactions: [
      'bơ đậu phộng',
      'dầu phộng',
      'kẹo lạc',
      'muối mè lạc',
      'đậu phộng rang',
    ],
    derivatives: [
      'bơ đậu phộng',
      'bo dau phong',
      'dầu lạc',
      'dau lac',
      'kẹo cu đơ',
      'kẹo Sìu Châu',
      'sốt đậu phộng',
    ],
    explanation:
      'Dị ứng protein Ara h trong đậu phộng (cây họ đậu). Cần tuyệt đối tránh bơ đậu phộng, kẹo lạc, dầu phộng và sốt chấm có rắc lạc.',
  },

  DAIRY: {
    id: 'DAIRY',
    canonicalVi: 'Sữa & Chế phẩm bơ sữa',
    aliases: [
      'sữa',
      'sua',
      'dairy',
      'milk',
      'bơ sữa',
      'bo sua',
      'cow milk',
      'sữa bò',
    ],
    crossReactions: [
      'phô mai',
      'pho mai',
      'cheese',
      'bơ',
      'bo',
      'butter',
      'sữa chua',
      'sua chua',
      'yogurt',
      'váng sữa',
      'vang sua',
      'kem tươi',
      'kem whipping',
      'whipping cream',
      'sữa đặc',
      'sua dac',
      'sốt kem',
    ],
    derivatives: [
      'trà sữa',
      'bánh flan',
      'caramen',
      'kem cheese',
      'sốt phô mai',
    ],
    explanation:
      'Dị ứng protein Casein/Whey hoặc không dung nạp Lactose. Cần tránh toàn bộ các món nấu với bơ, sốt phô mai, sữa chua, trà sữa có bột sữa động vật.',
  },

  EGG: {
    id: 'EGG',
    canonicalVi: 'Trứng',
    aliases: [
      'trứng',
      'trung',
      'egg',
      'eggs',
      'hột gà',
      'hot ga',
      'hột vịt',
      'hot vit',
    ],
    crossReactions: [
      'trứng gà',
      'trung ga',
      'trứng vịt',
      'trung vit',
      'trứng cút',
      'trung cut',
      'trứng lộn',
      'hột vịt lộn',
    ],
    derivatives: [
      'mayonnaise',
      'sốt mayo',
      'chả trứng',
      'trứng muối',
      'bánh flan',
      'mì trứng',
    ],
    explanation:
      'Dị ứng protein lòng trắng (Ovalbumin) hoặc lòng đỏ trứng. Tránh cả trứng gà, trứng vịt, sốt mayonnaise và trứng muối.',
  },

  GLUTEN: {
    id: 'GLUTEN',
    canonicalVi: 'Gluten (Lúa mì & Bột mì)',
    aliases: [
      'gluten',
      'lúa mì',
      'lua mi',
      'wheat',
      'bột mì',
      'bot mi',
      'flour',
    ],
    crossReactions: [
      'bánh mì',
      'banh mi',
      'mì căn',
      'mi can',
      'mì ý',
      'pasta',
      'spaghetti',
      'bánh ngọt',
      'bột chiên xù',
      'sandwich',
    ],
    derivatives: ['nước tương có lúa mì', 'bột chiên giòn', 'vỏ bánh'],
    explanation:
      'Dị ứng protein Gluten / Bệnh Celiac. Tránh các món làm từ bột mì như bánh mì, sợi mì tươi từ lúa mì, bánh nướng.',
  },

  SOY: {
    id: 'SOY',
    canonicalVi: 'Đậu nành & Chế phẩm đậu',
    aliases: [
      'đậu nành',
      'dau nanh',
      'soy',
      'soya',
      'đậu tương',
      'dau tuong',
      'soybean',
    ],
    crossReactions: [
      'đậu hũ',
      'đậu phụ',
      'dau hu',
      'dau phu',
      'tofu',
      'sữa đậu nành',
      'sua dau nanh',
      'tàu hũ',
    ],
    derivatives: [
      'nước tương',
      'nuoc tuong',
      'xì dầu',
      'xi dau',
      'chao',
      'tương bần',
      'tương đen',
    ],
    explanation:
      'Dị ứng đậu nành. Cần chú ý các món chứa đậu hũ, nước tương, chao và các loại sốt tương lên men.',
  },

  INSECT: {
    id: 'INSECT',
    canonicalVi: 'Nhộng tằm & Côn trùng',
    aliases: [
      'nhộng',
      'nhong',
      'nhộng tằm',
      'nhong tam',
      'côn trùng',
      'dế',
      've sầu',
    ],
    crossReactions: [
      'nhộng tằm rang',
      'châu chấu',
      'dế mèn',
      've sầu rang lá chanh',
    ],
    derivatives: [],
    explanation:
      'Dị ứng protein côn trùng/nhộng tằm, có phản ứng tương đồng với dị ứng động vật chân đốt/giáp xác.',
  },
};

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt để so khớp chuỗi không dấu
 */
export function stripVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Tìm định nghĩa Ontology tương ứng với một từ khóa dị ứng (hỗ trợ cả tiếng Anh lẫn tiếng Việt)
 */
export function findMatchingAllergenDefinition(
  term: string,
): AllergenDefinition | null {
  if (!term) return null;
  const cleanTerm = stripVietnameseDiacritics(term);
  if (!cleanTerm) return null;

  for (const def of Object.values(ALLERGEN_TAXONOMY)) {
    // 1. Kiểm tra ID
    if (stripVietnameseDiacritics(def.id) === cleanTerm) return def;

    // 2. Kiểm tra tên canonical
    if (stripVietnameseDiacritics(def.canonicalVi).includes(cleanTerm))
      return def;

    // 3. Kiểm tra danh sách alias
    if (
      def.aliases.some((alias) => {
        const cleanAlias = stripVietnameseDiacritics(alias);
        return (
          cleanAlias === cleanTerm ||
          cleanTerm.includes(cleanAlias) ||
          cleanAlias.includes(cleanTerm)
        );
      })
    ) {
      return def;
    }

    // 4. Kiểm tra danh sách cross-reactions
    if (
      def.crossReactions.some((cr) => {
        const cleanCr = stripVietnameseDiacritics(cr);
        return cleanCr === cleanTerm || cleanTerm.includes(cleanCr);
      })
    ) {
      return def;
    }
  }

  return null;
}

/**
 * Chuẩn hóa một tên dị ứng bất kỳ sang Tiếng Việt chuẩn mực, kèm chú thích dị ứng chéo
 * Ví dụ: "peanuts" -> "Đậu phộng (Lạc)"
 *        "tôm" -> "Tôm & Giáp xác (Bề bề, cua, ghẹ...)"
 */
export function toCanonicalVietnameseAllergy(allergy: string): string {
  const def = findMatchingAllergenDefinition(allergy);
  if (def) {
    if (def.id === 'CRUSTACEAN') {
      return 'Tôm (và giáp xác: bề bề, cua, ghẹ)';
    }
    return def.canonicalVi;
  }
  return allergy.trim();
}

/**
 * Mở rộng danh sách dị ứng của người dùng thành:
 * 1. Mảng từ khóa tìm kiếm toàn diện (để Reranker lọc triệt để các món dị ứng chéo như bề bề, mắm tôm khi dị ứng tôm)
 * 2. Mảng cảnh báo dị ứng chéo (để đưa vào prompt cho AI giải thích cặn kẽ cho khách)
 */
export function expandAllergens(allergies: string[]): {
  searchKeywords: string[];
  crossReactionsInfo: string[];
  canonicalNames: string[];
} {
  const searchKeywordsSet = new Set<string>();
  const crossReactionsInfoSet = new Set<string>();
  const canonicalNamesSet = new Set<string>();

  for (const item of allergies) {
    if (!item) continue;
    const cleanItem = stripVietnameseDiacritics(item);
    if (
      !cleanItem ||
      cleanItem === 'none' ||
      cleanItem === 'khong' ||
      cleanItem === 'khong co'
    ) {
      continue;
    }

    // Luôn đưa chính từ khóa gốc vào danh sách tìm kiếm
    searchKeywordsSet.add(cleanItem);

    // Tìm định nghĩa ontology
    const def = findMatchingAllergenDefinition(item);
    if (def) {
      canonicalNamesSet.add(def.canonicalVi);

      // Thêm toàn bộ aliases
      for (const a of def.aliases) {
        searchKeywordsSet.add(stripVietnameseDiacritics(a));
      }

      // Thêm toàn bộ các thực phẩm dị ứng chéo (Cross-reactions)
      for (const cr of def.crossReactions) {
        searchKeywordsSet.add(stripVietnameseDiacritics(cr));
      }

      // Thêm các chế phẩm, gia vị chứa thành phần này
      for (const d of def.derivatives) {
        searchKeywordsSet.add(stripVietnameseDiacritics(d));
      }

      // Tạo câu thông tin cảnh báo dị ứng chéo
      crossReactionsInfoSet.add(
        `Người dùng dị ứng ${def.canonicalVi}: Hệ thống bắt buộc LOẠI BỎ cả các món dị ứng chéo liên quan gồm: ${def.crossReactions.slice(0, 5).join(', ')}${def.derivatives.length > 0 ? ` và gia vị ${def.derivatives.slice(0, 3).join(', ')}` : ''}. (${def.explanation})`,
      );
    } else {
      canonicalNamesSet.add(item.trim());
    }
  }

  return {
    searchKeywords: Array.from(searchKeywordsSet),
    crossReactionsInfo: Array.from(crossReactionsInfoSet),
    canonicalNames: Array.from(canonicalNamesSet),
  };
}
