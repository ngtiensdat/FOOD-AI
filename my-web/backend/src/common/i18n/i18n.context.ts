// Mục đích: Quản lý ngữ cảnh ngôn ngữ (i18n context) của từng request thông qua AsyncLocalStorage và cung cấp hàm dịch động.
// Các file khác hay file này có ý nghĩa như nào: Được sử dụng bởi I18nMiddleware để thiết lập ngôn ngữ và bởi messages.constant.ts để trả về thông báo đa ngôn ngữ tương ứng.
// Các chức năng đặc biệt: lookupTranslation() hỗ trợ tìm kiếm bằng dot notation và hỗ trợ truyền tham số cho các hàm dịch động (như đếm số phút khóa, số lượt còn lại).
// Kiến thức, Design Pattern, nguyên tắc: Context-scoped storage using AsyncLocalStorage, Dictionary Translation Pattern.
// Các biến, hàm đặc biệt: i18nStorage, getLang(), lookupTranslation(), t().

import { AsyncLocalStorage } from 'async_hooks';
import { en } from './en';

// Tạo store lưu trữ ngôn ngữ cho mỗi request context
export const i18nStorage = new AsyncLocalStorage<{ lang: string }>();

// Bộ từ điển bản dịch
const dictionaries: Record<string, typeof en> = {
  en,
};

/**
 * Lấy ngôn ngữ hiện tại của request context (mặc định là 'vi')
 */
export function getLang(): string {
  const store = i18nStorage.getStore();
  return store?.lang || 'vi';
}

/**
 * Tra cứu bản dịch theo đường dẫn (dot notation, ví dụ: 'AUTH.USER_EXISTS')
 */
export function lookupTranslation(
  lang: string,
  path: string,
  ...args: (string | number)[]
): string | null {
  const dict = dictionaries[lang];
  if (!dict) return null;

  const keys = path.split('.');
  let current: unknown = dict;

  for (const key of keys) {
    if (
      current &&
      typeof current === 'object' &&
      key in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }

  if (typeof current === 'function') {
    return (current as (..._args: (string | number)[]) => string)(...args);
  }
  if (typeof current === 'string') {
    return current;
  }

  return null;
}

/**
 * Hàm dịch động t()
 * @param key Đường dẫn khoá dịch (ví dụ: 'AUTH.LOGIN_SUCCESS')
 * @param defaultValue Giá trị tiếng Việt mặc định
 * @param args Các tham số đi kèm để nội suy nếu là hàm dịch
 */
export function t(
  key: string,
  defaultValue: string,
  ...args: (string | number)[]
): string {
  const lang = getLang();
  if (lang === 'vi') {
    return defaultValue;
  }

  const translated = lookupTranslation(lang, key, ...args);
  return translated !== null ? translated : defaultValue;
}
