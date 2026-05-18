# Engineering Tasks - Sprint 6

Tài liệu này chia nhỏ các User Stories thành các đầu việc kỹ thuật cho Sprint 6.

## 1. Gamification & Badges

### [Backend]
- [ ] Task 1.1: Thiết kế schema trong Database cho XP, Level, Badge, UserBadge, MerchantBadge.
- [ ] Task 1.2: Xây dựng service tính toán XP và tự động thăng cấp khi có tương tác (đăng bài, like, comment).
- [ ] Task 1.3: Logic quét định kỳ (Cron job) hoặc Event-driven để tự động trao danh hiệu cho Customer (Thánh ăn, Chiến thần review...) và Merchant (Quán 5 sao, Điểm đến yêu thích...).
- [ ] Task 1.4: API trả về thông tin Level/XP và danh sách danh hiệu của một User/Merchant.

### [Frontend]
- [ ] Task 1.5: UI hiển thị thanh tiến trình XP (XP Progress Bar) và danh hiệu trên Profile Header.
- [ ] Task 1.6: Hiển thị Badge danh hiệu của Merchant trên Merchant Profile và Food Card.

---

## 2. Loyalty Program & Favorites

### [Backend]
- [ ] Task 2.1: Thiết kế schema Database cho Voucher, UserVoucher (Ví voucher).
- [ ] Task 2.2: API lấy danh sách Voucher trong chợ (Voucher Market) kèm điều kiện đổi.
- [ ] Task 2.3: API xử lý giao dịch đổi voucher (Kiểm tra điều kiện, trừ điểm, cấp mã voucher cho ví của user).
- [ ] Task 2.4: API Favorites: Toggle lưu món ăn và lấy danh sách món ăn đã lưu của user.

### [Frontend]
- [ ] Task 2.5: UI trang Voucher Market (Hiển thị danh sách, nút Đổi voucher và điều kiện).
- [ ] Task 2.6: UI Ví Voucher cá nhân (My Vouchers) trong trang Profile.
- [ ] Task 2.7: UI Trang danh sách "Món ăn đã lưu" (Favorites Page).
