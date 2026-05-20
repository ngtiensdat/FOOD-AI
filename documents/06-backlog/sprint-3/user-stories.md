# User Stories - Sprint 3

**Mục tiêu Sprint:** Tăng cường trải nghiệm khách hàng thông qua khám phá món ăn theo vị trí, xem lịch sử hoạt động và các mục đề xuất nổi bật.

---

## 1. Discovery & Location (Khám phá & Vị trí)

### US-09: Khám phá món ăn (Explore & Featured)
- **As a** người dùng
- **I want** xem các mục món ăn nổi bật (Hôm nay, Trong tuần) và lọc theo sở thích
- **So that** tôi dễ dàng tìm thấy món ăn ngon.

**Acceptance Criteria (AC):**
- [x] Hiển thị các slider: Featured Today, Featured Weekly, Recommended.
- [x] Trang Explore hiển thị Grid món ăn kèm bộ lọc Category.
- [ ] Xem chi tiết dinh dưỡng món ăn (Calo, Macro) qua Modal.

### US-10: Vị trí và Chỉ đường
- **As a** người dùng
- **I want** xem khoảng cách đến nhà hàng và mở bản đồ chỉ đường
- **So that** tôi có thể đến mua món ăn.

**Acceptance Criteria (AC):**
- [x] Hiển thị khoảng cách (km) trên thẻ món ăn.
- [x] Nút Navigation mở Google Maps với tọa độ chính xác.

---

## 2. Profiles & History (Hồ sơ & Lịch sử)

### US-11: Quản lý Hồ sơ cá nhân
- **As a** người dùng
- **I want** xem và cập nhật thông tin cá nhân (Profile)
- **So that** thông tin của tôi luôn chính xác.

**Acceptance Criteria (AC):**
- [x] Xem Profile (Avatar, Bio, Địa chỉ, Nghề nghiệp).
- [x] Form chỉnh sửa thông tin Profile.
- [x] Nút Follow/Unfollow người dùng khác.

### US-12: Lịch sử và Hoạt động gần đây
- **As a** người dùng
- **I want** xem lại các món ăn tôi đã từng xem
- **So that** tôi có thể quay lại tìm kiếm dễ dàng.

**Acceptance Criteria (AC):**
- [x] Backend tự động lưu lịch sử khi người dùng nhấn xem món.
- [x] Hiển thị danh sách hoạt động gần đây trong Dashboard.

### US-13: Xem hồ sơ nhà hàng và Menu đầy đủ (Merchant Profile Public View)
- **As a** người dùng
- **I want** xem trang hồ sơ công khai của một Nhà hàng và toàn bộ thực đơn (Menu) món ăn của họ
- **So that** tôi có thể chọn món ăn phù hợp của nhà hàng đó trước khi ghé thăm.

**Acceptance Criteria (AC):**
- [x] UI Trang hồ sơ công khai của Nhà hàng hiển thị Tên, Ảnh bìa/Avatar, Mô tả, Địa chỉ, Trạng thái đóng/mở cửa.
- [x] Grid/List hiển thị tất cả các món ăn đang bán của nhà hàng đó.
- [x] Nút xem nhanh chi tiết món ăn từ menu của quán.
- [x] Nút Follow/Unfollow nhà hàng trực tiếp trên trang hồ sơ của họ.

---

## 3. Backlog Hỗ Trợ Tùy Biến Cửa Hàng & Khám Phá Quán Ăn 

*(Chi tiết xem đề xuất thiết kế tại: [restaurant-customization-proposal.md](file:///e:/FOOD_AI_code/documents/06-backlog/sprint-3/restaurant-customization-proposal.md))*

### US-14: Tùy biến thông tin quán ăn cho Merchant
- **As a** chủ quán ăn (Merchant)
- **I want** tự chỉnh sửa ảnh bìa, tên quán, địa chỉ, bản đồ chỉ đường, bio giới thiệu, email liên hệ
- **So that** thông tin trang công khai của quán tôi luôn hiển thị chính xác nhất cho thực khách.

**Acceptance Criteria (AC):**
- [ ] Cập nhật đồng bộ các trường của Restaurant và RestaurantProfile.
- [ ] Modal chỉnh sửa giao diện đẹp mắt tại trang dashboard quản lý.

### US-15: Khám phá tìm kiếm trang cửa hàng công khai
- **As a** người dùng
- **I want** tìm kiếm trực tiếp các nhà hàng theo tên quán, địa phương hoặc danh mục món ăn
- **So that** tôi có thể truy cập trang chi tiết công khai của nhà hàng và xem menu món ăn.

**Acceptance Criteria (AC):**
- [ ] Trang Explore hiển thị danh sách các RestaurantCard công khai.
- [ ] Thanh tìm kiếm theo tên nhà hàng.
- [ ] Hỗ trợ lọc theo tag (danh mục món ăn của quán).
- [ ] Hỗ trợ lọc theo khu vực thành phố, quận/huyện.
