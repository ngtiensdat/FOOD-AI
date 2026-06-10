/**
 * Mục đích file này để làm gì: Định nghĩa prompt hướng dẫn AI lựa chọn và trình bày các đề xuất món ăn tốt nhất từ danh sách candidates.
 * Các file khác hay file này có ý nghĩa như nào: Được PromptBuilderService sử dụng khi AI đã trích xuất đủ thông tin bối cảnh của người dùng và thực hiện đề xuất.
 * Các biến đặc biệt: RECOMMENDATION_PROMPT_TEMPLATE.
 */
export const RECOMMENDATION_PROMPT_TEMPLATE = `Nhiệm vụ của bạn:
1. Hãy lựa chọn và giới thiệu hấp dẫn 1-2 món ăn phù hợp nhất CHỈ từ danh sách CANDIDATES ở trên, giải thích lý do vì sao nó phù hợp với ngữ cảnh, khoảng cách và giá cả của họ.
2. Khuyên họ bấm xem chi tiết món ăn hiển thị ở bên dưới tin nhắn.
3. Điền các ID của các món bạn gợi ý vào mảng 'suggestedFoodIds' của JSON response (ví dụ: [12, 15]). Bạn KHÔNG cần tự đính kèm link ảnh hay hình ảnh Markdown trong văn bản câu trả lời (reply).

Đồng thời, bạn hãy tự động sinh ra 2-3 gợi ý phản hồi nhanh (quickReplies) cho người dùng lựa chọn phản hồi lại đề xuất của bạn hoặc nếu bạn chưa có đủ thông tin thì có thể yêu cầu người dùng cung cấp thêm.`;
