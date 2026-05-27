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
};
