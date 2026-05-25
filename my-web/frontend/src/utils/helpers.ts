/**
 * Tạo một chuỗi ID ngẫu nhiên ngắn
 * Dùng cho các thành phần UI tạm thời như Toast, Item trong list...
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Clean image URL (e.g. remove ShopeeFood CDN resize filters to get HD quality)
 */
export const cleanImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.includes('susercontent.com') && url.includes('@')) {
    return url.split('@')[0];
  }
  return url;
};

/**
 * Validate image URL for Next/Image to prevent crashes from invalid URLs like 'a'
 */
export const getValidImageUrl = (url?: string | null): string => {
  if (!url) return '/placeholder-food.svg';
  
  const cleanedUrl = cleanImageUrl(url);
  
  const isValid = 
    cleanedUrl.startsWith('http://') || 
    cleanedUrl.startsWith('https://') || 
    cleanedUrl.startsWith('/') || 
    cleanedUrl.startsWith('data:');
    
  return isValid ? cleanedUrl : '/placeholder-food.svg';
};

/**
 * Phân tích chuỗi địa chỉ thành các phần: Tỉnh/Thành phố, Quận/Huyện, và Địa chỉ cụ thể.
 * Hỗ trợ định dạng: "Địa chỉ cụ thể, Quận/Huyện, Tỉnh/Thành phố"
 */
export const parseAddressString = (addressStr?: string | null) => {
  if (!addressStr) return { city: '', district: '', street: '' };
  const parts = addressStr.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const city = parts[parts.length - 1];
    const district = parts[parts.length - 2];
    const street = parts.slice(0, parts.length - 2).join(', ');
    return { city, district, street };
  } else if (parts.length === 2) {
    return { city: parts[1], district: parts[0], street: '' };
  }
  return { city: '', district: '', street: addressStr };
};

/**
 * Robust helper to check if restaurant is open based on hours & manual status
 * Moved from FoodDetailModal to separate UI from Business Logic
 */
export const isRestaurantCurrentlyOpen = (openingHours?: string, isActive?: boolean) => {
  if (isActive === false) return false;
  if (!openingHours) return true; // default open

  try {
    const cleanHours = openingHours.replace(/\s+/g, '');
    const match = cleanHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) return true;

    const [, sh, sm, eh, em] = match;
    const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    if (startMin <= endMin) {
      return currentMin >= startMin && currentMin <= endMin;
    } else {
      // Over midnight
      return currentMin >= startMin || currentMin <= endMin;
    }
  } catch {
    return true;
  }
};

/**
 * Kiểm tra định dạng và giá trị giờ mở cửa hợp lệ (HH:MM-HH:MM)
 */
export const isValidOpeningHours = (openingHours?: string | null): boolean => {
  if (!openingHours || !openingHours.trim()) return true;
  
  const cleanHours = openingHours.replace(/\s+/g, '');
  const match = cleanHours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return false;

  const [, sh, sm, eh, em] = match;
  const shNum = parseInt(sh, 10);
  const smNum = parseInt(sm, 10);
  const ehNum = parseInt(eh, 10);
  const emNum = parseInt(em, 10);

  return shNum <= 23 && smNum <= 59 && ehNum <= 23 && emNum <= 59;
};

