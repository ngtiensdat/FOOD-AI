# User Stories - Sprint 6

**Mục tiêu Sprint:** Tăng cường sự gắn kết của người dùng thông qua hệ thống tích điểm, thăng cấp (Gamification), danh hiệu, đổi voucher giảm giá và quản lý danh sách món ăn yêu thích.

---

## 1. Gamification & Badges (Cấp độ & Danh hiệu)

### US-21: Hệ thống Cấp độ và Danh hiệu Khách hàng
- **As a** khách hàng tích cực tương tác
- **I want** tích lũy điểm kinh nghiệm (XP) từ các hoạt động và nhận các danh hiệu tương ứng
- **So that** tôi cảm thấy được ghi nhận đóng góp và tăng uy tín cá nhân trên mạng xã hội.

**Acceptance Criteria (AC):**
- [ ] Tích lũy XP khi đăng bài review (+50 XP), comment (+10 XP), like (+5 XP).
- [ ] Thăng cấp (Level up) khi đạt đủ mốc XP quy định.
- [ ] Tự động trao danh hiệu dựa trên mốc hoạt động (ví dụ: "Thánh ăn" khi review > 10 món, "Chiến thần review" khi có > 500 lượt thích bài viết).
- [ ] Hiển thị Cấp độ và Danh hiệu nổi bật trên trang cá nhân của người dùng.

### US-22: Danh hiệu dành cho Thương gia (Merchant Badges)
- **As a** đối tác nhà hàng (Merchant)
- **I want** nhận các danh hiệu uy tín từ hệ thống dựa trên đánh giá của khách hàng
- **So that** thu hút thêm nhiều thực khách tin tưởng đặt món.

**Acceptance Criteria (AC):**
- [ ] Trao danh hiệu "Quán ăn 5 sao" khi đạt điểm đánh giá trung bình > 4.8 (tối thiểu 20 lượt đánh giá).
- [ ] Trao danh hiệu "Điểm đến yêu thích" khi đạt mốc > 100 lượt Follow.
- [ ] Hiển thị danh hiệu nổi bật trên Merchant Profile và trên từng Card món ăn của quán.

---

## 2. Loyalty Program & Favorites (Đổi thưởng & Yêu thích)

### US-23: Chương trình đổi Voucher lấy quà
- **As a** người dùng có tích lũy cấp độ/danh hiệu
- **I want** sử dụng cấp độ hoặc điểm cống hiến để đổi lấy các Voucher giảm giá thực tế từ nhà hàng
- **So that** tôi nhận được lợi ích kinh tế thực tế khi hoạt động tích cực trên app.

**Acceptance Criteria (AC):**
- [ ] Trang "Voucher Market" hiển thị danh sách voucher có sẵn kèm điều kiện đổi (Ví dụ: Level >= 5, hoặc đổi bằng điểm).
- [ ] Trừ điểm cống hiến/kiểm tra cấp độ khi người dùng nhấn "Đổi Voucher".
- [ ] Lưu mã Voucher đã đổi vào ví cá nhân và có thể sử dụng khi đặt món.

### US-24: Lưu món ăn yêu thích (Food Favorites)
- **As a** người dùng
- **I want** lưu các món ăn mình thích vào danh mục riêng
- **So that** tôi có thể tìm lại và xem nhanh bất cứ lúc nào.

**Acceptance Criteria (AC):**
- [ ] Nút Thả tim (Like) trên Food Card lưu món ăn đó vào danh sách "Yêu thích" cá nhân.
- [ ] Trang "Món ăn đã lưu" (Favorites) hiển thị đầy đủ danh sách các món ăn đã thả tim.
