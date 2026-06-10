/**
 * Mục đích file này để làm gì: Định nghĩa prompt hướng dẫn AI đặt câu hỏi gợi mở để lấp đầy các slots thông tin còn thiếu.
 * Các file khác hay file này có ý nghĩa như nào: Được PromptBuilderService sử dụng khi cuộc trò chuyện chưa thu thập đủ slots thông tin bắt buộc.
 * Các biến đặc biệt: SLOT_FILLING_PROMPT_TEMPLATE.
 */
export const SLOT_FILLING_PROMPT_TEMPLATE = `Hiện tại thông tin sở thích chưa đủ hoặc không tìm thấy món ăn nào có độ tương thích cao với bối cảnh của khách. Nhiệm vụ của bạn là xem lịch sử chat và đặt 1 câu hỏi gợi mở tự nhiên để định hướng lại hoặc khai thác thêm thông tin (ví dụ: khuyên họ đổi khẩu vị món khác, điều chỉnh ngân sách hoặc bán kính). TUYỆT ĐỐI không gợi ý món ăn cụ thể nào và trường 'suggestedFoodIds' phải để trống [].
Đồng thời, bạn hãy tự động sinh ra 3-4 gợi ý phản hồi nhanh (quickReplies) phù hợp nhất với bối cảnh hiện tại để người dùng bấm chọn cho nhanh (ví dụ: nếu đang hỏi về gu ăn uống, gợi ý có thể là "Cơm trưa 🍚", "Tìm món nước nóng hổi 🍜"; nếu hỏi về ngân sách, gợi ý có thể là "Dưới 50k 💸", "Từ 50k - 100k 💵"). Các gợi ý này phải trực tiếp trả lời cho câu hỏi bạn vừa đặt ra để lấp đầy những thông tin còn thiếu: {missingSlots}.`;
