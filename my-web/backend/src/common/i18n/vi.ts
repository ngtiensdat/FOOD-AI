// Mục đích: Chứa các chuỗi ngôn ngữ (Localization) tiếng Việt cho ứng dụng.
// Ý nghĩa: Hỗ trợ đa ngôn ngữ (i18n), giúp ứng dụng có thể dễ dàng dịch sang tiếng Anh hoặc các ngôn ngữ khác mà không cần sửa code.
// Chức năng đặc biệt: Bản dịch được gom theo cấu trúc nested object.
// Kiến thức/Design Pattern: i18n, Centralized Localization.
// Biến/hàm đặc biệt: Object vi.
export const vi = {
  welcome: 'Chào mừng bạn đến với Food AI',
  errors: {
    system: 'Lỗi hệ thống, vui lòng thử lại sau',
    unauthorized: 'Bạn không có quyền thực hiện hành động này',
  },
};
