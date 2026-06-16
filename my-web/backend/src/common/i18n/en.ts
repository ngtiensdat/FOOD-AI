// Mục đích: Định nghĩa từ điển tiếng Anh (en) chứa toàn bộ các thông báo, lỗi, và văn bản xác thực trong hệ thống backend.
// Các file khác hay file này có ý nghĩa như nào: Được import bởi i18n.context.ts để tra cứu ngôn ngữ động khi client yêu cầu ngôn ngữ tiếng Anh.
// Các chức năng đặc biệt: Chứa cấu trúc JSON đồng bộ với tệp tin tiếng Việt để dịch các thông báo hệ thống.
// Kiến thức, Design Pattern, nguyên tắc: Dictionary Pattern, Hỗ trợ đa ngôn ngữ (i18n).
// Các biến, hàm đặc biệt: en

export const en = {
  AUTH: {
    REGISTER_SUCCESS: 'Account registered successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    INVALID_CREDENTIALS: 'Incorrect email or password',
    UNAUTHORIZED: 'Unauthorized access',
    USER_EXISTS: 'Email is already in use',
    INVALID_TOKEN: 'Invalid token',
    ACCOUNT_LOCKED: 'Account is locked or pending approval',
    RATE_LIMIT_LOGIN:
      'Your account has been temporarily locked due to too many failed login attempts. Please try again in a few minutes.',
    RATE_LIMIT_REGISTER:
      'You have requested registration too many times. Please try again in a few minutes.',
    PENDING_APPROVAL: 'Account is pending approval',
    ACCOUNT_REJECTED: 'Account request has been rejected',
    NEW_PASSWORD_REQUIRED: 'New password is required',
    OLD_PASSWORD_INCORRECT: 'Incorrect old password',
    NO_REFRESH_TOKEN: 'No refresh token',
    NOT_REGISTERED: 'This account is not registered on the system.',
    MERCHANT_BRANCH_REQUIRED: 'Merchants must register at least one branch.',
    PASSWORD_CONFIRM_REQUIRED:
      'Please provide your password to confirm account deletion',
    PASSWORD_INCORRECT_DELETE: 'Incorrect password. Cannot delete account.',
    RATE_LIMIT_LOGIN_DYNAMIC: (minutes: number) =>
      `Your account has been temporarily locked due to too many failed login attempts. Please try again in ${minutes} minutes.`,
    RATE_LIMIT_LOGIN_10M:
      'Your account has been temporarily locked due to too many failed login attempts. Please try again in 10 minutes.',
    LOGIN_ATTEMPTS_REMAINING: (attempts: number) =>
      `Incorrect email or password. You have ${attempts} attempts remaining.`,
    ONBOARDING_SUCCESS: 'Multi-branch onboarding completed successfully.',
    CHANGE_PASSWORD_SUCCESS: 'Password changed successfully.',
    DELETE_ACCOUNT_SUCCESS:
      'Your account has been permanently deleted from the system.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
  },
  AI: {
    RATE_LIMIT_CHAT:
      'You have sent too many AI requests. Please try again in a few minutes to avoid overloading the system.',
    RATE_LIMIT_FAST:
      'You are chatting a bit too fast. Please wait a few seconds and try again! 😊',
    CUSTOMER_ONLY: 'The AI Assistant is exclusively for Customers.',
    SYSTEM_ERROR: 'Sorry, I encountered a system issue.',
    SYSTEM_ERROR_FALLBACK: 'Sorry, I cannot reply right now.',
    CONVERSATION_NOT_FOUND: 'Conversation does not exist.',
    CHAT_HISTORY_CLEARED: 'Chat history cleared.',
  },
  SYSTEM: {
    INTERNAL_SERVER_ERROR: 'System error, please try again later',
  },
  RESTAURANT: {
    NOT_FOUND: 'Store does not exist',
    PRIVATE_FOLLOW_LIST: 'The follower list of this restaurant is private',
    NOT_OWNER: 'You do not own any stores.',
    NOT_OWNER_OF_THIS: 'You are not the owner of this restaurant',
  },
  USER: {
    NOT_FOUND: 'User does not exist',
    CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
    UPDATE_SUCCESS: 'Updated successfully',
    FOLLOWERS_HIDDEN: 'The follower list of this user is hidden.',
    FOLLOWING_HIDDEN: 'The following list of this user is hidden.',
  },
  CATEGORY: {
    NOT_FOUND: 'Category not found',
    GROUP_NOT_FOUND: 'Category group not found',
    HAS_FOODS: 'An error occurred (the category might contain food items)',
    GROUP_EXISTS: 'This group name already exists in your restaurant.',
    CATEGORY_EXISTS: 'This category name already exists in the group.',
    PARENT_NOT_FOUND:
      'Parent category not found or belongs to a different group.',
  },
  FOOD: {
    NOT_FOUND: 'Food item does not exist',
    NO_EDIT_PERMISSION: 'You do not have permission to edit this food item',
    NO_DELETE_PERMISSION: 'You do not have permission to delete this food item',
    NO_SYSTEM_MANAGE: 'You do not have permission to manage system food items',
    NOT_OWNER_OF_FOOD:
      'You do not own this food item or the restaurant hosting it',
    NO_POST_PERMISSION:
      'You do not have permission to post food items to this branch.',
    RESTAURANT_REQUIRED: 'Please select the branch to apply this food item.',
  },
  ADMIN: {
    FILE_REQUIRED: 'Please upload an Excel file',
    FILE_EMPTY_OR_INVALID: 'Excel file is empty or invalid format',
    INVALID_STATUS: 'Invalid status',
    VALUE_MUST_BE_BOOLEAN: 'value must be boolean',
    IMPORT_SUCCESS: 'Import completed successfully',
  },
  MAIL: {
    VERIFICATION_SUBJECT: 'Verify your account on Food AI',
  },
  VALIDATION: {
    EMAIL_INVALID: 'Invalid email format',
    PASSWORD_REQUIRED: 'Password cannot be empty',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
    NAME_REQUIRED: 'Name cannot be empty',
    OLD_PASSWORD_REQUIRED: 'Old password cannot be empty',
    NEW_PASSWORD_REQUIRED: 'New password cannot be empty',
    NEW_PASSWORD_MIN_LENGTH: 'New password must be at least 8 characters long',
  },
  LOYALTY: {
    LEVEL_UP_TITLE: 'New Level Reached! 🎉',
    LEVEL_UP_BODY: (level: number) =>
      `Congratulations! You have reached level Lv. ${level}! Continue contributing to receive more rewards.`,
    NEW_BADGE_TITLE: 'New Badge Unlocked! ✨',
    NEW_BADGE_BODY: (badge: string) =>
      `Congratulations! You have earned the "${badge}" badge!`,
  },
};
