# Quy chuẩn Sử dụng & Prompt Sinh ảnh Chibi Linh Vật (Mascot) - FOOD AI

Tài liệu này định nghĩa vị trí hiển thị tối ưu cho 8 trạng thái chibi linh vật hiện có trong dự án **FOOD AI** và cung cấp các prompt AI (Midjourney/DALL-E) tương ứng để sinh thêm các trạng thái mới đồng bộ về mặt mỹ thuật.

---

## I. HƯỚNG DẪN HIỂN THỊ TRÊN GIAO DIỆN (UI/UX PLACEMENT)

Dưới đây là các vị trí áp dụng chính xác cho từng tệp ảnh trong thư mục `public/chibi linh vật/`:

### 1. `xin chào.png` (Welcome Mascot)
* **Vị trí hiển thị:**
  * Đầu trang của Bảng điều khiển Khách hàng (`/dashboard`) ngay sau khi đăng nhập.
  * Màn hình Đăng nhập (`/login`) hoặc Đăng ký (`/register`) ở phần banner chào mừng.
* **Mục đích:** Tạo cảm giác thân thiện, hiếu khách ngay khi người dùng tiếp cận hệ thống.

### 2. `chúc mừng.png` (Celebration Mascot)
* **Vị trí hiển thị:**
  * Màn hình thông báo đăng ký thành công (trên trang `/register` sau khi submit form).
  * Popup thông báo thăng cấp độ người dùng (`LEVEL_UP` trong thông báo).
  * Thông báo đổi mật khẩu thành công hoặc phê duyệt món ăn thành công dành cho chủ nhà hàng.
* **Mục đích:** Tăng trải nghiệm phần thưởng (gamification) và xác nhận hành động thành công.

### 3. `trải nghiệm.png` (Explore / Onboarding Mascot)
* **Vị trí hiển thị:**
  * Modal Khảo sát Sở thích (`OnboardingModal`) khi người dùng mới đăng nhập lần đầu.
  * Các khu vực mời gọi sử dụng tính năng mới (như nút "Trải nghiệm Trợ lý AI").
* **Mục đích:** Khuyến khích người dùng tương tác và khám phá tính năng.

### 4. `thả tim.png` (Favorite Mascot)
* **Vị trí hiển thị:**
  * Tab Món ăn yêu thích (`favorites` tab) trong Dashboard của khách hàng.
  * Trang Hồ sơ công khai của nhà hàng (`/restaurant/[id]`) khi người dùng nhấn "Theo dõi" (Follow).
* **Mục đích:** Thể hiện sự đồng lòng, yêu thích và trân trọng hành động lưu trữ của người dùng.

### 5. `lưu ý.png` (Warning / Tip Mascot)
* **Vị trí hiển thị:**
  * Banner thông báo quán đang tạm đóng cửa ngoài giờ hoạt động (`CLOSED_OUTSIDE_HOURS`).
  * Các tooltip hướng dẫn quan trọng (như tooltip thay đổi trạng thái đóng/mở cửa của nhà hàng).
  * Bên cạnh các cảnh báo lỗi form nhập liệu quan trọng.
* **Mục đích:** Thu hút sự chú ý của người dùng vào các quy định hoặc lưu ý quan trọng mà không gây cảm giác tiêu cực.

### 6. `thắc mắc.png` (Empty State / Confused Mascot)
* **Vị trí hiển thị:**
  * Trạng thái danh sách rỗng (Empty State) như "Chưa có dữ liệu phân tích" (`EMPTY_TITLE`) hoặc "Chưa có món ăn nào" (`NO_FOOD`).
  * Trang thông báo lỗi 404 (Không tìm thấy trang).
  * Trang Báo cáo lỗi kỹ thuật (`BUG_REPORT`) khi người dùng gặp sự cố.
* **Mục đích:** Giảm bớt sự khó chịu của người dùng khi gặp lỗi hoặc màn hình trống bằng hình ảnh ngộ nghĩnh.

### 7. `hỗ trợ viên.png` (AI Assistant Mascot)
* **Vị trí hiển thị:**
  * Avatar mặc định của Trợ lý ảo trong khung chat AI (`AiChatWindow` hoặc `AiResponseBox`).
  * Trang Liên hệ (`/contact`) bên cạnh thông tin hỗ trợ khách hàng của Nguyễn Tiến Đạt.
* **Mục đích:** Định danh trợ lý thông minh của hệ thống luôn sẵn sàng lắng nghe và trả lời.

### 8. `nháy mắt.png` (Playful / Recommendation Mascot)
* **Vị trí hiển thị:**
  * Phía trên phần gợi ý "Món ngon nổi bật hôm nay" (`featuredToday`) trên trang chủ.
  * Hiệu ứng hover hoặc bóng bay giới thiệu khuyến mại đặc biệt.
* **Mục đích:** Tạo điểm nhấn vui vẻ, gợi ý những nội dung chất lượng cao một cách tự nhiên.

---

## II. PROMPT AI ĐỂ SINH THÊM ẢNH ĐỒNG BỘ (MIDJOURNEY / DALL-E)

Để tạo thêm các hình ảnh mới có cùng phong cách chibi dễ thương, tông màu cam và chủ đề ẩm thực, hãy sử dụng cấu trúc prompt mẫu dưới đây:

### 1. Base Prompt (Định hình phong cách chung)
> **Prompt:** `A cute chibi mascot character for a food AI mobile app, a friendly orange round creature with big expressive eyes and small white hands, clean vector, solid bright orange color palette, modern 3d render style, flat design elements, isolated on pure white background, high resolution, soft lighting --ar 1:1`

### 2. Prompt chi tiết cho từng trạng thái:

* **Trạng thái Chào mừng (xin chào):**
  > Base Prompt + `...holding a tiny spoon and waving friendly with a happy smile`
* **Trạng thái Thành công (chúc mừng):**
  > Base Prompt + `...throwing hands up in victory, gold star confetti flying around, extremely happy expression`
* **Trạng thái Tìm kiếm / Trải nghiệm:**
  > Base Prompt + `...looking through a small orange magnifying glass, curious expression`
* **Trạng thái Cảnh báo / Lưu ý:**
  > Base Prompt + `...holding a small orange warning sign exclamation mark, looking informative and gentle`
* **Trạng thái Suy nghĩ / Thắc mắc:**
  > Base Prompt + `...scratching its head with a question mark bubble above, confused but cute facial expression`
