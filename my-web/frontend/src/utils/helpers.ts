/**
 * Mục đích file này để làm gì: Module tiện ích (Utility Module) chứa các hàm bổ trợ dùng chung ở Frontend của dự án FOOD AI.
 * Các file khác hay file này có ý nghĩa như nào: Cung cấp các hàm chuẩn hóa, xử lý chuỗi và thời gian, tách biệt hoàn toàn logic tính toán khỏi giao diện UI để tăng khả năng bảo trì và hỗ trợ viết unit test độc lập (helpers.test.ts).
 * Các chức năng đặc biệt:
 *   - generateId: Tạo mã định danh tạm thời ngẫu nhiên ngắn cho Toast, key trong danh sách UI.
 *   - cleanImageUrl: Chuẩn hóa đường dẫn hình ảnh CDN từ ShopeeFood (xóa tham số nén) để lấy ảnh chất lượng HD.
 *   - getValidImageUrl: Xác thực địa chỉ hình ảnh, chống lỗi crash Next.js Image và tự động fallback sang ảnh PNG '/placeholder-food.png' nếu đường dẫn lỗi.
 *   - parseAddressString: Phân tích địa chỉ dài thành 3 phần (Tỉnh/Thành phố, Quận/Huyện, Địa chỉ chi tiết) để hỗ trợ bộ lọc định vị.
 *   - isRestaurantCurrentlyOpen: Kiểm tra xem nhà hàng có đang mở cửa tại thời điểm hiện tại của hệ thống hay không dựa vào cấu hình chuỗi giờ.
 *   - isValidOpeningHours: Kiểm tra định dạng hợp lệ của chuỗi giờ đóng/mở cửa.
 */
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
  if (!url) return '/placeholder-food.png';

  const cleanedUrl = cleanImageUrl(url);

  const isValid =
    cleanedUrl.startsWith('http://') ||
    cleanedUrl.startsWith('https://') ||
    cleanedUrl.startsWith('/') ||
    cleanedUrl.startsWith('data:');

  return isValid ? cleanedUrl : '/placeholder-food.png';
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

/**
 * Trả về mảng số trang hiển thị dạng thu gọn có dấu ba chấm (...)
 * Ví dụ: [1, '...', 4, 5, 6, '...', 100]
 */
export const getPaginationRange = (currentPage: number, totalPages: number, maxVisible = 5): number[] => {
  const pages: number[] = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }

  return pages;
};

/**
 * Trích xuất publicId từ Cloudinary URL để xóa ảnh cũ
 */
export const extractPublicId = (url: string): string | null => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const pathParts = parts[1].split('/');
    if (pathParts[0].match(/^v\d+$/)) pathParts.shift();
    const remainingPath = pathParts.join('/');
    const dotIndex = remainingPath.lastIndexOf('.');
    return dotIndex !== -1 ? remainingPath.substring(0, dotIndex) : remainingPath;
  } catch {
    return null;
  }
};

/**
 * Tạo link Google Maps tự động dựa trên kinh vĩ độ hoặc fallback về url bản đồ cấu hình sẵn.
 */
export const getGoogleMapsUrl = (
  latitude?: number | string | null,
  longitude?: number | string | null,
  fallbackMapUrl?: string | null,
  restaurantName?: string | null,
  address?: string | null
): string => {
  // 1. Nếu chủ quán đã điền link bản đồ thủ công (custom URL), ưu tiên dùng luôn link đó
  if (fallbackMapUrl && fallbackMapUrl.trim()) {
    return fallbackMapUrl.trim();
  }

  // 2. Ưu tiên tìm kiếm theo Tên nhà hàng + Địa chỉ để Google Maps hiển thị đúng bảng hiệu đăng ký
  if (restaurantName && address) {
    const cleanAddress = address.trim();
    const query = `${restaurantName.trim()}, ${cleanAddress}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  
  // 3. Nếu có địa chỉ, tìm kiếm theo địa chỉ
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }

  // 4. Tọa độ là phương án dự phòng khi thiếu thông tin văn bản
  if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
  }
  return '';
};
