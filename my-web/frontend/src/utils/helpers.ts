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
