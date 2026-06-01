# BÁO CÁO RÀ SOÁT CHẤT LƯỢNG & BẢO MẬT CODEBASE (AI CODE AUDIT REPORT)
*Ngày tạo: 28/05/2026*
*Dự án: FOOD AI*
*Người đánh giá: Trợ lý AI (Antigravity)*

---

## 1. TỔNG QUAN QUÉT MÃ NGUỒN (CORE CODEBASE SCAN)

Đợt kiểm toán (Audit) này đã quét và phân tích toàn diện mã nguồn của cả **Frontend** và **Backend**, đặc biệt đối chiếu với:
1. **Hệ thống luật của AI (.agent/rule/)** bao gồm quy tắc Kiến trúc sạch, Bảo mật, Prisma, Frontend UI.
2. **Quy chuẩn của lập trình viên (documents/08-conventions/)** bao gồm quy ước đặt tên nhánh, commit, folder structure và lịch sử chất lượng.
3. **Các prompt review mẫu (.check-prompt/)** về kiến trúc NestJS, React/Next.js, bắt hardcode và magic values.

---

## 2. DANH SÁCH CÁC VẤN ĐỀ PHÁT HIỆN (SECURITY & QUALITY AUDIT)

Các vấn đề được phân loại theo mức độ nghiêm trọng từ **Nghiêm trọng (Critical)** đến **Thấp (Low) / Code Quality**.

### 🔴 MỨC ĐỘ: NGHIÊM TRỌNG (CRITICAL)

