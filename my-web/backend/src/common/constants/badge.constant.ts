// Mục đích: Định nghĩa hằng số cho hệ thống badge fallback.
// Ý nghĩa: Khi bảng BadgeConfig trong DB trống, hệ thống sử dụng danh sách mặc định này.
// Kiến thức/Design Pattern: Magic Value Avoidance, Centralized Configuration.

export const DEFAULT_BADGE_CONFIGS = [
  { role: 'CUSTOMER', title: 'Thực Khách Năng Động', points: 300 },
  { role: 'CUSTOMER', title: 'Chuyên Gia Ẩm Thực', points: 1000 },
  { role: 'CUSTOMER', title: 'Thánh Review Cao Cấp', points: 3000 },
  { role: 'RESTAURANT', title: 'Đối Tác Tiềm Năng', points: 500 },
  { role: 'RESTAURANT', title: 'Đối Tác Uy Tín', points: 2000 },
  { role: 'RESTAURANT', title: 'Thương Hiệu Xuất Sắc', points: 5000 },
] as const;

export const POINTS_PER_LEVEL = 1000;
export const DEFAULT_LEVEL_UP_POINTS_REWARD = 100;
export const DEFAULT_POST_REVIEW_POINTS = 50;
export const DEFAULT_COMMENT_POINTS = 10;
export const DEFAULT_LIKE_POINTS = 5;
export const DEFAULT_DEDUCTION_MULTIPLIER = 1.0;
export const DEFAULT_STARTING_LEVEL = 1;
export const MIN_POINTS_OR_XP = 0;
