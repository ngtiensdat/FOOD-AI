# Báo cáo Audit Chi Tiết: AdminTable.tsx

- **Dự án:** FOOD AI (Frontend Component)
- **Tệp rà soát:** [AdminTable.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/AdminTable.tsx)
- **Ngày thực hiện:** 26/05/2026
- **Người thực hiện:** Antigravity (AI Auditor)

---

## 1. Điểm số đánh giá chất lượng (Codebase Scoring)

Dựa trên bộ quy chuẩn của dự án trong `.agent/rule/` và `.check-prompt/`, chất lượng tổ chức code của tệp [AdminTable.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/AdminTable.tsx) được chấm điểm như sau:

| Tiêu chí | Điểm số (1-10) | Nhận xét ngắn |
| :--- | :---: | :--- |
| **Clean Code** | **6/10** | Các đoạn JSX còn lồng nhau quá sâu, nhiều logic render phức tạp đan xen. |
| **Scalability (Khả năng mở rộng)** | **5/10** | Khó mở rộng thêm loại dữ liệu mới vì component đang "ôm đồm" hiển thị cả User và Food. |
| **Readability (Độ dễ đọc)** | **6/10** | Dài 591 dòng, người đọc dễ bị ngợp bởi các tầng logic gom nhóm và phân trang. |
| **Security (Bảo mật)** | **10/10** | Không có lỗ hổng bảo mật trực tiếp (các API/hành động đã được ủy quyền qua props/hooks). |
| **Maintainability (Khả năng bảo trì)** | **5/10** | Nếu có thay đổi UI ở bảng User, toàn bộ tệp chứa logic bảng Food cũng phải bị chỉnh sửa. |
| **Architecture (Kiến trúc)** | **6/10** | Chưa tuân thủ hoàn toàn Separation of Concerns (vẫn giữ logic gom nhóm, tính toán trực tiếp trong View). |
| **Performance (Hiệu năng)** | **5/10** | Chạy IIFE tính toán gom nhóm ở mỗi lần render; thiếu memoization (`useMemo`, `useCallback`). |
| **Production Readiness** | **7/10** | Giao diện đã đầy đủ chức năng nhưng cấu trúc bên dưới còn nợ kỹ thuật (Technical Debt). |

**Điểm trung bình:** **6.25 / 10** (Khá - Cần Refactor cấu trúc).

---

## 2. Danh sách các lỗi phát hiện & Đề xuất sửa đổi

### Lỗi 1: Vi phạm Nguyên tắc Đơn trách nhiệm (Single Responsibility Principle - SOLID)
*   **Mức độ:** **Nghiêm trọng (High)**
*   **Vị trí:** Toàn bộ file [AdminTable.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/AdminTable.tsx).
*   **Nguyên nhân:** Component này đóng vai trò hiển thị quá nhiều loại thực thể khác nhau:
    - Bảng thông tin User (Khách hàng/Đối tác cần duyệt).
    - Bảng thông tin Món ăn hệ thống (danh sách phẳng).
    - Bảng thông tin Món ăn đối tác (gom nhóm theo quán, phân trang riêng biệt, quản lý trạng thái cập nhật nháp).
