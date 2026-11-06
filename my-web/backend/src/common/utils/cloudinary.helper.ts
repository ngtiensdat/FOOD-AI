/**
 * Mục đích file này để làm gì: Tiện ích xử lý trích xuất Public ID từ URL Cloudinary.
 * Các file khác hay file này có ý nghĩa như nào: Dùng chung cho UserService, FoodService, RestaurantService để dọn rác ảnh cũ.
 * Các chức năng đặc biệt: Trích xuất chính xác publicId bao gồm cả folder, bỏ qua version tag (v123...).
 */

export function extractPublicId(url: string | null | undefined): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const pathParts = parts[1].split('/');
    if (pathParts[0].match(/^v\d+$/)) pathParts.shift();
    const remainingPath = pathParts.join('/');
    const dotIndex = remainingPath.lastIndexOf('.');
    return dotIndex !== -1
      ? remainingPath.substring(0, dotIndex)
      : remainingPath;
  } catch {
    return null;
  }
}
