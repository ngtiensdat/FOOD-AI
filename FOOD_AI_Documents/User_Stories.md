# DANH SÁCH USER STORIES - DỰ ÁN FOOD AI

Tài liệu này mô tả các tính năng của hệ thống dưới góc nhìn của người dùng cuối.

## 1. PHÂN HỆ KHÁCH HÀNG (CUSTOMER)
| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| US_01 | **Tìm kiếm AI**: Là một thực khách, tôi muốn nhập nhu cầu bằng ngôn ngữ tự nhiên (ví dụ: "Đang buồn muốn ăn gì đó cay 50k") để AI gợi ý món ăn. | - AI trả về lời khuyên bằng văn bản.<br>- Hiển thị danh sách các món ăn khớp với yêu cầu. |
| US_02 | **Xem danh mục**: Là một người dùng, tôi muốn xem món ăn theo các danh mục (Bún, Phở, Đồ ăn nhanh...) để dễ dàng lựa chọn. | - Hiển thị các icon danh mục.<br>- Click vào danh mục sẽ lọc ra món ăn tương ứng. |
| US_03 | **Dashboard cá nhân**: Là một khách hàng, tôi muốn xem lại lịch sử các món đã xem hoặc yêu thích. | - Hiển thị danh sách món ăn đã lưu trong Dashboard. |

## 2. PHÂN HỆ THƯƠNG GIA (MERCHANT)
| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| US_04 | **Đăng ký kinh doanh**: Là một chủ quán, tôi muốn upload giấy tờ pháp lý để Admin xét duyệt gian hàng. | - Form đăng ký có chỗ upload file.<br>- Trạng thái tài khoản ban đầu là PENDING. |
| US_05 | **Quản lý món ăn**: Là một thương gia, tôi muốn quản lý danh sách món ăn của mình. | - Thêm/Sửa/Xóa món ăn.<br>- Cập nhật giá và hình ảnh. |

## 3. PHÂN HỆ QUẢN TRỊ (ADMIN)
| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| US_06 | **Duyệt gian hàng**: Là Admin, tôi muốn xem danh sách Merchant đang chờ duyệt để cấp phép hoạt động. | - Danh sách các Merchant có trạng thái PENDING.<br>- Nút Duyệt (Approve) và Từ chối (Reject). |
| US_07 | **Quản lý người dùng**: Là Admin, tôi muốn có quyền xóa người dùng vi phạm. | - Bảng danh sách toàn bộ người dùng.<br>- Nút Xóa (Delete) có xác nhận trước khi thực hiện. |
| US_08 | **Cấu hình nổi bật**: Là Admin, tôi muốn chọn các món ăn nổi bật theo ngày/tuần để hiển thị lên trang chủ. | - Nút ghim (Star) cho từng món ăn trong bảng quản lý menu. |

---
*Tài liệu này phục vụ cho quá trình phát triển theo mô hình Agile/Scrum.*
