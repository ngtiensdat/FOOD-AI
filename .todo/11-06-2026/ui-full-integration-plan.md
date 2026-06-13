# Kế hoạch Hoàn thiện Giao diện Hệ thống (UI Full Integration)

**Ngày tạo:** 11/06/2026
**Chi nhánh (Branch):** `feat/update-UI-full`
**Mục tiêu chính:** Tập trung 100% vào việc hoàn thiện, tối ưu hóa toàn bộ giao diện (UI/UX) và các luồng tương tác của người dùng trên Frontend Next.js dựa trên các mô hình/trường dữ liệu của cơ sở dữ liệu (Prisma), đảm bảo CSS đồng nhất, mượt mà và không bị hardcode.

---

## 📋 DANH SÁCH CÁC HẠNG MỤC GIAO DIỆN HOÀN THIỆN

### 1. Hệ thống Thăng cấp & Tích điểm (Gamification UI - Sprint 6)
- **Profile Header:** Hiển thị thông số cấp độ `level` (Lv. X), Huy hiệu danh hiệu `badgeTitle` lấp lánh và điểm tích lũy `points` kèm thanh tiến trình XP hoạt họa.
- **Chợ đổi Voucher (Voucher Mall):** 
  - Hiển thị danh sách Voucher có thể đổi bằng điểm thưởng.
  - Cho phép người dùng nhấn "Đổi ngay", tự động tính toán trừ điểm số dư cục bộ và cấp mã Voucher ngẫu nhiên.
  - Hiển thị danh sách "Voucher của tôi" đã đổi thành công.

### 2. Mạng xã hội bài viết Review & Tương tác (Sprint 5)
- **Form đăng bài viết mới (CreatePostModal):** Hỗ trợ đầy đủ các trường nhập liệu tương ứng Prisma (`title`, `content`, `image`, `rating` từ 1-5 sao, `postType` NORMAL/REVIEW/PROMOTION, liên kết nhà hàng/món ăn động).
- **Danh sách bài viết (PostCard):** 
  - Hiển thị thông tin tác giả, loại bài đăng dưới dạng badge màu sắc khác biệt.
  - Thả tim bài viết (tương tác Like) tăng/giảm số lượt thích.
  - Bình luận bài viết (Comment) hiển thị danh sách bình luận cũ và cho phép nhập bình luận mới.
  - Nút tố cáo bài viết vi phạm (Report).
- **Gamification Rewards:** Đăng bài nhận `+50` điểm, bình luận nhận `+10` điểm, thả tim nhận `+5` điểm. Thăng cấp tự động khi vượt mốc 1000 điểm.

### 3. Báo cáo vi phạm & Hàng đợi kiểm duyệt (Sprint 7)
- **Report Modal:** Hộp thoại thu thập dữ liệu báo cáo vi phạm nội dung (`targetType` POST/COMMENT, `targetId`, lý do báo cáo) lưu trữ và gửi lên hàng đợi cho Admin.
- **Admin Moderation Tab:**
  - Giao diện Admin quản trị các báo cáo chờ duyệt (`status: PENDING`).
  - Cho phép Admin duyệt báo cáo: **Gỡ bài viết** (nội dung vi phạm bị loại bỏ ngay lập tức) hoặc **Bác bỏ báo cáo** (giữ nguyên bài viết).

### 4. Thống kê Merchant Dashboard & AI Insights (Sprint 7)
- **Merchant Analytics:** 
  - Thiết kế biểu đồ cột kép trực quan sử dụng thẻ **SVG** tùy chỉnh (không dùng thư viện ngoài) hiển thị tương quan giữa Lượt xem món ăn (`History`) và Tần suất gợi ý bởi AI (`AiFeedback`).
  - Hiển thị thẻ gợi ý kinh doanh thông minh từ AI (AI Insights Card) dành cho Merchant.

### 5. Biểu mẫu Báo lỗi kỹ thuật (Sprint 7)
- **Bug Report Form:** Biểu mẫu báo lỗi kỹ thuật tích hợp trong phần Cài đặt của người dùng. Cho phép chọn danh mục lỗi (AI, UI, Hiệu năng, Khác), nhập mô tả chi tiết (tối thiểu 10 ký tự) và đính kèm link ảnh chụp màn hình sự cố.

---

## 🛠️ NGUYÊN TẮC THIẾT KẾ & CODE QUALITY (TUÂN THỦ .agent & .check-prompt)

1. **Tránh Magic Values & Hardcode:** 
   - Tất cả text hiển thị, thông báo toast, lý do báo cáo, mô tả danh mục phải nằm tập trung trong `src/constants/labels.ts` (TIẾNG VIỆT) và `src/constants/labels.en.ts` (TIẾNG ANH).
   - Các hằng số thời gian, độ dài ký tự tối thiểu, dung lượng trang phải khai báo trong `src/constants/limits.constant.ts`.
2. **Đồng nhất CSS & Thẩm mỹ cao:**
   - Sử dụng gam màu cao cấp, hỗ trợ Dark Mode mượt mà.
   - Hiệu ứng chuyển động mượt mà (transitions/micro-animations) cho hover, click và modal opening.
3. **Mô phỏng dữ liệu và đồng bộ:**
   - Ở nhánh UI Full này, các luồng tương tác tạm thời đồng bộ qua State cục bộ kết hợp với `localStorage` để mô phỏng đầy đủ luồng nghiệp vụ trước khi tiến hành tích hợp hoàn chỉnh với API Backend.
   - Đảm bảo giao diện chạy mượt mà, không bị gián đoạn và đã được biên dịch thành công (`npm run build` không lỗi).
