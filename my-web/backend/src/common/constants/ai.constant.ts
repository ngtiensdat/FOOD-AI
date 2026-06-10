// Mục đích: Lưu trữ các hằng số cấu hình liên quan đến tính năng AI (tên model, giới hạn cache, rate limit).
// Ý nghĩa: Gom nhóm các thiết lập AI vào một nơi để dễ dàng thay đổi cấu hình (vd: đổi model từ gpt-4o-mini sang gpt-4) mà không phải tìm trong code.
// Chức năng đặc biệt: Định nghĩa AI_CONSTANTS chứa MODELS, CACHE, RATE_LIMIT.
// Kiến thức/Design Pattern: Constant Object Pattern, Centralized Configuration.
// Biến/hàm đặc biệt: Biến AI_CONSTANTS.
export const AI_CONSTANTS = {
  MODELS: {
    EMBEDDING: 'text-embedding-3-small',
    CHAT: 'gpt-4o-mini',
  },
  CACHE: {
    MAX_SIZE: 1000,
  },
  RATE_LIMIT: {
    CHAT_MS: 5000,
  },
  DEFAULT_TEMPERATURE: 0.2,
  GOAL_MAP: {
    muscle_gain: 'Tăng cơ',
    weight_loss: 'Giảm cân',
    eat_clean: 'Ăn sạch',
    enjoy: 'Thưởng thức',
  } as Record<string, string>,
  EMBEDDING_LABELS: {
    NO_DESCRIPTION: 'Không có mô tả',
    NO_TAGS: 'Không có',
    NO_GOAL: 'Không có',
    DEFAULT_CUISINE: 'đa dạng',
    DEFAULT_BUDGET: 'linh hoạt',
    CATEGORY_OTHER: 'Khác',
  },
  RERANK_KEYWORDS: {
    TIME_SLOTS: {
      MORNING: ['sáng', 'cà phê', 'phở', 'bánh mì', 'hủ tiếu'],
      LUNCH: ['cơm', 'trưa', 'bún'],
      DINNER: ['tối', 'lẩu', 'nướng', 'nhậu', 'tụ tập'],
      LATE_NIGHT: ['đêm', 'khuya', 'ăn vặt'],
    },
    WEATHER: {
      HOT: {
        BOOST: ['lạnh', 'kem', 'chè', 'trà sữa', 'nước ép', 'sinh tố'],
        PENALIZE: ['lẩu', 'nướng', 'nóng'],
      },
      COLD_OR_RAIN: ['lẩu', 'nướng', 'nóng', 'súp', 'phở', 'cháo'],
    },
  },
};
