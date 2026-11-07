# HƯỚNG DẪN ĐIỀN DỮ LIỆU IMPORT (FILE EXCEL .XLSX CHUẨN 100% CSDL)

Toàn bộ dữ liệu được quản lý qua **2 file Excel (`.xlsx`)** nằm tại thư mục `data-import/`:
- ✅ **Đầy đủ 100% các cột và trường của CSDL** (không bị thiếu bất kỳ dữ liệu nào).
- ✅ **Không lỗi font tiếng Việt** (Unicode native).
- ✅ **Số điện thoại định dạng chuẩn chuỗi ký tự**, không bao giờ bị đổi thành số mũ `9.11E+08`.
- ✅ **Độ rộng các cột tự động căn chỉnh vừa vặn**, tiêu đề và nội dung hiển thị rõ ràng, chuyên nghiệp.

---

## 📁 1. FILE `nha_hang_va_mon_an.xlsx` (Role Nhà Hàng & Món Ăn)

### 📌 Mẹo nhập liệu:
* **Dòng đầu tiên của một Quán:** Điền đầy đủ thông tin quán (tên quán, địa chỉ, link map, chủ quán...) và thông tin món ăn số 1.
* **Các dòng tiếp theo của cùng Quán đó:** Bạn **chỉ cần điền `ten_quan`** (các cột thông tin quán để trống), sau đó điền thông tin món ăn số 2, số 3, số 4... Hệ thống sẽ tự động gán vào đúng quán đó!

### Danh sách 28 cột chi tiết:

#### A. Nhóm Quán ăn & Chủ quán (điền 1 lần ở dòng đầu):
1. `email_chu_quan`: Email đăng nhập tài khoản chủ quán (Role `RESTAURANT`, vd: `quan1@test.com`)
2. `mat_khau_chu_quan`: Mật khẩu đăng nhập (mặc định: `123456`)
3. `ten_chu_quan`: Họ tên người đại diện / chủ quán (vd: `Đỗ Quang Vinh`)
4. `sdt_chu_quan`: Số điện thoại chủ quán (vd: `0911000001`)
5. `ten_quan`: Tên quán ăn / thương hiệu (vd: `Bếp Cơm Phố Cổ`)
6. `dia_chi_quan`: Địa chỉ thật ngoài đời (vd: `12 Hàng Buồm, Hoàn Kiếm, Hà Nội`)
7. `link_dia_chi_quan`: **Link Google Maps của quán** (vd: `https://www.google.com/maps?q=21.0353,105.8525` hoặc link `https://maps.app.goo.gl/...`)
8. `quan_huyen`: Quận / Huyện thật (vd: `Hoàn Kiếm`, `Cầu Giấy`)
9. `thanh_pho`: Tỉnh / Thành phố thật (vd: `Hà Nội`, `TP.HCM`)
10. `vi_do_lat`: Vĩ độ Latitude thật từ Google Maps (vd: `21.0353`)
11. `kinh_do_lng`: Kinh độ Longitude thật từ Google Maps (vd: `105.8525`)
12. `loai_am_thuc`: Các loại ẩm thực quán phục vụ (cách nhau dấu phẩy: `Cơm, Món Bắc, Đồ truyền thống`)
13. `danh_gia_sao`: Điểm đánh giá ban đầu của quán (vd: `4.8`)
14. `so_luong_danh_gia`: Số lượt đánh giá mẫu của quán (vd: `45`)
15. `mo_ta_quan`: Giới thiệu phong cách, không gian quán
16. `gio_mo_cua`: Giờ mở cửa hàng ngày (vd: `09:00 - 21:00`)
17. `sdt_quan`: Hotline đặt hàng của quán (vd: `0243888999`)
18. `link_logo_quan`: Link ảnh logo / avatar quán (Unsplash hoặc web)
19. `link_anh_bia_quan`: Link ảnh bìa không gian quán (Unsplash hoặc web)