*   **Giải pháp:** Tách [AdminTable.tsx](file:///e:/FOOD_AI_code/my-web/frontend/src/components/features/AdminTable.tsx) thành các component nhỏ hơn:
    1. `AdminUserTable.tsx`: Bảng quản lý người dùng.
    2. `AdminSystemFoodTable.tsx`: Bảng quản lý món ăn hệ thống.
    3. `AdminMerchantFoodTable.tsx`: Bảng quản lý thực đơn đối tác kèm logic gom nhóm và phân trang đặc thù.

### Lỗi 2: Logic tính toán gom nhóm phức tạp chạy trực tiếp khi render (IIFE)
*   **Mức độ:** **Trung bình (Medium)**
*   **Vị trí:** Dòng 163 - 181 và dòng 415 - 425.
*   **Nguyên nhân:** Khối lệnh gom nhóm món ăn theo `restaurantId` viết dưới dạng IIFE chạy lại hoàn toàn ở mỗi lượt render của component. Khi số lượng món ăn lớn, việc này sẽ gây sụt giảm hiệu năng (CPU overhead).
*   **Giải pháp:** Tách logic này ra ngoài và bọc trong hook `useMemo` để chỉ tính toán lại khi `filteredData` thay đổi:
    ```typescript
    const groupedMerchantFoods = useMemo(() => {
      if (!isMerchantMenu) return [];
      const grouped = ...; // Logic gom nhóm
      return grouped;
    }, [filteredData, isMerchantMenu]);
    ```

### Lỗi 3: Chứa các chuỗi Hardcoded văn bản giao diện (UI Text) & Magic Number
*   **Mức độ:** **Trung bình (Medium)**
*   **Vị trí:** 
    - Dòng 190: `const pageSize = 5;` (Magic Number).
    - Dòng 235: Chuỗi `'Nháp'` viết cứng bằng tiếng Việt.
    - Dòng 383: Chuỗi `'Hiển thị ... món ăn'` viết cứng bằng tiếng Việt.
*   **Nguyên nhân:** Không tuân thủ tuyệt đối quy tắc "Zero Hardcoding" trong `.agent/rule/frontend-architecture-rule.md`.
*   **Giải pháp:**
    - Thay thế `'Nháp'` bằng `LABELS.ADMIN.TABLE.DRAFT`.
    - Thay thế `'Hiển thị ...'` bằng `LABELS.ADMIN.TABLE.SHOWING_FOODS(foods.length)`.
    - Đưa `pageSize` thành hằng số cấu hình.

### Lỗi 4: Thiếu Tối ưu hóa Re-render (Performance Optimization)
*   **Mức độ:** **Thấp (Low)**
*   **Vị trí:** Dòng 61, 67, 98, 123.
*   **Nguyên nhân:** Các hàm hỗ trợ như `toggleMerchant`, `handleToggleDraft`, `handleSaveBatch`, `handleCancelBatch` định nghĩa inline mà không được bọc bởi `useCallback`. Việc này khiến chúng bị tạo mới liên tục, kéo theo việc re-render các component con nhận các hàm này làm props.
*   **Giải pháp:** Bọc toàn bộ các hàm xử lý state trên bằng `useCallback`.

---

## 3. Kế hoạch Hành động (Action Items) để Refactor

Để đưa chất lượng tệp tin này lên thang điểm **9-10/10**, cần triển khai refactor theo thứ tự sau:

- [x] **Bước 1: Làm sạch các chuỗi Hardcode còn sót lại**
  Thay thế các chuỗi `'Nháp'`, `'Hiển thị ...'` và các giá trị trạng thái tĩnh `'APPROVED'`, `'PENDING'` sang sử dụng hằng số `LABELS` và Enum `UserStatus` đã import. *(Đã hoàn thành)*
- [x] **Bước 2: Tối ưu hiệu năng bằng useMemo & useCallback**
  Chuyển đổi logic gom nhóm dữ liệu (IIFE) sang `useMemo` và bọc các hàm thay đổi state của bảng bằng `useCallback`. *(Đã hoàn thành)*
- [x] **Bước 3: Chia tách Component lớn (Modularization)**
  Tách cấu trúc bảng thành các thư mục con hoặc các component nhỏ riêng biệt để tăng tính tái sử dụng và dễ viết Unit Test cho từng phần. *(Đã hoàn thành)*

### 4. Technical Debt (Pending Refactor)
- **`useRestaurantActions.ts`**: Cần loại bỏ 6 kiểu `any` và dọn dẹp biến rác.
- **`useRestaurantProfile.ts`**: Cần loại bỏ 9 kiểu `any`.
- Các file service (`auth`, `category`, `food`, `api-client`): Cần loại bỏ `any`.
