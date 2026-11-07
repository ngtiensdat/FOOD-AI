# ADR 0003: AI Content Moderation for Automatic Food Approval

## Trạng thái (Status)
Đã chấp thuận (Accepted)

## Bối cảnh (Context)
Trong kiến trúc ban đầu của hệ thống FOOD_AI:
* Khi đối tác nhà hàng tạo món ăn mới hoặc chỉnh sửa món ăn hiện có, trạng thái của món ăn bị đặt về `FoodStatus.PENDING`.
* Điều này buộc quản trị viên (Admin) phải can thiệp thủ công để duyệt từng món ăn qua Admin Panel.
* Cơ chế này dẫn đến các hạn chế lớn:
  1. **Nút thắt cổ chai vận hành**: Admin phải duyệt hàng trăm món mỗi ngày, gây chậm trễ.
  2. **Trải nghiệm kém cho chủ quán**: Chủ quán chỉ cần cập nhật giá ưu đãi hoặc sửa một lỗi chính tả nhỏ trong mô tả cũng bị ẩn món khỏi thực khách và phải chờ Admin duyệt lại.
  3. **Chưa tận dụng thế mạnh AI**: Là một nền tảng tiên phong về AI Ẩm thực (Food AI), việc kiểm duyệt nội dung văn bản và hình ảnh hoàn toàn có thể được tự động hóa bằng AI.

## Quyết định (Decision)
Hệ thống triển khai dịch vụ kiểm duyệt nội dung tự động **`FoodModerationService`** theo mô hình **Hybrid 2 lớp**:

### 1. Kiến trúc Kiểm duyệt Hybrid
* **Lớp 1: Rule-Based Guardrails (Siêu tốc < 5ms)**:
  * Kiểm tra tính hợp lý của thông tin: Giá món ăn phải nằm trong khoảng hợp lệ ($100đ \le \text{price} \le 100,000,000đ$), độ dài tên món từ 2 đến 150 ký tự.
  * Danh sách đen (Blacklist Regex): Chặn ngay lập tức các từ khóa về chất cấm (ma túy, bóng cười, cần sa...), động vật hoang dã cấm buôn bán (thịt hổ, sừng tê giác, vảy tê tê...), từ ngữ thô tục hoặc khiêu dâm.
  * Nếu vi phạm ➔ Trả về `isApproved: false` ngay lập tức, chuyển trạng thái `PENDING` kèm lý do vi phạm chi tiết cho Admin kiểm tra.
* **Lớp 2: LLM Semantic Moderation (LangChain & OpenAI / Gemini)**:
  * Nếu vượt qua Lớp 1, thông tin món ăn được gửi đến ChatModel với Prompt chuyên biệt cho kiểm duyệt thực phẩm trực tuyến.
  * Đánh giá tính chân thực, an toàn và mức độ phù hợp với tiêu chuẩn cộng đồng.
  * Trả về kết quả JSON có cấu trúc (`isApproved`, `confidence`, `reason`).

### 2. Tích hợp Luồng Nghiệp vụ (FoodService Integration)
* Khi nhà hàng **Thêm món mới (`createFood`)**:
  * Nếu AI phê duyệt ➔ Món ăn nhận ngay trạng thái `FoodStatus.APPROVED`. Chủ quán có thể bán món ngay lập tức.
  * Nếu AI phát hiện vi phạm ➔ Đưa về `FoodStatus.PENDING` để Admin xử lý thủ công.
* Khi nhà hàng **Chỉnh sửa món ăn (`updateFood`)**:
  * Nếu AI phê duyệt ➔ Giữ nguyên hoặc đặt trạng thái `FoodStatus.APPROVED`. Không làm gián đoạn kinh doanh của quán.
  * Nếu AI phát hiện bất thường ➔ Đưa về `FoodStatus.PENDING`.
* **Cơ chế Graceful Fallback**: Nếu dịch vụ LLM bên thứ 3 gặp sự cố gián đoạn mạng hoặc hết quota, hệ thống tự động dựa vào kết quả an toàn từ Lớp 1 (Rule Guardrails) để tự động duyệt, không làm gián đoạn trải nghiệm người dùng.

## Hệ quả & Lợi ích (Consequences)
* **Tích cực**:
  * Giảm 95%+ thời gian chờ đợi duyệt thực đơn cho đối tác nhà hàng.
  * Tự động loại bỏ nội dung rác, độc hại hoặc vi phạm pháp luật ngay tại thời điểm nhập liệu.
  * Admin chỉ cần tập trung xử lý các trường hợp nghi vấn (Flagged cases) thay vì duyệt thủ công 100% món ăn.
* **Tiêu cực & Biện pháp khắc phục**:
  * Chi phí token gọi LLM: Được tối ưu hóa nhờ Lớp 1 (Guardrails lọc trước) và prompt ngắn gọn trả về JSON.

