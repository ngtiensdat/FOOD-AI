# Specification: Merchant Restaurant Open/Close Status & Operating Hours (Sprint 2)

Tài liệu này đặc tả chi tiết thiết kế kỹ thuật cho tính năng **Quản lý trạng thái hoạt động (Đóng/Mở cửa)** và **Giờ mở cửa** của Merchant, phục vụ cho việc phê duyệt trước khi lập trình.

---

## 1. Quy trình Nghiệp vụ (Business Logic)

Hệ thống phân biệt rõ ràng giữa hai trạng thái đóng cửa để tối ưu hóa trải nghiệm người dùng:

### 1.1. Merchant chủ động đóng cửa (Nút gạt `isActive = false` trên Dashboard)
* **Ý nghĩa**: Merchant muốn tạm nghỉ phục vụ đột xuất (ví dụ: bận việc gia đình, hết nguyên liệu, sửa sang quán) và chỉ mở khi merchant chủ động bật lại.
* **Hành vi hệ thống**:
  * **Ẩn món ăn**: Toàn bộ món ăn của nhà hàng này sẽ được **ẩn** khỏi trang Khám phá (Explore) và danh sách gợi ý AI (AI Suggestion) để tránh hiển thị thông tin không hoạt động.
  * **Giao diện trang nhà hàng**: Vẫn hiển thị trang thông tin của nhà hàng, nhưng đính kèm nhãn thông báo nổi bật: **"⚠️ Cửa hàng tạm đóng cửa đột xuất"**.

### 1.2. Đóng cửa theo giờ mở cửa định kỳ (Ngoài khung giờ `openingHours`)
* **Ý nghĩa**: Quán đã hết giờ hoạt động bình thường trong ngày (ví dụ: lúc 23:00 đêm, trong khi quán hoạt động từ "08:00 - 22:00").
* **Hành vi hệ thống**:
  * **Trang Khám phá (Explore) & Tìm kiếm (Search)**: **Vẫn hiển thị bình thường**. Món ăn và nhà hàng vẫn tìm kiếm được để tránh cảm giác hệ thống bị trống dữ liệu, giúp người dùng xem giá cả/mô tả hoặc thả tim/lưu lại. Trên Food Card sẽ hiển thị nhãn cảnh báo: **"⏰ Ngoài giờ phục vụ (Mở cửa: {openingHours})"**.
  * **Mục Nổi bật (Featured Today / Featured Weekly)**: **Vẫn hiển thị bình thường** trên trang chủ của khách hàng (để giữ giao diện trang chủ đầy đủ thông tin vào ban đêm) nhưng các thẻ món ăn sẽ được đính kèm nhãn cảnh báo ngoài giờ phục vụ.
  * **Hệ thống gợi ý AI (AI Suggestion)**: AI Engine trên Backend sẽ tự động phân tích thời gian hiện tại của người dùng và giờ hoạt động của quán để **lọc ẩn/không đề xuất** các món ăn ngoài giờ phục vụ (vì gợi ý AI mang tính chất đề xuất ăn uống tức thời).

*(Lưu ý: Vì hệ thống hiện tại chưa tích hợp tính năng đặt hàng/thanh toán, chúng ta không cần khóa hay vô hiệu hóa bất kỳ nút mua hàng nào, chỉ hiển thị thông tin cảnh báo trạng thái để người dùng nhận biết).*

---

## 2. Thiết kế Cơ sở dữ liệu (Prisma Schema)

Sử dụng và đồng bộ hóa các trường dữ liệu có sẵn:
* `Restaurant.isActive` (Boolean): Trạng thái đóng/mở cửa chủ động của Merchant (mặc định: `true`).
* `RestaurantProfile.openingHours` (String): Giờ đóng/mở cửa định kỳ hàng ngày (ví dụ: `"08:00 - 22:00"`).

---

## 3. Thiết kế API Backend (NestJS)

Các API này sẽ được định cấu trúc trong `FoodModule`.

### 3.1. API Lấy thông tin nhà hàng của tôi (Merchant)
* **Endpoint**: `GET /restaurants/my-restaurant`
* **Xác thực**: `JwtAuthGuard` + `RolesGuard(RESTAURANT)`.
* **Phản hồi thành công**: `200 OK`
  ```json
  {
    "data": {
      "id": 1,
      "name": "Nhà hàng Pizza Express",
      "address": "123 Đường ABC, Hà Nội",
      "isActive": true,
      "profile": {
        "openingHours": "08:00 - 22:00",
        "contactPhone": "0987654321"
      }
    }
  }
  ```

