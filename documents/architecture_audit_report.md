# Báo cáo Đánh giá Kiến trúc Phần mềm & Chất lượng Mã nguồn (Food AI)

Báo cáo này được thực hiện bởi Senior Software Architect & Clean Code Reviewer, nhằm chỉ ra các điểm hạn chế trong kiến trúc, thiết kế cơ sở dữ liệu, lỗi logic hiệu năng và đề xuất giải pháp tối ưu hóa theo tiêu chuẩn **Clean Architecture**, **SOLID**, **DRY**, và **KISS**.

---

## 1. Danh sách các điểm lỗi & Hạn chế Kiến trúc

### Lỗi 1: Lọc dữ liệu theo Tag ở bộ nhớ RAM (In-Memory Tag Filtering)
* **Loại lỗi:** Performance Bottleneck (Nghẽn hiệu năng) / Logic Bug / Vi phạm Scalability (Khả năng mở rộng)
* **Mức độ nghiêm trọng:** **Cao (High)**
* **Mô tả vấn đề:** Trong `FoodService.getAllFoods`, API thực hiện câu lệnh truy vấn cơ sở dữ liệu để lấy tối đa 100 món ăn (`take: 100`) thông qua Prisma, sau đó lọc danh sách theo Tag bằng code JavaScript trên RAM:
  ```typescript
  foods = foods.filter((food) => { ... });
  ```
  **Nguy cơ:**
  1. **Mất mát dữ liệu (Bug logic):** Nếu hệ thống có 500 món ăn, nhưng toàn bộ món ăn chứa tag `Pizza` nằm ở bản ghi thứ 101 trở đi, Prisma chỉ trả về 100 bản ghi đầu tiên (không chứa Pizza). Bộ lọc RAM chạy xong sẽ trả về danh sách rỗng `[]`, dù thực tế trong DB có rất nhiều món Pizza.
  2. **Tốn RAM & CPU:** Việc tải 100 bản ghi đầy đủ kèm thông tin quan hệ (`include`) để lọc bỏ 90% dữ liệu ở Node.js thread chính sẽ gây nghẽn khi lượng người dùng đồng thời tăng cao.
