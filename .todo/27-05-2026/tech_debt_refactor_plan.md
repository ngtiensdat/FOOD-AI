# Kế hoạch Xử lý Nợ Kỹ thuật (Technical Debt Refactoring Plan)
*Ngày lập: 27-05-2026*

Tài liệu này ghi nhận lại các vấn đề nợ kỹ thuật (Technical Debt) sinh ra từ các cảnh báo của ESLint (Warnings) trong quá trình phát triển nhanh (Sprint). Các vấn đề này không làm hỏng ứng dụng nhưng cần được xử lý (Refactor) ở các Sprint bảo trì để đảm bảo chất lượng, hiệu năng và dễ dàng mở rộng dự án về sau.

## 1. Tổng quan tình trạng hiện tại
- **Backend (NestJS):** ~65 Cảnh báo.
- **Frontend (Next.js):** ~170 Cảnh báo.

## 2. Chi tiết các loại cảnh báo và cách xử lý (Todo List)

### A. Vấn đề 1: Khai báo biến/thư viện nhưng không sử dụng
**Cảnh báo:** `unused-imports/no-unused-vars`
**Mức độ ưu tiên:** Thấp (Low) - Chỉ gây rác code.
**Cách tôi sẽ fix sau này:**
- Sử dụng tính năng auto-fix của ESLint: Chạy lệnh `npm run lint -- --fix` ở cả hai thư mục backend và frontend.
- Nếu auto-fix không xử lý hết, tôi sẽ dùng lệnh tìm kiếm trên toàn dự án để rà soát và xóa các đoạn code thừa, các biến khai báo dư thừa trong component hoặc hook.

### B. Vấn đề 2: Lạm dụng kiểu `any` trong TypeScript
**Cảnh báo:** `@typescript-eslint/no-explicit-any`
**Mức độ ưu tiên:** Trung bình cao (Medium-High) - Gây mất an toàn kiểu dữ liệu (Type Safety).
**Cách tôi sẽ fix sau này:**
- **Bước 1 (Backend):** Rà soát các file Service và Controller, định nghĩa lại các DTO (Data Transfer Objects) hoặc Interface cụ thể thay vì dùng `any` khi gọi Database qua Prisma.
- **Bước 2 (Frontend - Dữ liệu trả về):** Trong các file gọi API (như `api-client.ts`, `auth.service.ts`), tôi sẽ map dữ liệu trả về với các interface chuẩn (VD: `IUser`, `IRestaurant`, `ApiResponse<T>`).
- **Bước 3 (Frontend - State & Props):** Loại bỏ `any` trong các file hooks (`useHomeData.ts`, `useRestaurantProfile.ts`...) bằng cách truyền generic types đúng cấu trúc mà backend trả về.

### C. Vấn đề 3: Cập nhật State sai cách trong React (Cascading Renders)
**Cảnh báo:** `react-hooks/set-state-in-effect`
**Mức độ ưu tiên:** Cao (High) - Có khả năng làm chậm UI (Performance) do render dư thừa.
**Cách tôi sẽ fix sau này:**
- **Ví dụ điển hình:** Lỗi ở `useExploreActions.ts` (dòng 46): `setCurrentPage(1)` nằm trong `useEffect` lắng nghe sự thay đổi của các bộ lọc (filter).
- **Giải pháp:** Thay vì dùng `useEffect` để reset lại page, tôi sẽ gộp thao tác reset `setCurrentPage(1)` thẳng vào trong hàm xử lý khi user click chọn filter (Ví dụ: hàm `handleCityChange`, `handleTagClick`). Điều này giúp React chỉ gom lại thành 1 lần render duy nhất.
- Kiểm tra các Component lớn như `EditRestaurantModal.tsx` để tối ưu hóa, đảm bảo không có state nào bị ép render 2-3 vòng liên tiếp.

## 3. Khuyến nghị thời điểm thực hiện
- Không nên làm ngay trong lúc đang code tính năng dang dở (như Sprint 3 hiện tại).
- Nên tạo một nhánh (Branch) riêng mang tên `refactor/fix-eslint-warnings` vào cuối Sprint hoặc trong những ngày ít task.
- Có thể chia thành 3 PR (Pull Request) nhỏ tương ứng với 3 vấn đề trên để dễ Review, tránh việc 1 PR sửa tới hàng trăm file gây rủi ro (Conflict code) cho thành viên khác.

---
*Ghi chú cho AI Assistants: Bất cứ lúc nào User yêu cầu "Thực thi kế hoạch dọn dẹp Technical Debt", hãy mở file này ra, chọn 1 trong 3 Vấn đề (ưu tiên C, B, A) và bắt đầu từng bước refactor mã nguồn.*
