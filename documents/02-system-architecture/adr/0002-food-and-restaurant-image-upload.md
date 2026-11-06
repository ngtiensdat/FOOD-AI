# ADR 0002: Nâng cấp cơ chế tải ảnh món ăn và nhà hàng từ máy tính lên Cloudinary và dọn rác tự động

## Trạng thái (Status)
Đã chấp thuận (Accepted)

## Bối cảnh (Context)
- Trước đây, các biểu mẫu thêm/sửa món ăn (`FoodFormModal.tsx`, `AdminFoodModal.tsx`) và cài đặt thương hiệu quán ăn (`RestaurantBrandImagesTab.tsx`) chỉ cung cấp ô nhập văn bản thuần để người dùng dán đường dẫn URL ảnh từ bên ngoài.
- Trải nghiệm người dùng (UX) bị hạn chế nghiêm trọng do người dùng mong muốn trực tiếp tải ảnh từ máy tính hoặc điện thoại lên.
- Ngoài ra, khi người dùng thay đổi ảnh đại diện hoặc ảnh bìa món ăn/quán ăn, ảnh cũ trên Cloudinary không được dọn dẹp, dẫn đến lãng phí dung lượng lưu trữ đám mây.

## Quyết định (Decision)
1. **Frontend**:
   - Mở rộng component `ImageUploader.tsx` hỗ trợ kiểu upload mới `food` với tỷ lệ khung hình chuẩn và gọi endpoint `/media/food-image`.
   - Tích hợp `ImageUploader` vào `FoodFormModal.tsx`, `AdminFoodModal.tsx` và `RestaurantBrandImagesTab.tsx` với khả năng vừa tải ảnh từ máy (kéo thả, crop, preview), vừa hỗ trợ dán URL bên ngoài linh hoạt.
   - Thêm nhãn chuẩn vào `labels.ts` và `labels.en.ts`, không hardcode text.
2. **Backend**:
   - Bổ sung endpoint `POST /media/food-image` vào `MediaController` để upload ảnh món ăn vào thư mục `foods` trên Cloudinary.
   - Tạo tiện ích dùng chung `cloudinary.helper.ts` với hàm `extractPublicId(url: string)` chuẩn hóa.
   - Inject `MediaService` vào `FoodService` và `RestaurantService`.
   - Khi cập nhật hoặc xóa món ăn/hồ sơ quán, tự động kiểm tra nếu ảnh cũ nằm trên Cloudinary thì gọi lệnh hủy `mediaService.deleteImage(publicId)` ngầm.

## Hệ quả (Consequences)
- Người dùng có thể kéo thả, cắt ảnh và tải ảnh trực tiếp từ máy lên cực kỳ nhanh chóng và chuyên nghiệp.
- Kho lưu trữ Cloudinary luôn được dọn rác tự động khi cập nhật hoặc xóa dữ liệu, tối ưu dung lượng đám mây.
- Đảm bảo an toàn kiểu dữ liệu (TypeScript), tuân thủ Clean Architecture và vượt qua kiểm tra Husky pre-commit hooks.

