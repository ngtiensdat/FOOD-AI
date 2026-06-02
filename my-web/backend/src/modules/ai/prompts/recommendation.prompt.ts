/**
 * Mục đích file này để làm gì: Định nghĩa prompt hướng dẫn AI lựa chọn và trình bày các đề xuất món ăn tốt nhất từ danh sách candidates.
 * Các file khác hay file này có ý nghĩa như nào: Được PromptBuilderService sử dụng khi AI đã trích xuất đủ thông tin bối cảnh của người dùng và thực hiện đề xuất.
 * Các biến đặc biệt: RECOMMENDATION_PROMPT_TEMPLATE.
 */
export const RECOMMENDATION_PROMPT_TEMPLATE = `Dưới đây là danh sách CANDIDATES các món ăn có trong cơ sở dữ liệu (đã được tối ưu hóa tối giản để giảm chi phí token):
{candidatesJson}

Nhiệm vụ của bạn:
1. Hãy giới thiệu hấp dẫn 1-2 món ăn phù hợp nhất CHỈ từ danh sách CANDIDATES ở trên, giải thích lý do vì sao nó phù hợp với ngữ cảnh của họ và khuyên họ bấm xem chi tiết món bên dưới.
2. TUYỆT ĐỐI không được gợi ý món ăn nào không nằm trong danh sách CANDIDATES.
3. Điền các ID của các món bạn gợi ý vào mảng 'suggestedFoodIds' của JSON response (ví dụ: [12, 15]).

Đồng thời, bạn hãy tự động sinh ra 2-3 gợi ý phản hồi nhanh (quickReplies) cho người dùng lựa chọn phản hồi lại đề xuất của bạn (ví dụ: "Đổi món khác đi 🔄", "Tìm quán rẻ hơn 💰", "Món này ngon quá, cảm ơn! 🥰").`;
