export const LIMITS = {
  /**
   * Số lượng món ăn hiển thị tối đa trong danh sách hoạt động gần đây tại dashboard merchant
   */
  RECENT_VIEWS_DASHBOARD: 100,

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
  NEARBY_FOODS_RADIUS: 5,

  /**
   * Thời gian tự động ẩn thông báo Toast (ms)
   */
  TOAST_AUTO_REMOVE_DELAY: 3000,

  /**
   * Số lượng tối đa Nhóm danh mục một nhà hàng có thể tạo
   */
  MAX_CATEGORY_GROUPS: 10,

  /**
   * Thời gian delay giả lập tương tác UI (ms) – dùng cho các flow mock không có API thật
   */
  MOCK_SUBMIT_DELAY_MS: 600,

  /**
   * Thời gian tự động ẩn thông báo lỗi ngắn trong UI (ms)
   */
  ERROR_MSG_AUTO_HIDE_MS: 3000,

  /**
   * Thời gian tự động ẩn thông báo thành công dài trong UI (ms)
   */
  SUCCESS_MSG_AUTO_HIDE_MS: 5000,

  /**
   * Số lượng nhà hàng tối đa khi tải danh sách để liên kết bài đăng
   */
  POST_LINKING_RESTAURANTS_PAGE_SIZE: 50,

  /**
   * Số ký tự tối thiểu của mô tả báo cáo lỗi kỹ thuật
   */
  BUG_REPORT_DESC_MIN_LENGTH: 10,

  /**
   * Số ký tự tối đa hiển thị label trục X trong biểu đồ SVG
   */
  CHART_X_LABEL_MAX_CHARS: 10,

  /**
   * Kích thước trang mặc định cho danh sách nhà hàng tại trang Khám phá
   */
  EXPLORE_RESTAURANTS_PAGE_SIZE: 20,

  /**
   * Kích thước trang mặc định cho danh sách món ăn của nhà hàng công khai
   */
  PUBLIC_RESTAURANT_FOODS_PAGE_SIZE: 8,

  /**
   * Kích thước trang mặc định cho bảng quản trị viên (Admin Tables)
   */
  ADMIN_PAGE_SIZE: 5,

  /**
   * Kích thước trang mặc định cho phân trang theo nhà hàng trong quản lý món ăn đối tác của Admin
   */
  ADMIN_RESTAURANT_GROUP_PAGE_SIZE: 5,

  /**
   * Số món ăn hiển thị ban đầu tại trang chủ trước khi người dùng nhấn "Tải thêm"
   * Được tính để lấp đầy 5 cột × 6 hàng, để ô cuối cùng là nút Tải thêm
   */
  HOME_FOOD_INITIAL_LIMIT: 29,

  /**
   * Điểm thưởng/phạt mặc định cho các hoạt động mạng xã hội (tương tác bài viết/bình luận)
   */
  LOYALTY_POINTS: {
    LIKE_POST: 5,
    UNLIKE_POST: -5,
    COMMENT_POST: 10,
    DELETE_COMMENT: -10,
    REPLY_COMMENT: 5,
    DELETE_REPLY: -5,
    CREATE_POST: 50,
    DELETE_POST: -50,
    SHARE_POST: 15,
  },
};

