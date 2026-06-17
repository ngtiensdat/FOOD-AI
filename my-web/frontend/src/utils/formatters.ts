/**
 * Định dạng số thành tiền Việt Nam (VND)
 * Ví dụ: 10000 -> 10.000đ
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
};

/**
 * Định dạng ngày tháng theo chuẩn Việt Nam
 * Ví dụ: 2024-05-15 -> 15/05/2024
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
};

/**
 * Định dạng khoảng cách (m hoặc km)
 * Ví dụ: 0.5 -> 500m, 1.2 -> 1.2km
 */
export const formatDistance = (distance: number | undefined | null): string => {
  if (distance === undefined || distance === null) return '';
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)}km`;
};