#### B. Nhóm Món ăn của quán đó (mỗi dòng là 1 món):
20. `nhom_thuc_don`: Nhóm danh mục lớn (vd: `Món chính`, `Đồ uống`, `Ăn kèm`)
21. `danh_muc`: Danh mục con (vd: `Cơm đĩa`, `Phở bò`, `Trà sữa`)
22. `ten_mon`: Tên món ăn (vd: `Cơm Sườn Nướng Mật Ong`)
23. `gia_tien`: Giá bán (VNĐ) (vd: `55000`)
24. `mo_ta_mon`: **Mô tả chi tiết nguyên liệu, vị giác (Trường cốt lõi để AI tạo Vector Embedding)**
25. `link_anh_mon`: Link ảnh món ăn chất lượng cao từ Unsplash
26. `the_tags`: **Từ khóa tìm kiếm cách nhau dấu phẩy (vd: `cơm, sườn nướng, ăn trưa, bán chạy`)**
27. `calo`: Năng lượng calo của món (vd: `620`)
28. `protein`: Hàm lượng đạm (gram) (vd: `28`)
29. `carbs`: Tinh bột (gram) (vd: `70`)
30. `fat`: Chất béo (gram) (vd: `18`)
31. `luot_dat`: Số lượt đã bán hiển thị trên UI (vd: `128`)
32. `luot_thich`: Số lượt yêu thích món (vd: `46`)
33. `mon_noi_bat`: `TRUE` hoặc `FALSE` (để ghim lên trang chủ / đề xuất)

---

## 👥 2. FILE `khach_hang.xlsx` (Role Khách Hàng)

Mỗi dòng là một khách hàng mẫu:
1. `email`: Email đăng nhập của khách (Role `CUSTOMER`, vd: `khach1@test.com`)
2. `mat_khau`: Mật khẩu đăng nhập (mặc định: `123456`)
3. `ho_ten`: Họ và tên khách hàng (vd: `Nguyễn Văn An`)
4. `so_dien_thoai`: SĐT liên hệ (vd: `0900000001`)
5. `dia_chi`: Địa chỉ giao hàng mặc định (vd: `144 Xuân Thủy, Cầu Giấy, Hà Nội`)
6. `so_thich_am_thuc`: **Món ưa thích (AI dùng để gợi ý món cá nhân hóa: `Cơm văn phòng, Món Việt, Đồ cay`)**
7. `muc_tieu_suc_khoe`: **Mục tiêu thể chất: `muscle_gain` (tăng cơ), `weight_loss` (giảm cân), `eat_clean` (ăn sạch), `enjoy` (thưởng thức)**
8. `ngan_sach`: Mức chi tiêu (`TietKiem`, `TrungBinh`, `LinhHoat`, `CaoCap`)
9. `danh_hieu`: Huy hiệu/danh hiệu thành viên (vd: `Tín đồ ẩm thực`, `Thực thần`, `Ăn sạch sống khỏe`)
10. `diem_thuong`: Điểm tích lũy ban đầu (vd: `100`)
11. `cap_do`: Cấp độ level tài khoản (vd: `1` hoặc `2`, hệ thống tự tính `xp`)
12. `anh_dai_dien`: Link ảnh avatar
13. `anh_bia`: Link ảnh bìa trang cá nhân
14. `tieu_su`: Tiểu sử giới thiệu ngắn

---

## 🚀 3. QUY TRÌNH NẠP DỮ LIỆU & EMBEDDING

1. Mở 2 file Excel trong thư mục `data-import/` lên, chỉnh sửa hoặc điền thêm dữ liệu theo ý bạn.
2. Lưu file lại (`Ctrl + S`).
3. Mở terminal tại thư mục `my-web/backend` và chạy lệnh:
   ```bash
   npm run import:data
   ```
4. Hệ thống sẽ:
   - Tự động nạp toàn bộ quán ăn, menu món, khách hàng vào PostgreSQL.
   - Tự động kích hoạt tài khoản (`isEmailVerified: true`, `APPROVED`), hash mật khẩu bằng Bcrypt.
   - Tự động gọi API OpenAI tạo **Vector Embedding (1536 chiều)** cho từng món ăn và hồ sơ khách hàng.
