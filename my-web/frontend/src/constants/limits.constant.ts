export const LIMITS = {
  /**
   * Số lượng món ăn hiển thị tối đa trong danh sách hoạt động gần đây tại dashboard merchant
   */
  RECENT_VIEWS_DASHBOARD: 3,

  /**
   * Số lượng món ăn hiển thị trong widget hoạt động gần đây của khách hàng
   */
  RECENT_VIEWS_WIDGET: 5,

  /**
   * Số lượng món ăn tối đa trong lịch sử xem đầy đủ của khách hàng
   */
  RECENT_VIEWS_HISTORY: 20,

  /**
   * Thời gian chờ tối đa (ms) khi định vị vị trí người dùng (Geolocation)
   */
  GEOLOCATION_TIMEOUT: 10000,

  /**
   * Thời gian cache tọa độ geolocation tối đa (ms)
   */
  GEOLOCATION_MAX_AGE: 60000,

  /**
   * Bán kính mặc định để quét món ăn quanh đây (km)
   */
  NEARBY_FOODS_RADIUS: 20,

  /**
   * Thời gian tự động ẩn thông báo Toast (ms)
   */
  TOAST_AUTO_REMOVE_DELAY: 3000,
};
