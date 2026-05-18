
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
  MIN_BRANCH_REQUIRED: 'Thương gia bắt buộc phải khai báo ít nhất 1 cơ sở chính.',
  ADD_BRANCH_SUCCESS: 'Đã thêm 1 chi nhánh trống. Vui lòng điền thông tin bên dưới.',
  REMOVE_BRANCH_SUCCESS: 'Đã xóa cơ sở khỏi danh sách.',
  STEP_INDICATOR: (current: number, total: number) => `Bước ${current} / ${total}`,
  FORM: {
    NAME_LABEL: 'Tên cơ sở / Chi nhánh',
    NAME_PLACEHOLDER: 'Ví dụ: FOOD AI - Chi Nhánh Quận 1',
    ADDRESS_LABEL: 'Địa chỉ thực tế',
    ADDRESS_PLACEHOLDER: 'Ví dụ: 123 Bến Thành, Quận 1, TP. Hồ Chí Minh',
    LAT_LABEL: 'Vĩ độ (Latitude)',
    LAT_PLACEHOLDER: 'Ví dụ: 10.762622',
    LNG_LABEL: 'Kinh độ (Longitude)',
    LNG_PLACEHOLDER: 'Ví dụ: 106.660172',
    MAP_URL_LABEL: 'Link bản đồ Google Maps (Tùy chọn)',
    MAP_URL_PLACEHOLDER: 'Ví dụ: https://maps.google.com/...',
    HOURS_LABEL: 'Giờ hoạt động (Tùy chọn)',
    HOURS_PLACEHOLDER: 'Ví dụ: 09:00 - 21:00',
    BIO_LABEL: 'Khẩu hiệu / Giới thiệu ngắn',
    BIO_PLACEHOLDER: 'Ví dụ: Đồ ăn sạch, tốt cho sức khỏe...',
  }
};