* **Vị trí code:** [backend/src/modules/food/food.service.ts (dòng 57-67)](file:///e:/FOOD_AI_code/my-web/backend/src/modules/food/food.service.ts#L57-L67)
* **Giải pháp đề xuất:** Thực hiện lọc mảng tags trực tiếp ở tầng Cơ sở dữ liệu (Database level) bằng toán tử `hasSome` hoặc `hasEvery` của Prisma.
* **Ví dụ Refactor:**
  ```typescript
  // Trong food.service.ts
  const where: Prisma.FoodWhereInput = {
    isActive: true,
    status: FoodStatus.APPROVED,
    ...(tag && {
      tags: {
        hasSome: tag.split(',').map(t => t.trim().toLowerCase())
      }
    })
  };
  ```

---

### Lỗi 2: Không đồng bộ tên trường Tọa độ (Inconsistent Coordinate Naming)
* **Loại lỗi:** Poor Naming (Đặt tên kém) / Database Schema Smell
* **Mức độ nghiêm trọng:** **Trung bình (Medium)**
* **Mô tả vấn đề:** Trong cơ sở dữ liệu:
  - Bảng `Restaurant` sử dụng trường `latitude` và `longitude`.
  - Bảng `Food` sử dụng trường `lat` và `lng`.
  **Nguy cơ:** Gây nhầm lẫn lớn khi chuyển đổi dữ liệu qua lại giữa cửa hàng và món ăn, dễ dẫn đến lỗi ánh xạ (mapping logic), tăng thời gian bảo trì và giảm khả năng tái sử dụng các hàm tiện ích về bản đồ/GPS.
* **Vị trí code:** [backend/prisma/schema.prisma](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma)
  - `Restaurant` (Dòng 127-128)
  - `Food` (Dòng 182-183)
* **Giải pháp đề xuất:** Đồng bộ hóa tên trường tọa độ trên toàn hệ thống thành `latitude` và `longitude` (hoặc `lat` và `lng`).

---

### Lỗi 3: Tìm kiếm món ăn ở phía Client (Client-Side Search in Explore)
* **Loại lỗi:** Bad Separation of Concerns (Sai phân tách trách nhiệm) / Network Bottleneck
* **Mức độ nghiêm trọng:** **Trung bình (Medium)**
* **Mô tả vấn đề:** Trong explore hook, frontend tải toàn bộ món ăn theo khu vực về, sau đó thực hiện lọc chuỗi tìm kiếm của người dùng trực tiếp trên client:
  ```typescript
  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) || ...
  );
  ```
  **Nguy cơ:** Không thể tìm kiếm được các món ăn ở các trang tiếp theo hoặc chưa được load về máy client. Gây lãng phí băng thông mạng khi tải lượng dữ liệu lớn không cần thiết.
* **Vị trí code:** [frontend/src/hooks/useExploreActions.ts (dòng 51-54)](file:///e:/FOOD_AI_code/my-web/frontend/src/hooks/useExploreActions.ts#L51-L54)
* **Giải pháp đề xuất:** Kết nối input tìm kiếm với API backend thông qua kỹ thuật Debounce (chờ người dùng gõ xong 300ms rồi mới gửi request) để gọi endpoint `/foods/search`.
* **Ví dụ Refactor:**
  ```typescript
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFoods(originalFoods);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const results = await foodService.searchFoods(searchQuery);
      setFoods(results);
      setLoading(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  ```

---

### Lỗi 4: Hệ thống Follow chia đôi bảng rời rạc (Redundant Follow Models)
* **Loại lỗi:** Redundant Database Design (Trùng lặp thiết kế) / Coupling
* **Mức độ nghiêm trọng:** **Trung bình (Medium)**
* **Mô tả vấn đề:** Hệ thống tạo riêng bảng `Follow` (User theo dõi Restaurant) và bảng `UserFollow` (User theo dõi User). Hai bảng này có cấu trúc tương đương nhưng vận hành hoàn toàn độc lập, khiến controller/service của backend phải viết lặp lại code kiểm tra, đếm số lượng, và bảo mật.
* **Vị trí code:** [backend/prisma/schema.prisma (dòng 276-304)](file:///e:/FOOD_AI_code/my-web/backend/prisma/schema.prisma#L276-L304)
* **Giải pháp đề xuất:** Sử dụng thiết kế quan hệ đa hình (Polymorphic Relation) bằng cách gộp thành 1 bảng `Follow` duy nhất chứa trường `targetType` ('USER' | 'RESTAURANT') và `targetId`, giúp tái sử dụng hoàn toàn logic API và giao diện modal phía client.

---

### Lỗi 5: Thiếu DTO Validation bảo vệ API
* **Loại lỗi:** Security Issue / Missing Validation
* **Mức độ nghiêm trọng:** **Cao (High)**
* **Mô tả vấn đề:** Một số controller nhận trực tiếp `Query` hoặc `Body` mà không qua các decorator kiểm tra dữ liệu nghiêm ngặt của `class-validator` (như `@IsNumber`, `@IsString`).
  **Nguy cơ:** Kẻ xấu có thể truyền các giá trị không hợp lệ (ví dụ: gửi tọa độ dạng chuỗi dài độc hại, hoặc gửi số âm, gửi chuỗi rỗng) phá vỡ ứng dụng hoặc khai thác lỗi bảo mật hệ thống.
* **Vị trí code:** [backend/src/modules/food/food.controller.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/food/food.controller.ts)
* **Giải pháp đề xuất:** Bật `ValidationPipe` toàn cục trong NestJS và áp dụng các decorator kiểm định kiểu dữ liệu nghiêm ngặt cho toàn bộ DTO.

---

## 2. Đánh giá chất lượng hệ thống (System Evaluation)

1. **Kiến trúc phân tầng (Architecture Cleanliness): 8 / 10**
   * *Ưu điểm:* Việc tách Repository, Service, Controller trên Backend và Custom Hooks trên Frontend rất tốt, mã nguồn dễ đọc và phân tách logic hiển thị rõ ràng.
   * *Nhược điểm:* Logic truy vấn cơ sở dữ liệu còn bị ràng buộc bởi các bộ lọc in-memory ở tầng Service.
2. **Khả năng mở rộng (Scalability): 6.5 / 10**
   * *Nhược điểm:* Chưa có cơ chế phân trang (Pagination) thực tế trên database cho danh sách lớn và hệ thống tìm kiếm phụ thuộc vào client-side filter.
3. **Mức độ sẵn sàng triển khai (Production Readiness): 7 / 10**
   * *Đánh giá:* Cần tối ưu hóa các index cho tọa độ (spatial index) trong Prisma/PostgreSQL và giải quyết vấn đề in-memory filtering trước khi Golive thực tế với lượng người dùng lớn.
