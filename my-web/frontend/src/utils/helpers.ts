/**
 * Tạo một chuỗi ID ngẫu nhiên ngắn
 * Dùng cho các thành phần UI tạm thời như Toast, Item trong list...
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
