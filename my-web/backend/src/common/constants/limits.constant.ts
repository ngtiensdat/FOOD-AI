// Mục đích: Quản lý các con số giới hạn (Magic Numbers) trong toàn bộ ứng dụng.
// Ý nghĩa: Tránh việc rải rác các con số (như phân trang 100, bán kính tìm kiếm 10km) khắp nơi trong code.
// Chức năng đặc biệt: Phân loại giới hạn theo nghiệp vụ (FOOD_LIST_PAGINATION, DEFAULT_NEARBY_RADIUS...).
// Kiến thức/Design Pattern: Magic Number Avoidance (Clean Code), Centralized Configuration.
// Biến/hàm đặc biệt: Object LIMITS.
export const LIMITS = {
  DEFAULT_RECENT_VIEWS: 5,
  FOOD_LIST_PAGINATION: 100,
  DEFAULT_NEARBY_RADIUS: 5,
  DEFAULT_NEARBY_PAGINATION: 12,
  AI_SUGGESTION_COUNT_SMALL: 3,
  AI_SUGGESTION_COUNT_MEDIUM: 6,
  AI_CHAT_HISTORY_PAGINATION: 20,
  RESTAURANT_INITIAL_FOODS: 5,
};
