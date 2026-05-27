// Mục đích: Quản lý toàn bộ thông báo (Messages) trả về cho người dùng (Thành công, Lỗi, Cảnh báo).
// Ý nghĩa: Đảm bảo tính nhất quán của câu chữ và tạo tiền đề dễ dàng cho việc đa ngôn ngữ (i18n) sau này.
// Chức năng đặc biệt: Gom nhóm message theo từng Module (AUTH, AI, SYSTEM, RESTAURANT, FOOD...).
// Kiến thức/Design Pattern: Magic String Avoidance (Clean Code), Separation of Concerns (Tách biệt text khỏi logic).
// Biến/hàm đặc biệt: Object MESSAGES.
export const MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
    UNAUTHORIZED: 'Không có quyền truy cập',
    USER_EXISTS: 'Email đã được sử dụng',
    INVALID_TOKEN: 'Token không hợp lệ',
    ACCOUNT_LOCKED: 'Tài khoản chưa được phê duyệt hoặc đã bị khóa',
    RATE_LIMIT_LOGIN:
      'Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
    RATE_LIMIT_REGISTER:
      'Bạn đã yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau vài phút.',
    PENDING_APPROVAL: 'Tài khoản đang chờ phê duyệt',
    ACCOUNT_REJECTED: 'Tài khoản đã bị từ chối',
    NEW_PASSWORD_REQUIRED: 'Mật khẩu mới không được để trống',
    OLD_PASSWORD_INCORRECT: 'Mật khẩu cũ không chính xác',
    NO_REFRESH_TOKEN: 'No refresh token',
    NOT_REGISTERED: 'Tài khoản này chưa được đăng ký trên hệ thống.',
    MERCHANT_BRANCH_REQUIRED:
      'Thương gia bắt buộc phải đăng ký ít nhất 1 cơ sở.',
    PASSWORD_CONFIRM_REQUIRED:
      'Vui lòng cung cấp mật khẩu để xác nhận xóa tài khoản',
    PASSWORD_INCORRECT_DELETE:
      'Mật khẩu không chính xác. Không thể xóa tài khoản',
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
    NOT_OWNER_OF_THIS: 'Bạn không phải chủ sở hữu nhà hàng này',
  },
  USER: {
    NOT_FOUND: 'Người dùng không tồn tại',
    CANNOT_FOLLOW_SELF: 'Không thể tự theo dõi chính mình',
    UPDATE_SUCCESS: 'Cập nhật thành công',
    FOLLOWERS_HIDDEN: 'Danh sách người theo dõi của người dùng này đã được ẩn.',
    FOLLOWING_HIDDEN: 'Danh sách đang theo dõi của người dùng này đã được ẩn.',
  },
  CATEGORY: {
    NOT_FOUND: 'Category not found',
    GROUP_NOT_FOUND: 'Category group not found',
    HAS_FOODS: 'Có lỗi xảy ra (có thể danh mục đang có món ăn)',
  },
  FOOD: {
    NOT_FOUND: 'Món ăn không tồn tại',
    NO_EDIT_PERMISSION: 'Bạn không có quyền chỉnh sửa món ăn này',
    NO_DELETE_PERMISSION: 'Bạn không có quyền xóa món ăn này',
    NO_SYSTEM_MANAGE: 'Bạn không có quyền quản lý món ăn hệ thống',
    NOT_OWNER_OF_FOOD: 'Bạn không sở hữu món ăn này hoặc nhà hàng chứa món này',
    NO_POST_PERMISSION: 'Bạn không có quyền đăng món ăn vào cơ sở này.',
    RESTAURANT_REQUIRED: 'Vui lòng chọn cơ sở áp dụng món ăn này.',
  },
  ADMIN: {
    FILE_REQUIRED: 'Vui lòng upload file Excel',
    FILE_EMPTY_OR_INVALID: 'File Excel trống hoặc sai định dạng',
    INVALID_STATUS: 'Trạng thái không hợp lệ',
    VALUE_MUST_BE_BOOLEAN: 'value must be boolean',
  },
  MAIL: {
    VERIFICATION_SUBJECT: 'Xác minh tài khoản của bạn trên Food AI',
  },
};
