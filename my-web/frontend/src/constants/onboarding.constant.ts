
export const ONBOARDING_DEFAULTS = {
  SUCCESS_ANIMATION_TIMEOUT: 2000,
};

export const ONBOARDING_LABELS = {
  BRANCH_STEP_TITLE: 'Thiết lập vị trí & chi nhánh kinh doanh',
  BRANCH_STEP_DESC: 'Khai báo cơ sở (tên quán, địa chỉ chính xác, Google Maps) để AI tối ưu hóa hiển thị cho thực khách xung quanh.',
  ADD_BRANCH_BTN: 'Thêm Cơ Sở Khác (+ Chi Nhánh)',
  BACK_BTN: 'Quay Lại',
  COMPLETE_BTN: 'Hoàn Tất & Khởi Tạo',
  REQUIRED_BRANCH_FIELDS: (index: number) => `Vui lòng điền đầy đủ Tên và Địa chỉ của Cơ sở thứ ${index}.`,
  INVALID_COORDINATES: (index: number) => `Tọa độ (Kinh/Vĩ độ) của Cơ sở thứ ${index} bắt buộc phải là số.`,
  INVALID_LATITUDE: (index: number) => `Vĩ độ (Latitude) của Cơ sở thứ ${index} phải nằm trong khoảng từ -90 đến 90.`,
  INVALID_LONGITUDE: (index: number) => `Kinh độ (Longitude) của Cơ sở thứ ${index} phải nằm trong khoảng từ -180 đến 180.`,
  INVALID_HOURS_FORMAT: (index: number) => `Giờ hoạt động của Cơ sở thứ ${index} không đúng định dạng (Ví dụ đúng: 08:00 - 22:00).`,
  MIN_BRANCH_REQUIRED: 'Thương gia bắt buộc phải khai báo ít nhất 1 cơ sở chính.',
  ADD_BRANCH_SUCCESS: 'Đã thêm 1 chi nhánh trống. Vui lòng điền thông tin bên dưới.',
  REMOVE_BRANCH_SUCCESS: 'Đã xóa cơ sở khỏi danh sách.',
  STEP_INDICATOR: (current: number, total: number) => `Bước ${current} / ${total}`,
  FORM: {
    NAME_LABEL: 'Tên cơ sở / Chi nhánh',
    NAME_PLACEHOLDER: 'Ví dụ: FOOD AI - Chi Nhánh Hà Nội',
    ADDRESS_LABEL: 'Địa chỉ thực tế',
    ADDRESS_PLACEHOLDER: 'Ví dụ: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    LAT_LABEL: 'Vĩ độ (Latitude)',
    LAT_PLACEHOLDER: 'Ví dụ: 20.976094137561798',
    LNG_LABEL: 'Kinh độ (Longitude)',
    LNG_PLACEHOLDER: 'Ví dụ: 105.76295609115984',
    MAP_URL_LABEL: 'Link bản đồ Google Maps (Tùy chọn)',
    MAP_URL_PLACEHOLDER: 'Ví dụ: https://maps.google.com/...',
    HOURS_LABEL: 'Giờ hoạt động (Tùy chọn)',
    HOURS_PLACEHOLDER: 'Ví dụ: 09:00 - 21:00',
    BIO_LABEL: 'Khẩu hiệu / Giới thiệu ngắn',
    BIO_PLACEHOLDER: 'Ví dụ: Đồ ăn sạch, tốt cho sức khỏe...',
  }
};
