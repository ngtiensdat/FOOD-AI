# Coding Convention - FOOD AI

Quy tắc viết code giúp mã nguồn đồng nhất, dễ đọc và dễ bảo trì.

## 1. Nguyên tắc chung
- Tuân thủ nguyên tắc **Clean Code** và **SOLID**.
- Luôn sử dụng ESLint và Prettier để tự động định dạng code.
- Ưu tiên sự rõ ràng hơn là sự ngắn gọn.

## 2. Quy tắc đặt tên (Naming Convention)
- **Biến và Hàm:** Sử dụng `camelCase` (ví dụ: `getUserInfo`, `foodList`).
- **Lớp (Class) và Component:** Sử dụng `PascalCase` (ví dụ: `AuthService`, `FoodCard`).
- **Hằng số (Constants):** Sử dụng `UPPER_SNAKE_CASE` (ví dụ: `MAX_RETRY_COUNT`).
- **File:** Tên file trùng với tên Component hoặc Class.

## 3. Chú thích (Comments)
- Chỉ chú thích cho những logic phức tạp, không chú thích cho những đoạn code hiển nhiên.
- Sử dụng JSDoc cho các hàm quan trọng để hỗ trợ gợi ý trong IDE.
