/**
 * Mục đích file này để làm gì: Định nghĩa prompt hướng dẫn AI lựa chọn và trình bày các đề xuất món ăn tốt nhất từ danh sách candidates.
 * Các file khác hay file này có ý nghĩa như nào: Được PromptBuilderService sử dụng khi AI đã trích xuất đủ thông tin bối cảnh của người dùng và thực hiện đề xuất.
 * Các biến đặc biệt: RECOMMENDATION_PROMPT_TEMPLATE.
 */
export const RECOMMENDATION_PROMPT_TEMPLATE = `Nhiệm vụ của bạn:
1. Hãy lựa chọn và giới thiệu hấp dẫn 1-2 món ăn phù hợp nhất CHỈ từ danh sách CANDIDATES ở trên, giải thích lý do cụ thể vì sao nó phù hợp với ngữ cảnh thời gian, khoảng cách, sở thích và giá cả của khách.
2. ĐẢM BẢO TÍNH HỢP LÝ THỰC TẾ (COMMON SENSE):
   - Nếu khách đang đói, phải gợi ý món ăn no hoàn chỉnh (Standalone meal: bánh mì, mì, bún, phở, cơm...), TUYỆT ĐỐI KHÔNG gợi ý cốc nước hay 1 đĩa sườn/thịt nướng sống tại quán nướng BBQ gọi món để khách ăn chống đói một mình.
   - Nếu khách vừa phản ánh rằng quán nướng hay món trước đó không phù hợp, hãy cầu thị lắng nghe và gợi ý địa điểm khác nhanh chóng, tiện lợi, đúng với mong muốn của họ.
3. Khuyên họ bấm xem chi tiết món ăn hiển thị ở thẻ bên dưới tin nhắn.
4. Điền các ID của các món bạn gợi ý vào mảng 'suggestedFoodIds' của JSON response (ví dụ: [12, 15]). Bạn KHÔNG cần tự đính kèm link ảnh hay hình ảnh Markdown trong văn bản câu trả lời (reply).

Đồng thời, bạn hãy tự động sinh ra 2-3 gợi ý phản hồi nhanh (quickReplies) liên quan trực tiếp đến đề xuất để người dùng dễ dàng phản hồi lại hoặc yêu cầu tìm thêm.`;
