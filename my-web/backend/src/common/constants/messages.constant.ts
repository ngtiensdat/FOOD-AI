export const MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
    UNAUTHORIZED: 'Không có quyền truy cập',
    USER_EXISTS: 'Email đã được sử dụng',
    RATE_LIMIT_LOGIN:
      'Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
    RATE_LIMIT_REGISTER:
      'Bạn đã yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau vài phút.',
  },
  AI: {
    RATE_LIMIT_CHAT:
      'Bạn đã gửi quá nhiều yêu cầu tư vấn AI. Vui lòng thử lại sau vài phút để tránh quá tải hệ thống.',
  },
  SYSTEM: {
    INTERNAL_SERVER_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau',
  },
  RESTAURANT: {
    NOT_FOUND: 'Cơ sở kinh doanh không tồn tại',
    PRIVATE_FOLLOW_LIST:
      'Danh sách theo dõi của nhà hàng này đã được đặt ở chế độ riêng tư',
    NOT_OWNER: 'Bạn chưa sở hữu cơ sở kinh doanh nào.',
  },
};
