# ADR 0001: Sử Dụng SafeImage Fallback & Tối Ưu Ảnh ShopeeFood HD

- **Status:** Approved
- **Date:** 2026-05-25
- **Deciders:** Developer, Mentor (Kevin), AI Assistant

---

## 1. Bối cảnh (Context)
Hệ thống gặp hai vấn đề lớn liên quan đến quản lý và hiển thị hình ảnh:
1. **Bảo mật & Crash Next.js:** Để tuân thủ cấu trúc bảo mật của dự án, `next.config.ts` chỉ cho phép một danh sách nghiêm ngặt gồm 4 host tin cậy. Tuy nhiên, dữ liệu món ăn trong DB chứa ảnh từ nhiều nguồn khác nhau (ShopeeFood `susercontent.com`, `imgur.com`...). Việc render trực tiếp bằng Next.js `<Image>` với các host lạ này gây ra lỗi crash ở runtime. Hàm kiểm tra URL cũ (`getValidImageUrl`) chưa kiểm soát được hostname.
2. **Ảnh ShopeeFood bị mờ:** Ảnh cào được từ API ShopeeFood chứa các query parameter resize ở đuôi URL (ví dụ: `@resize_ss120x120!`), khiến ảnh bị thu nhỏ tối đa và hiển thị mờ căm trên giao diện.
3. **Ảnh mặc định 404:** File mặc định cũ `/placeholder-food.jpg` không tồn tại trong thư mục `public/` dẫn đến lỗi 404 vỡ khung ảnh.

---

## 2. Quyết định (Decision)
Chúng tôi quyết định triển khai các giải pháp sau để giải quyết triệt để vấn đề:

### A. Giải pháp bảo mật & Chống crash (SafeImage Component)
- Khôi phục whitelist 4 host an toàn trong `next.config.ts`.
- Tạo một component wrapper tên là **`SafeImage.tsx`** thay thế trực tiếp cho `next/image` tại các trang hiển thị:
  - Nếu `src` thuộc 4 host whitelist (hoặc ảnh local, data URL): Render bằng Next.js `<Image>` để tối ưu hóa hiệu năng.
  - Nếu `src` thuộc host ngoài whitelist: Tự động chuyển sang thẻ HTML `<img>` thường kèm các style mô phỏng layout `fill` (`absolute inset-0 object-cover w-full h-full`) để không làm vỡ giao diện.
- Tự động bắt sự kiện `onError` trong `SafeImage` để chuyển nguồn ảnh lỗi sang file ảnh mặc định mới là **`placeholder-food.svg`** (ảnh vector tự chứa).

### B. Giải pháp ảnh sắc nét (ShopeeFood HD)
- Thêm logic làm sạch URL trong Frontend (`helpers.ts`), Backend (`import_shopeefood.ts`) và Crawler (`crawler.js`):
  - Phát hiện các URL chứa `susercontent.com` và có ký tự `@`.
  - Cắt bỏ phần đuôi từ dấu `@` trở đi để lấy link ảnh gốc có độ phân giải cao gốc của ShopeeFood.

### C. Dọn dẹp dữ liệu cũ bị lỗi 404
- Viết và chạy script cập nhật database một lần (one-time script) để chuyển toàn bộ các link ảnh Unsplash đã bị hỏng/xóa trong database về `null`, từ đó giúp Next.js không gửi request lỗi lên server và dọn sạch log lỗi `upstream image response failed` khỏi terminal.

---

## 3. Hệ quả (Consequences)
- **Ưu điểm:**
  - Chống crash ứng dụng 100% tại runtime do Next.js domain whitelist.
  - Ảnh các món ăn ShopeeFood hiển thị sắc nét HD, cải thiện mạnh mẽ trải nghiệm giao diện người dùng.
  - Dọn sạch log rác trong Terminal, giúp debug và vận hành dễ dàng hơn.
  - Bố cục giao diện được giữ nguyên vẹn nhờ CSS mô phỏng layout của Next.js Image.
- **Nhược điểm:**
  - Đối với các domain lạ hiển thị bằng thẻ `<img>` HTML thường, chúng ta sẽ không tận dụng được cơ chế nén ảnh tự động của Next.js (nhưng đây là sự đánh đổi chấp nhận được và bắt buộc để chống crash).
