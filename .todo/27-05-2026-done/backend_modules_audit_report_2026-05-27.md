# Báo Cáo Audit Thư Mục `modules` (Backend)
*Ngày tạo: 27/05/2026*

## 1. Mục Tiêu Kiểm Toán
Rà soát toàn bộ các module lõi của hệ thống (`admin`, `ai`, `auth`, `category`, `food`, `mail`, `user`) theo quy chuẩn chất lượng mã nguồn.

## 2. Các Vấn Đề Phát Hiện (Mức độ cao xuống thấp)

### 2.1. Vi phạm TypeScript (Sử dụng `any`) - Mức độ: High
- **File:** `admin/merchant-import.service.ts`
- **Vấn đề:** Lạm dụng kiểu `any` ở các hàm `parseExcelBuffer(buffer: Buffer): any[]` và `groupMerchantsByEmail(rows: any[])`. Điều này làm mất đi khả năng kiểm tra kiểu dữ liệu an toàn của TypeScript.
- **Giải pháp:** Cần định nghĩa một Interface (ví dụ `ExcelMerchantRow`) để ép kiểu dữ liệu đọc từ Excel.

### 2.2. Vi phạm Hardcode / Magic Values - Mức độ: Medium
Rất nhiều chuỗi thông báo lỗi (Exception) đang bị gõ cứng (hardcode) rải rác trong code thay vì lấy từ file `messages.constant.ts`.
- **`auth/auth.service.ts`:** 
  - `'Tài khoản đang chờ phê duyệt'`, `'Tài khoản đã bị từ chối'`
  - `'Mật khẩu mới không được để trống'`, `'Mật khẩu cũ không chính xác'`
  - `'Invalid refresh token'`, `'Người dùng không tồn tại'`
- **`auth/auth.controller.ts`:** `'No refresh token'`
- **`admin/merchant-import.service.ts`:** `'File Excel trống hoặc sai định dạng'`
- **`admin/admin.service.ts`:** `'Trạng thái không hợp lệ'`
- **`admin/admin.controller.ts`:** `'Vui lòng upload file Excel'`, `'value must be boolean'`
- **Giải pháp:** Bổ sung các chuỗi này vào hằng số `MESSAGES` và import để dùng.

### 2.3. Vi phạm Tiêu chuẩn Logging - Mức độ: Low
- **File:** `auth/auth.service.ts`
- **Vấn đề:** Đang dùng `console.log` thuần để ghi log đăng nhập (dòng 71, 96). 
- **Giải pháp:** Thay thế bằng `Logger` chuẩn của NestJS (`private readonly logger = new Logger(AuthService.name)`).

### 2.4. Khả năng mở rộng (God Module) - Mức độ: Info
- **File:** `food/food.service.ts`
- **Vấn đề:** File này khá lớn (550 dòng) ôm đồm toàn bộ logic: CRUD món ăn, quản lý trạng thái nhà hàng, thuật toán gợi ý món, tìm kiếm xung quanh, follow/unfollow nhà hàng...
- **Giải pháp:** Dài hạn có thể cân nhắc chia nhỏ thành `RestaurantService` (xử lý logic nhà hàng/follow) và `FoodService` (chỉ xử lý món ăn thuần túy).

---

## 3. Chấm Điểm Tổng Thể Thư Mục Modules: 7.5/10
**Nhận xét:**
Các module được tổ chức theo mô hình Controller - Service - Repository rất rõ ràng, đảm bảo Dependency Injection. Tuy nhiên, việc sử dụng `any` trong tính năng import Excel và rò rỉ rất nhiều chuỗi hardcode (Magic strings) đã làm giảm điểm số. Logic bị phình to (God Object) ở `food.service.ts` cũng là một technical debt cần chú ý.

## 4. Hành Động Đề Xuất (Action Items)
1. **Refactor Code:** Gỡ bỏ toàn bộ hardcode string và thay bằng `MESSAGES`. Xóa các `any` và thay bằng interface. Chuyển đổi `console.log` sang `Logger`.
2. **Thêm JSDoc:** Sau khi refactor xong, cần thêm JSDoc header cho toàn bộ 50 file trong thư mục `modules` theo `Instructions.md`.
