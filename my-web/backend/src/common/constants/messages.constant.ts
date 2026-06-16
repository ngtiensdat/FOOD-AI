// Mục đích: Quản lý toàn bộ thông báo (Messages) trả về cho người dùng (Thành công, Lỗi, Cảnh báo).
// Ý nghĩa: Đảm bảo tính nhất quán của câu chữ và hỗ trợ đa ngôn ngữ (i18n) động.
// Chức năng đặc biệt: Tách biệt hoàn toàn các thông báo tĩnh/động sang dạng getter động để tự động tra cứu từ điển en/vi.
// Kiến thức/Design Pattern: Context-scoped Dynamic Getters, magic string avoidance.

import { t } from '../i18n/i18n.context';

export const MESSAGES = {
  AUTH: {
    get REGISTER_SUCCESS() {
      return t('AUTH.REGISTER_SUCCESS', 'Đăng ký tài khoản thành công');
    },
    get LOGIN_SUCCESS() {
      return t('AUTH.LOGIN_SUCCESS', 'Đăng nhập thành công');
    },
    get INVALID_CREDENTIALS() {
      return t(
        'AUTH.INVALID_CREDENTIALS',
        'Email hoặc mật khẩu không chính xác',
      );
    },
    get UNAUTHORIZED() {
      return t('AUTH.UNAUTHORIZED', 'Không có quyền truy cập');
    },
    get USER_EXISTS() {
      return t('AUTH.USER_EXISTS', 'Email đã được sử dụng');
    },
    get INVALID_TOKEN() {
      return t('AUTH.INVALID_TOKEN', 'Token không hợp lệ');
    },
    get ACCOUNT_LOCKED() {
      return t(
        'AUTH.ACCOUNT_LOCKED',
        'Tài khoản chưa được phê duyệt hoặc đã bị khóa',
      );
    },
    get RATE_LIMIT_LOGIN() {
      return t(
        'AUTH.RATE_LIMIT_LOGIN',
        'Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau vài phút.',
      );
    },
    get RATE_LIMIT_REGISTER() {
      return t(
        'AUTH.RATE_LIMIT_REGISTER',
        'Bạn đã yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau vài phút.',
      );
    },
    get PENDING_APPROVAL() {
      return t('AUTH.PENDING_APPROVAL', 'Tài khoản đang chờ phê duyệt');
    },
    get ACCOUNT_REJECTED() {
      return t('AUTH.ACCOUNT_REJECTED', 'Tài khoản đã bị từ chối');
    },
    get NEW_PASSWORD_REQUIRED() {
      return t(
        'AUTH.NEW_PASSWORD_REQUIRED',
        'Mật khẩu mới không được để trống',
      );
    },
    get OLD_PASSWORD_INCORRECT() {
      return t('AUTH.OLD_PASSWORD_INCORRECT', 'Mật khẩu cũ không chính xác');
    },
    get NO_REFRESH_TOKEN() {
      return t('AUTH.NO_REFRESH_TOKEN', 'No refresh token');
    },
    get NOT_REGISTERED() {
      return t(
        'AUTH.NOT_REGISTERED',
        'Tài khoản này chưa được đăng ký trên hệ thống.',
      );
    },
    get MERCHANT_BRANCH_REQUIRED() {
      return t(
        'AUTH.MERCHANT_BRANCH_REQUIRED',
        'Thương gia bắt buộc phải đăng ký ít nhất 1 cơ sở.',
      );
    },
    get PASSWORD_CONFIRM_REQUIRED() {
      return t(
        'AUTH.PASSWORD_CONFIRM_REQUIRED',
        'Vui lòng cung cấp mật khẩu để xác nhận xóa tài khoản',
      );
    },
    get PASSWORD_INCORRECT_DELETE() {
      return t(
        'AUTH.PASSWORD_INCORRECT_DELETE',
        'Mật khẩu không chính xác. Không thể xóa tài khoản',
      );
    },
    RATE_LIMIT_LOGIN_DYNAMIC: (minutes: number) =>
      t(
        'AUTH.RATE_LIMIT_LOGIN_DYNAMIC',
        `Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau ${minutes} phút.`,
        minutes,
      ),
    get RATE_LIMIT_LOGIN_10M() {
      return t(
        'AUTH.RATE_LIMIT_LOGIN_10M',
        'Tài khoản của bạn đã bị tạm khóa do thử đăng nhập sai quá nhiều lần. Vui lòng quay lại sau 10 phút.',
      );
    },
    LOGIN_ATTEMPTS_REMAINING: (attempts: number) =>
      t(
        'AUTH.LOGIN_ATTEMPTS_REMAINING',
        `Email hoặc mật khẩu không chính xác. Bạn còn ${attempts} lần thử.`,
        attempts,
      ),
    get ONBOARDING_SUCCESS() {
      return t(
        'AUTH.ONBOARDING_SUCCESS',
        'Hoàn thiện hồ sơ đa chi nhánh thành công.',
      );
    },
    get CHANGE_PASSWORD_SUCCESS() {
      return t('AUTH.CHANGE_PASSWORD_SUCCESS', 'Đổi mật khẩu thành công');
    },
    get DELETE_ACCOUNT_SUCCESS() {
      return t(
        'AUTH.DELETE_ACCOUNT_SUCCESS',
        'Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.',
      );
    },
    get LOGOUT_SUCCESS() {
      return t('AUTH.LOGOUT_SUCCESS', 'Đăng xuất thành công');
    },
  },
  AI: {
    get RATE_LIMIT_CHAT() {
      return t(
        'AI.RATE_LIMIT_CHAT',
        'Bạn đã gửi quá nhiều yêu cầu tư vấn AI. Vui lòng thử lại sau vài phút để tránh quá tải hệ thống.',
      );
    },
    get RATE_LIMIT_FAST() {
      return t(
        'AI.RATE_LIMIT_FAST',
        'Bạn đang chat hơi nhanh quá. Hãy đợi một vài giây rồi gửi lại nhé! 😊',
      );
    },
    get CUSTOMER_ONLY() {
      return t(
        'AI.CUSTOMER_ONLY',
        'Tính năng Trợ lý AI chỉ dành riêng cho Khách hàng.',
      );
    },
    get SYSTEM_ERROR() {
      return t('AI.SYSTEM_ERROR', 'Xin lỗi, tôi gặp chút trục trặc hệ thống.');
    },
    get SYSTEM_ERROR_FALLBACK() {
      return t(
        'AI.SYSTEM_ERROR_FALLBACK',
        'Xin lỗi, tôi không thể trả lời lúc này.',
      );
    },
    get CONVERSATION_NOT_FOUND() {
      return t('AI.CONVERSATION_NOT_FOUND', 'Cuộc hội thoại không tồn tại.');
    },
    get CHAT_HISTORY_CLEARED() {
      return t('AI.CHAT_HISTORY_CLEARED', 'Đã xóa lịch sử trò chuyện');
    },
  },
  SYSTEM: {
    get INTERNAL_SERVER_ERROR() {
      return t(
        'SYSTEM.INTERNAL_SERVER_ERROR',
        'Lỗi hệ thống, vui lòng thử lại sau',
      );
    },
  },
  RESTAURANT: {
    get NOT_FOUND() {
      return t('RESTAURANT.NOT_FOUND', 'Cơ sở kinh doanh không tồn tại');
    },
    get PRIVATE_FOLLOW_LIST() {
      return t(
        'RESTAURANT.PRIVATE_FOLLOW_LIST',
        'Danh sách theo dõi của nhà hàng này đã được đặt ở chế độ riêng tư',
      );
    },
    get NOT_OWNER() {
      return t('RESTAURANT.NOT_OWNER', 'Bạn chưa sở hữu cơ sở kinh doanh nào.');
    },
    get NOT_OWNER_OF_THIS() {
      return t(
        'RESTAURANT.NOT_OWNER_OF_THIS',
        'Bạn không phải chủ sở hữu nhà hàng này',
      );
    },
  },
  USER: {
    get NOT_FOUND() {
      return t('USER.NOT_FOUND', 'Người dùng không tồn tại');
    },
    get CANNOT_FOLLOW_SELF() {
      return t('USER.CANNOT_FOLLOW_SELF', 'Không thể tự theo dõi chính mình');
    },
    get UPDATE_SUCCESS() {
      return t('USER.UPDATE_SUCCESS', 'Cập nhật thành công');
    },
    get FOLLOWERS_HIDDEN() {
      return t(
        'USER.FOLLOWERS_HIDDEN',
        'Danh sách người theo dõi của người dùng này đã được ẩn.',
      );
    },
    get FOLLOWING_HIDDEN() {
      return t(
        'USER.FOLLOWING_HIDDEN',
        'Danh sách đang theo dõi của người dùng này đã được ẩn.',
      );
    },
  },
  CATEGORY: {
    get NOT_FOUND() {
      return t('CATEGORY.NOT_FOUND', 'Category not found');
    },
    get GROUP_NOT_FOUND() {
      return t('CATEGORY.GROUP_NOT_FOUND', 'Category group not found');
    },
    get HAS_FOODS() {
      return t(
        'CATEGORY.HAS_FOODS',
        'Có lỗi xảy ra (có thể danh mục đang có món ăn)',
      );
    },
    get GROUP_EXISTS() {
      return t(
        'CATEGORY.GROUP_EXISTS',
        'Tên nhóm này đã tồn tại trong nhà hàng của bạn.',
      );
    },
    get CATEGORY_EXISTS() {
      return t(
        'CATEGORY.CATEGORY_EXISTS',
        'Tên phân loại này đã tồn tại trong nhóm.',
      );
    },
    get PARENT_NOT_FOUND() {
      return t(
        'CATEGORY.PARENT_NOT_FOUND',
        'Danh mục cha không tồn tại hoặc thuộc nhóm khác.',
      );
    },
  },
  FOOD: {
    get NOT_FOUND() {
      return t('FOOD.NOT_FOUND', 'Món ăn không tồn tại');
    },
    get NO_EDIT_PERMISSION() {
      return t(
        'FOOD.NO_EDIT_PERMISSION',
        'Bạn không có quyền chỉnh sửa món ăn này',
      );
    },
    get NO_DELETE_PERMISSION() {
      return t(
        'FOOD.NO_DELETE_PERMISSION',
        'Bạn không có quyền xóa món ăn này',
      );
    },
    get NO_SYSTEM_MANAGE() {
      return t(
        'FOOD.NO_SYSTEM_MANAGE',
        'Bạn không có quyền quản lý món ăn hệ thống',
      );
    },
    get NOT_OWNER_OF_FOOD() {
      return t(
        'FOOD.NOT_OWNER_OF_FOOD',
        'Bạn không sở hữu món ăn này hoặc nhà hàng chứa món này',
      );
    },
    get NO_POST_PERMISSION() {
      return t(
        'FOOD.NO_POST_PERMISSION',
        'Bạn không có quyền đăng món ăn vào cơ sở này.',
      );
    },
    get RESTAURANT_REQUIRED() {
      return t(
        'FOOD.RESTAURANT_REQUIRED',
        'Vui lòng chọn cơ sở áp dụng món ăn này.',
      );
    },
  },
  ADMIN: {
    get FILE_REQUIRED() {
      return t('ADMIN.FILE_REQUIRED', 'Vui lòng upload file Excel');
    },
    get FILE_EMPTY_OR_INVALID() {
      return t(
        'ADMIN.FILE_EMPTY_OR_INVALID',
        'File Excel trống hoặc sai định dạng',
      );
    },
    get INVALID_STATUS() {
      return t('ADMIN.INVALID_STATUS', 'Trạng thái không hợp lệ');
    },
    get VALUE_MUST_BE_BOOLEAN() {
      return t('ADMIN.VALUE_MUST_BE_BOOLEAN', 'value must be boolean');
    },
    get IMPORT_SUCCESS() {
      return t('ADMIN.IMPORT_SUCCESS', 'Import thành công');
    },
  },
  MAIL: {
    get VERIFICATION_SUBJECT() {
      return t(
        'MAIL.VERIFICATION_SUBJECT',
        'Xác minh tài khoản của bạn trên Food AI',
      );
    },
  },
  VALIDATION: {
    get EMAIL_INVALID() {
      return t('VALIDATION.EMAIL_INVALID', 'Email không hợp lệ');
    },
    get PASSWORD_REQUIRED() {
      return t('VALIDATION.PASSWORD_REQUIRED', 'Mật khẩu không được để trống');
    },
    get PASSWORD_MIN_LENGTH() {
      return t(
        'VALIDATION.PASSWORD_MIN_LENGTH',
        'Mật khẩu phải có ít nhất 8 ký tự',
      );
    },
    get NAME_REQUIRED() {
      return t('VALIDATION.NAME_REQUIRED', 'Tên không được để trống');
    },
    get OLD_PASSWORD_REQUIRED() {
      return t(
        'VALIDATION.OLD_PASSWORD_REQUIRED',
        'Mật khẩu cũ không được để trống',
      );
    },
    get NEW_PASSWORD_REQUIRED() {
      return t(
        'VALIDATION.NEW_PASSWORD_REQUIRED',
        'Mật khẩu mới không được để trống',
      );
    },
    get NEW_PASSWORD_MIN_LENGTH() {
      return t(
        'VALIDATION.NEW_PASSWORD_MIN_LENGTH',
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      );
    },
  },
  SOCIAL: {
    get COMMENT_NOT_FOUND() {
      return t('SOCIAL.COMMENT_NOT_FOUND', 'Không tìm thấy bình luận');
    },
    get NO_DELETE_COMMENT_PERMISSION() {
      return t(
        'SOCIAL.NO_DELETE_COMMENT_PERMISSION',
        'Bạn không có quyền xóa bình luận này',
      );
    },
  },
  LOYALTY: {
    get LEVEL_UP_TITLE() {
      return t('LOYALTY.LEVEL_UP_TITLE', 'Thăng cấp độ mới! 🎉');
    },
    LEVEL_UP_BODY: (level: number) =>
      t(
        'LOYALTY.LEVEL_UP_BODY',
        `Chúc mừng bạn đã đạt cấp độ Lv. ${level}! Tiếp tục đóng góp và nhận nhiều ưu đãi nhé.`,
        level,
      ),
    get NEW_BADGE_TITLE() {
      return t('LOYALTY.NEW_BADGE_TITLE', 'Đạt danh hiệu mới! ✨');
    },
    NEW_BADGE_BODY: (badge: string) =>
      t(
        'LOYALTY.NEW_BADGE_BODY',
        `Chúc mừng bạn đã đạt danh hiệu "${badge}"!`,
        badge,
      ),
  },
};
