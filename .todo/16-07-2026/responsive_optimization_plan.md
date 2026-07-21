# Kế hoạch Tối ưu hóa Giao diện Đáp ứng Đa thiết bị (Responsive Design Plan)

Tài liệu này vạch ra chiến lược nâng cấp và tinh chỉnh giao diện người dùng (UI/UX) của dự án **FOOD AI**, đảm bảo hiển thị hoàn hảo và hoạt động mượt mà trên mọi thiết bị: máy tính để bàn (Desktop), laptop, máy tính bảng (iPad/Tablet dọc và ngang), và điện thoại di động (Smartphones).

---

## 1. Hệ thống Breakpoints Tiêu chuẩn

Hệ thống sẽ sử dụng các mốc kích thước màn hình (Breakpoints) tiêu chuẩn của Tailwind CSS kết hợp với CSS Media Queries để điều phối bố cục:

| Thiết bị | Breakpoint | Chiều rộng màn hình | Hành vi thiết kế (UI Behavior) |
| :--- | :--- | :--- | :--- |
| **Mobile (Dọc)** | Mặc định | `< 640px` | Layout 1 cột dọc, thanh điều hướng dạng Bottom Bar hoặc Hamburger menu. Chữ nhỏ gọn, khoảng cách padding bé. |
| **Mobile (Ngang) / Phablet** | `sm:` | `>= 640px` | Layout bắt đầu mở rộng, hỗ trợ lưới 2 cột nhỏ cho các danh sách thẻ đơn giản. |
| **Tablet (Dọc) / iPad** | `md:` | `>= 768px` | Layout chuyển giao. Tối ưu hóa cho cử chỉ vuốt chạm (Touch target >= 44px). Thanh điều hướng ẩn vào hamburger. |
| **Tablet (Ngang) / Laptop nhỏ** | `lg:` | `>= 1024px` | Bố cục 2 hoặc 3 cột vừa phải. Menu điều hướng chính hiển thị đầy đủ ở bên trái hoặc trên đầu. |
| **Laptop tiêu chuẩn / Desktop** | `xl:` | `>= 1280px` | Bố cục 3 cột hoàn chỉnh. Tận dụng tối đa không gian màn hình rộng để hiển thị các chi tiết trang trí/linh vật. |
| **Màn hình lớn (UltraWide)** | `2xl:` | `>= 1536px` | Đóng khung giới hạn chiều rộng nội dung tối đa (`max-w-7xl` hoặc `max-w-[1440px]`) để giao diện không bị giãn quá mức làm mỏi mắt người dùng. |

---

## 2. Kế hoạch Tối ưu hóa các Trang Trọng điểm

### A. Trang Chủ & Trang Khám Phá (Explore)
* **Trực quan:** Lưới danh sách món ăn/nhà hàng tự động thay đổi số lượng cột:
  * Mobile: 1 cột (dễ cuộn dọc bằng 1 tay).
  * Tablet: 2 đến 3 cột.
  * Desktop/Laptop: 4 đến 5 cột.
* **Banner Quảng cáo:** Sử dụng thuộc tính `object-cover` kết hợp định dạng SVG hoặc ảnh vector chất lượng cao để banner tự co giãn mà không bị cắt mất chữ hay méo hình.

### B. Trang Ưu Đãi & Khuyến Mãi (Offers)
Chúng ta sẽ chuyển đổi bố cục linh hoạt theo thiết bị:
* **Màn hình Desktop/Laptop (`xl` trở lên):**
  * Layout 3 cột đầy đủ: Sidebar danh mục (cột trái, rộng 3/12) | Lưới 3 cột khuyến mãi (cột giữa, rộng 6/12) | Mascot gấu quảng cáo (cột phải, rộng 3/12).
* **Màn hình Laptop nhỏ / Tablet nằm ngang (`lg`):**
  * Layout 2 cột: Ẩn cột Mascot phải. Cột giữa mở rộng chiếm 8/12 và Lưới khuyến mãi rút về 2 cột để đảm bảo hình ảnh không bị quá nhỏ.
* **Màn hình Tablet dọc (`md`):**
  * Layout 1 cột chính: Sidebar bên trái thu gọn thành thanh lựa chọn Tab cuộn ngang (Horizontal scrollable tabs) ở ngay dưới tiêu đề trang.
* **Màn hình Mobile (`< 768px`):**
  * Tab cuộn ngang trên đầu trang. Lưới tin khuyến mãi chuyển thành danh sách 1 cột dọc cuộn mượt mà. 

### C. Giao diện Máy POS (PosTerminalManager)
Giao diện POS thường chạy trên máy tính bảng (iPad/Android Tablet) của nhà hàng.
* **Tối ưu cảm ứng (Touch-friendly):**
  * Tăng kích thước vùng nhấn của nút gọi món và nút thanh toán lên tối thiểu `48px` để nhân viên thao tác nhanh bằng ngón tay không bị nhầm lẫn.
  * Lưới danh mục món ăn (Menu Grid) hỗ trợ cuộn vuốt ngang nhanh bằng ngón tay (Swipe-to-scroll category list).
  * Bảng nhập số tiền / máy tính số lượng (Calculator Pad) dạng lưới nút bấm to, phản hồi rung nhẹ nếu thiết bị hỗ trợ.

---

## 3. Quy chuẩn Kỹ thuật Triển khai (Technical Best Practices)

### 1. Phông chữ thích ứng (Fluid Typography)
Tránh sử dụng kích thước font cố định (như `text-3xl = 30px`) gây tràn màn hình điện thoại nhỏ. Sử dụng thuộc tính toán hoặc các class responsive:
```css
/* Ví dụ dùng CSS Clamp để tự động điều chỉnh font-size mượt mà theo kích thước viewport */
.hero-title {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

### 2. Thiết lập kích thước vùng chạm tối thiểu (Touch Target Size)
Theo khuyến nghị của Apple và Google, tất cả các thành phần có thể tương tác (Nút bấm, Liên kết, Icon tương tác) phải có diện tích chạm tối thiểu:
* Kích thước tối thiểu: `44px x 44px` (Apple iOS) hoặc `48px x 48px` (Android).
* Bổ sung khoảng trống (margin) giữa các nút để tránh nhấn nhầm.

### 3. Tối ưu hóa tải ảnh đa thiết bị (Responsive Images)
Sử dụng cờ `sizes` trong Next.js `Image` hoặc component `<picture>` của HTML5 để trình duyệt tự động chọn tải phiên bản ảnh có dung lượng nhỏ hơn trên thiết bị di động, giúp tiết kiệm băng thông và tăng tốc độ load:
```html
<picture>
  <source media="(max-width: 768px)" srcset="/images/banner-mobile.webp">
  <source media="(min-width: 769px)" srcset="/images/banner-desktop.webp">
  <img src="/images/banner-desktop.jpg" alt="FOOD AI Banner" class="w-full object-cover">
</picture>
```

### 4. Ngăn chặn tự động phóng zoom trên Safari iOS
* Trên các thiết bị iPhone/iPad, trình duyệt Safari sẽ tự động phóng to màn hình khi người dùng bấm vào ô Input có cỡ chữ bé hơn `16px`, gây khó chịu cho trải nghiệm UI.
* **Giải pháp:** Đảm bảo tất cả các ô nhập liệu (Input, Select, Textarea) trên thiết bị di động đều có `font-size: 16px` (hoặc Tailwind `text-base`).
