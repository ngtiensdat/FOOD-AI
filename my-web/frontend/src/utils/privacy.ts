/**
 * Mục đích: Tiện ích quản lý cài đặt riêng tư của người dùng.
 * Kiến thức: SRP – tách biệt khỏi ProfileSettingsTab component để có thể dùng lại độc lập.
 * Các hàm đặc biệt: PRIVACY_KEYS, getPrivacyValue, resolvePrivacyValue.
 */

/** Key localStorage cho từng trường thông tin cá nhân */
export const PRIVACY_KEYS = {
  showLevel: 'privacy_showLevel',
  showBadge: 'privacy_showBadge',
  showPoints: 'privacy_showPoints',
  showXpBar: 'privacy_showXpBar',
  showFollowList: 'privacy_showFollowList',
  showEmail: 'privacy_showEmail',
  showPhone: 'privacy_showPhone',
  showAddress: 'privacy_showAddress',
} as const;

/** Đọc giá trị từ localStorage, mặc định true (hiển thị) */
export function getPrivacyValue(key: keyof typeof PRIVACY_KEYS): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(PRIVACY_KEYS[key]);
  return stored !== null ? JSON.parse(stored) : true;
}

/**
 * Giải quyết giá trị ẩn/hiện thông tin cá nhân dựa trên preferences từ Database,
 * và fallback về localStorage nếu là chủ sở hữu (owner).
 */
export function resolvePrivacyValue(
  key: keyof typeof PRIVACY_KEYS,
  profilePreferences: Record<string, unknown> | null | undefined,
  isOwner: boolean
): boolean {
  // 1. Kiểm tra trong preferences từ DB (do server trả về)
  if (profilePreferences && profilePreferences[key] !== undefined) {
    return profilePreferences[key] === true;
  }

  // 2. Nếu là chủ sở hữu và chưa có trên DB, đọc từ localStorage làm fallback
  if (isOwner) {
    return getPrivacyValue(key);
  }

  // 3. Mặc định là hiển thị nếu không có cấu hình và là khách xem
  return true;
}