#### 1. Lỗi 404 Fallback Ảnh Do `getValidImageUrl` Trỏ Tới File Đã Bị Xóa
* **Vị trí cụ thể:** 
  * File helper: [helpers.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/utils/helpers.ts) (Dòng 24 & 34)
  * File unit test: [helpers.test.ts](file:///e:/FOOD_AI_code/my-web/frontend/src/utils/helpers.test.ts) (Dòng 26, 27 & 31)
* **Nguyên nhân:** Hàm `getValidImageUrl` vẫn đang trả về cứng chuỗi `/placeholder-food.svg` làm ảnh fallback khi đường dẫn truyền vào bị lỗi hoặc trống. Tuy nhiên, trong đợt dọn dẹp và chuẩn hóa thư mục `public/` trước đó, toàn bộ các file ảnh định dạng SVG đã bị xóa bỏ và thay thế hoàn toàn bằng phiên bản PNG là `/placeholder-food.png` (để tránh lỗi trình duyệt từ chối render SVG favicon chứa base64). Điều này khiến mọi component trên giao diện khi kích hoạt cơ chế ảnh lỗi sẽ hiển thị một liên kết hỏng (Broken Image 404).
* **Giải pháp khắc phục:** 
  * Đổi tất cả chuỗi `/placeholder-food.svg` thành `/placeholder-food.png` trong `helpers.ts`.
  * Cập nhật lại các xác định `expect(...)` trong file unit test `helpers.test.ts` tương ứng.

---

### 🟡 MỨC ĐỘ: CAO (HIGH)

#### 2. Vi Phạm Nghiêm Trọng Ranh Giới Đóng Gói Module (Module Boundary Violation)
* **Vị trí cụ thể:** 
  * Service Category: [category.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/category/services/category.service.ts) (Dòng 23-25)
  * Service Category Group: [category-group.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/category/services/category-group.service.ts) (Dòng 25-27)
* **Nguyên nhân:** Cả hai service này đang truy cập trực tiếp vào cơ sở dữ liệu `prisma` thông qua thuộc tính private của Repository khác bằng cách lách luật sử dụng toán tử ngoặc vuông động: `this.categoryGroupRepo['prisma'].restaurant.findFirst(...)`. Đây là một **anti-pattern** nghiêm trọng trong Clean Architecture và cơ chế Dependency Injection của NestJS. Nó phá vỡ ranh giới Module và ranh giới đóng gói dữ liệu của Repositories, gây ra sự liên kết chặt chẽ (Tight Coupling) và khiến việc viết Unit Tests trở nên cực kỳ khó khăn.
* **Giải pháp khắc phục:** 
  * Tiêm trực tiếp `PrismaService` vào `CategoryService` và `CategoryGroupService` nếu cần truy vấn bảng `Restaurant`.
  * Hoặc tối ưu hơn: Định nghĩa một phương thức tìm kiếm hợp lệ trong `RestaurantRepository` và tiêm Repository đó vào các service này.

#### 3. Cấu Hình TypeScript Bỏ Qua Lỗi Biên Dịch Khi Build Production
* **Vị trí cụ thể:** [next.config.ts](file:///e:/FOOD_AI_code/my-web/frontend/next.config.ts) (Dòng 16-18)
* **Nguyên nhân:** Cấu hình `ignoreBuildErrors: true` trong `next.config.ts` cho phép Next.js bỏ qua các lỗi kiểm tra kiểu dữ liệu TypeScript khi đóng gói ứng dụng (Production Build). Việc này làm lu mờ hoàn toàn thế mạnh của Static Typing, tạo điều kiện cho các lỗi nghiêm trọng rò rỉ lên môi trường Production và có thể gây crash ứng dụng runtime.
* **Giải pháp khắc phục:** Xóa bỏ hoàn toàn thuộc tính `typescript: { ignoreBuildErrors: true }` ra khỏi file cấu hình, đồng thời rà soát và sửa triệt để tất cả các lỗi compile TypeScript nếu có.

---

### 🟠 MỨC ĐỘ: TRUNG BÌNH (MEDIUM)

#### 4. Đặt Tên Tham Số Gây Hiểu Lầm Nghiêm Trọng (Parameter Naming Mismatch)
* **Vị trí cụ thể:** 
  * [category.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/category/controllers/category.controller.ts) (Dòng 35, 44, 57 & 67)
  * [category-group.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/category/controllers/category-group.controller.ts) (Dòng 37, 45, 54 & 64)
* **Nguyên nhân:** Tại các controller, tham số lấy từ Token JWT đăng nhập `@GetUser('id') restaurantId: number` được đặt tên là `restaurantId`. Tuy nhiên, decorator `@GetUser('id')` thực chất trích xuất trường `id` của tài khoản **User** (`userId`). Giá trị này sau đó được truyền vào service và service phải dùng hàm `getRestaurantId(userId)` để tìm ra `restaurantId` thực tế của quán ăn. Việc đặt tên biến ở controller là `restaurantId` gây hiểu nhầm sâu sắc cho bất kỳ lập trình viên nào khi đọc code, khiến họ tưởng rằng controller đã nắm giữ ID của Restaurant.
* **Giải pháp khắc phục:** Đổi tên tham số tại các Controller thành `@GetUser('id') userId: number` để phản ánh chính xác bản chất dữ liệu.

#### 5. Ném Sai Loại Phân Lớp Lỗi (Improper NestJS Exception Usage)
* **Vị trí cụ thể:** [admin.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/admin/admin.service.ts) (Dòng 30-33)
* **Nguyên nhân:** Trong hàm `updateUserStatus`, khi nhận được tham số `status` không hợp lệ (không phải `APPROVED` hay `REJECTED`), hệ thống lại ném ra lỗi `UnauthorizedException` kèm thông báo `INVALID_STATUS`. Về mặt ngữ nghĩa kiến trúc API, `UnauthorizedException` (401) chỉ dành cho lỗi xác thực danh tính/chưa đăng nhập. Ở đây dữ liệu truyền lên bị sai định dạng, đúng ra phải ném ra `BadRequestException` (400).
* **Giải pháp khắc phục:** Thay `UnauthorizedException` bằng `BadRequestException`.

#### 6. Thiếu Ràng Buộc DTO & Validation Rõ Ràng Cho API Đổi Mật Khẩu & Cập Nhật Trạng Thái
* **Vị trí cụ thể:** 
  * [auth.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/auth/auth.controller.ts) (Dòng 59-70)
  * [admin.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/admin/admin.controller.ts) (Dòng 44-50)
* **Nguyên nhân:** 
  * API `change-password` sử dụng trực tiếp `@Body() body: { oldPassword?: string; newPassword: string }` thô mà không thông qua DTO để kiểm tra độ dài tối thiểu, định dạng ký tự an toàn cho mật khẩu mới.
  * API `updateUserStatus` nhận trực tiếp `@Body('status') status: string` mà không dùng validation enum để giới hạn đầu vào của biến status ngay tại "cửa khẩu" request.
  * Điều này vi phạm nghiêm trọng **Quy tắc 4 (DTO & Validation Standard)** trong quy chuẩn kiến trúc của dự án.
* **Giải pháp khắc phục:** Tạo `ChangePasswordDto` và `UpdateUserStatusDto` kèm theo các decorator kiểm định chặt chẽ từ `class-validator` (`@IsString()`, `@MinLength()`, `@IsEnum(UserStatus)`).

---

### 🟢 MỨC ĐỘ: THẤP (LOW) / CODE QUALITY

#### 7. Vi Phạm Nguyên Lý Đơn Trách Nhiệm - Sử Dụng bcrypt Trực Tiếp Thay Vì BcryptHelper Facade
* **Vị trí cụ thể:** [merchant-import.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/admin/merchant-import.service.ts) (Dòng 10 & Dòng 173-174)
* **Nguyên nhân:** File import đối tác thương gia từ Excel đang tự động import thư viện `bcrypt` ngoài để tiến hành hash mật khẩu dev: `await bcrypt.genSalt(10)` và `await bcrypt.hash(...)`. Việc này vi phạm tính nhất quán kiến trúc vì dự án đã thiết kế sẵn một lớp tiện ích Facade là `BcryptHelper` để bọc mọi tương tác mã hóa.
* **Giải pháp khắc phục:** Thay thế bằng cách import và gọi `BcryptHelper.hash(...)`.

#### 8. Nhập Khẩu Thừa Không Sử Dụng (Dead Code)
* **Vị trí cụ thể:** [Navbar.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/Navbar.tsx) (Dòng 10)
* **Nguyên nhân:** File này import `Image` từ `next/image` nhưng thực tế phần render logo thương hiệu đã được tối ưu chuyển sang sử dụng component `SafeImage` tự chế để chống crash, khiến import `Image` gốc trở nên dư thừa.
* **Giải pháp khắc phục:** Xóa bỏ import `Image` không sử dụng để giữ mã nguồn sạch sẽ.

#### 9. Hardcode fallback cho JWT Secret trong cấu hình
* **Vị trí cụ thể:** [app.config.ts](file:///e:/FOOD_AI_code/my-web/backend/src/config/app.config.ts) (Dòng 11)
* **Nguyên nhân:** Cung cấp fallback `'super-secret-key-for-dev-only'` trực tiếp trong code nếu thiếu biến môi trường. Mặc dù đã có chốt chặn throw error ở production, việc để lộ fallback key dev trong code vẫn được coi là bad practice về mặt bảo mật.
* **Giải pháp khắc phục:** Loại bỏ fallback trong code, yêu cầu bắt buộc cấu hình file `.env` ở mọi môi trường phát triển.

---

## 3. CHẤM ĐIỂM CODEBASE (CODEBASE QUALITY SCORING)

Dựa trên các tiêu chí chấm điểm chất lượng của dự án, codebase hiện tại đạt được điểm số chi tiết như sau:

### 🌟 BẢNG ĐIỂM CHẤT LƯỢNG CODEBASE

| Lĩnh Vực Đánh Giá | Điểm Số | Nhận Xét & Đánh Giá Thực Tế |
| :--- | :---: | :--- |
| **Tính Bảo Mật (Security)** | **2.4 / 2.5** | **Rất tốt:** Áp dụng chặt chẽ cơ chế kiểm tra quyền sở hữu (Ownership/IDOR check) trên Service. Phân quyền `@Roles` chuẩn xác. Query Prisma được parameterize an toàn tuyệt đối chống SQL Injection. (Trừ 0.1đ do API đổi mật khẩu chưa dùng DTO xác thực). |
| **Kiến Trúc Hệ Thống (Architecture)** | **2.0 / 2.5** | **Tốt nhưng có vết gợn lớn:** Phân tách 3 lớp Controller-Service-Repository chuẩn chỉ. Tuy nhiên, việc "lách luật" chọc thuộc tính private `['prisma']` từ Repository khác vi phạm trực tiếp nguyên tắc Module Boundaries và đóng gói của Clean Architecture. Đặt tên biến gây hiểu lầm ở Module Category cũng là điểm trừ. |
| **Khả Năng Bảo Trì & Mở Rộng (Maintainability)** | **2.0 / 2.5** | **Khá:** Cấu trúc thư mục rõ ràng, phân rã hooks/services tốt. Các hằng số được định nghĩa đầy đủ. Điểm trừ lớn là lỗi fallback `/placeholder-food.svg` không tồn tại làm hỏng khả năng hiển thị ảnh lỗi và việc bỏ qua kiểm tra lỗi build TypeScript. |
| **Độ Hoàn Thiện (Production Readiness)** | **2.1 / 2.5** | **Tốt:** Thiết lập rate limit và exception filters toàn cục rất bài bản. Điểm cần tối ưu thêm là chuyển cơ chế ghi log hệ thống từ `console.log` thuần sang `NestJS Logger` hoặc `Pino` chuyên nghiệp hơn, kèm theo sửa các mã Exception lỗi cho đúng chuẩn REST API. |
| 📊 **TỔNG ĐIỂM CHUNG** | **8.5 / 10** | **Xếp hạng: Khá Tốt.** Dự án có nền tảng cực kỳ vững chắc, tư duy phân tách lớp rất mạch lạc. Chỉ cần tập trung giải quyết các lỗi ranh giới kiến trúc và chỉnh sửa tài nguyên ảnh fallback bị thiếu là có thể nâng điểm số lên mức xuất sắc (9.5+). |

---

## 4. CHI TIẾT ĐIỂM SỐ THEO TIÊU CHÍ GOOGLE DEEPMIND PROMPT (1-10)

* **Clean Code:** **8.5 / 10**
* **Scalability (Khả năng mở rộng):** **8.5 / 10**
* **Readability (Độ dễ đọc):** **9.0 / 10**
* **Security (Tính bảo mật):** **9.5 / 10**
* **Maintainability (Khả năng bảo trì):** **8.0 / 10**
* **Architecture (Kiến trúc):** **8.0 / 10**
* **Performance (Hiệu năng):** **9.0 / 10**
* **Production Readiness (Độ hoàn thiện):** **8.0 / 10**

---

## 5. ĐIỂM MẠNH & ĐIỂM YẾU LỚN NHẤT (STRENGTHS & WEAKNESSES)

* **Điểm mạnh lớn nhất (Biggest Strength):** 
  * **Tư duy phòng vệ & IDOR Protection:** Tất cả các hành vi chỉnh sửa/xóa tài nguyên trong `FoodService`, `CategoryService` đều kiểm tra quyền sở hữu rất nghiêm ngặt (chỉ Admin hoặc chính chủ nhà hàng sở hữu tài nguyên mới được tác động).
  * **Tìm kiếm RAG tối ưu (Hybrid Search):** Câu query raw SQL sử dụng PGVector trong `vector.repository.ts` là một điểm sáng lớn khi kết hợp độ tương đồng ngữ nghĩa vector, khoảng cách địa lý và các thuộc tính đề xuất nổi bật trong một truy vấn duy nhất có hiệu năng cực cao.
* **Điểm yếu lớn nhất (Biggest Weakness):**
  * **Vi phạm ranh giới Module:** Việc tiêm Repository này nhưng lại chọc xuyên qua thuộc tính private để lấy client DB của Module khác là một vết gợn kiến trúc lớn, khiến hệ thống mất đi tính module độc lập đúng nghĩa của NestJS.
  * **Rủi ro TypeScript Compile:** Tắt kiểm tra lỗi TypeScript khi build Next.js là một điểm yếu làm giảm độ tin cậy của mã nguồn Frontend.
* **Nợ kỹ thuật nguy hiểm nhất (Most Dangerous Technical Debt):**
  * Lỗi đường dẫn ảnh tĩnh fallback `/placeholder-food.svg` bị thiếu thực tế trong mã nguồn làm ảnh hưởng trực tiếp tới trải nghiệm người dùng cuối khi xem các món ăn bị lỗi đường dẫn ảnh.
  * Việc thiếu hoàn toàn các ca Unit Tests bao phủ cho tầng logic Service mặc dù cấu hình Jest đã sẵn sàng.

---

## 6. ĐỀ XUẤT HÀNH ĐỘNG NÂNG CẤP (ACTION ITEMS)

Dưới đây là 5 hành động cụ thể cần được ưu tiên triển khai ngay để đưa chất lượng codebase lên tối đa:

1. **Sửa Lỗi Fallback Giao Diện:** Tiến hành sửa đổi toàn bộ các đường dẫn `/placeholder-food.svg` thành `/placeholder-food.png` trong `helpers.ts` và cập nhật lại file unit test `helpers.test.ts`.
2. **Chuẩn Hóa Ranh Giới Category Module:** Định nghĩa phương thức `findRestaurantByOwnerId(ownerId)` chính thống trong `RestaurantRepository`, tiêm Repository này vào `CategoryService` và `CategoryGroupService`, chấm dứt hoàn toàn việc gọi `this.categoryGroupRepo['prisma']`.
3. **Bật Lại TypeScript Compiler:** Loại bỏ thuộc tính `ignoreBuildErrors: true` trong `next.config.ts` để bắt buộc biên dịch sạch lỗi kiểu dữ liệu trước khi phát hành phiên bản production.
4. **Tường Minh Hóa Tên Biến Controller:** Thay đổi `@GetUser('id') restaurantId: number` thành `@GetUser('id') userId: number` trong controller của danh mục món ăn để tránh gây hiểu nhầm.
5. **Xây Dựng DTO Cho API Password & Status:** Thiết lập `ChangePasswordDto` và `UpdateUserStatusDto` để bảo vệ các API này khỏi các lỗ hổng Mass Assignment hoặc truyền tải tham số không hợp lệ.
