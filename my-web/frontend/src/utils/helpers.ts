/**
 * Tạo một chuỗi ID ngẫu nhiên ngắn
 * Dùng cho các thành phần UI tạm thời như Toast, Item trong list...
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Validate image URL for Next/Image to prevent crashes from invalid URLs like 'a'
 */
export const getValidImageUrl = (url?: string | null): string => {
  if (!url) return '/placeholder-food.jpg';
  
  const isValid = 
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('/') || 
    url.startsWith('data:');
    
  return isValid ? url : '/placeholder-food.jpg';
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
