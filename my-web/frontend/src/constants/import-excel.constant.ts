export const IMPORT_EXCEL_CONSTANTS = {
  VALID_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ],
  TEMPLATE_HEADERS: 'Email,Password,Owner Name,Restaurant Name,Address,Latitude,Longitude,Food Name,Food Price,Food Image URL,Food Desc,Food Tags\n',
  TEMPLATE_SAMPLE: 'merchant@gmail.com,123456,Nguyen Van A,Pizza A,Hanoi,21.0285,105.8542,Pizza Hải Sản,150000,https://example.com/pizza.jpg,Pizza ngon,ngon,cay\n',
  TEMPLATE_FILENAME: 'merchant_template.csv',
  MESSAGES: {
    INVALID_FILE_TYPE: 'Vui lòng chọn file Excel (.xlsx) hoặc CSV (.csv)',
    IMPORT_SUCCESS: (created: number, appended: number) => `Import thành công! Đã tạo ${created} nhà hàng, gộp ${appended} nhà hàng.`,
    IMPORT_ERROR_DEFAULT: 'Lỗi khi import file Excel'
  }
};