### 3.2. API Cập nhật trạng thái đóng/mở cửa của nhà hàng (Merchant)
* **Endpoint**: `PATCH /restaurants/my-restaurant/status`
* **Xác thực**: `JwtAuthGuard` + `RolesGuard(RESTAURANT)`.
* **Body (DTO)**:
  ```json
  {
    "isActive": false
  }
  ```

### 3.3. API Cập nhật profile & giờ mở cửa của nhà hàng (Merchant)
* **Endpoint**: `PATCH /restaurants/my-restaurant/profile`
* **Xác thực**: `JwtAuthGuard` + `RolesGuard(RESTAURANT)`.
* **Body (DTO)**:
  ```json
  {
    "openingHours": "07:00 - 21:00",
    "contactPhone": "0987654321"
  }
  ```

### 3.4. API lấy chi tiết món ăn (Khách hàng)
* **Endpoint**: `GET /foods/:id`
* **Thay đổi**: Kết quả trả về đính kèm thêm `isActive` của nhà hàng và `profile.openingHours`.
* **Cấu trúc dữ liệu trả về**:
  ```json
  {
    "data": {
      "id": 10,
      "name": "Pizza Hải Sản",
      "price": 150000,
      "restaurant": {
        "id": 1,
        "name": "Nhà hàng Pizza Express",
        "isActive": true,
        "profile": {
          "openingHours": "08:00 - 22:00"
        }
      }
    }
  }
  ```

---

## 4. Thiết kế Frontend (Next.js)

### 4.1. Giao diện Merchant Dashboard
* Thêm nút gạt trạng thái **Đóng/Mở cửa** (Toggle Switch) ở vị trí dễ nhìn thấy tại Header của Dashboard.
* Thêm một mục nhập liệu **Giờ hoạt động** trong trang quản lý thông tin cửa hàng, lưu thay đổi qua API `PATCH /restaurants/my-restaurant/profile`.

### 4.2. Giao diện Food Card & Modal Chi tiết món ăn (Khách hàng)
* Hiển thị dòng thông tin giờ mở cửa của quán: **"Giờ mở cửa: {openingHours}"**.
* Nếu nhà hàng đang đóng cửa đột xuất (`isActive = false`), hiển thị Banner màu cam/đỏ: **"⚠️ Nhà hàng hiện tại đang đóng cửa tạm thời."**
* Nếu thời gian hiện tại nằm ngoài khung giờ `openingHours`, hiển thị dòng cảnh báo: **"⏰ Ngoài giờ phục vụ (Mở cửa từ {openingHours})"**.

---

## 5. Quy chuẩn Thiết kế Giao diện (Aesthetic & Light/Dark Mode)

Tất cả các thành phần UI được phát triển phải tuân thủ nghiêm ngặt hệ thống thiết kế hiện tại và hỗ trợ giao diện Sáng/Tối (Light/Dark mode) qua các biến CSS hoặc tiền tố `dark:` của Tailwind CSS:

* **Nút gạt Đóng/Mở cửa (Toggle Switch)**:
  * *Light mode*: Nền xám nhạt (`bg-gray-200`) khi đóng, chuyển sang màu cam thương hiệu (`bg-primary`) khi mở.
  * *Dark mode*: Nền xám sẫm (`dark:bg-slate-800`) khi đóng, chuyển sang màu cam tối dịu (`dark:bg-orange-600`) khi mở.
* **Banner Đóng cửa đột xuất**:
  * *Light mode*: Nền cam nhạt, viền cam (`bg-orange-50/80 border-orange-200 text-orange-800`).
  * *Dark mode*: Nền cam tối mờ, viền cam đậm (`dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-300`).
* **Nhãn Ngoài giờ phục vụ**:
  * *Light mode*: Chữ xám đậm, biểu tượng đồng hồ màu cam (`text-gray-500`).
  * *Dark mode*: Chữ xám xanh nhẹ, biểu tượng đồng hồ màu cam tối (`dark:text-slate-400`).
* **Form nhập Giờ hoạt động**:
  * Đảm bảo giao diện input có độ phản chiếu kính (Glassmorphism) hòa hợp khi bật dark mode, không bị lóa hoặc khó đọc chữ.



