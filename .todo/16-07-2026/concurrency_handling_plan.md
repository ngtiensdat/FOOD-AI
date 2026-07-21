# Kế hoạch Giải quyết Tranh chấp Đồng thời & Xung đột Dữ liệu (Concurrency & Race Conditions)

Tài liệu này đánh giá hiện trạng hệ thống liên quan đến việc xử lý các tình huống nhiều người dùng thao tác cùng lúc (Race Conditions) và cập nhật tiến độ triển khai các giải pháp khắc phục.

---

## 1. Tranh chấp Tồn kho Nguyên vật liệu (Stock Overselling Race Condition) - **[ĐÃ HOÀN THÀNH]**

### 🚨 Hiện trạng & Lỗ hổng
* Bố cục cơ sở dữ liệu tách làm hai: PostgreSQL (quản lý thông tin món ăn, hóa đơn `Order`) và SQLite (quản lý nguyên liệu kho `Ingredient`, công thức `RecipeItem`).
* Trước đây, khi khách hàng đặt món thông qua POS, đơn hàng được ghi nhận thành công trong PostgreSQL trước. Sau đó, hệ thống mới gọi bất đồng bộ sang SQLite để trừ kho nguyên liệu.
* Nếu nguyên liệu bị thiếu hụt, hệ thống SQLite ghi log lỗi nhưng không thể rollback đơn hàng đã ghi nhận ở PostgreSQL.

### ✔️ Giải pháp đã triển khai
1. **Kiểm tra và Trừ kho nguyên tử ở SQLite:**
   * Cập nhật logic trừ kho nguyên liệu trong [inventory-deduction.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/inventory/inventory-deduction.service.ts).
   * Sau khi trừ kho, hệ thống kiểm tra nếu `updatedIngredient.quantity < 0` sẽ ném ra lỗi `BadRequestException` lập tức để rollback giao dịch SQLite.
2. **Rollback phối hợp ở PostgreSQL:**
   * Di chuyển luồng gọi hàm trừ tồn kho từ bên ngoài vào **bên trong** khối transaction chính tạo đơn hàng của PostgreSQL [order.service.ts](file:///e:/FOOD_AI_code/my-web/backend/src/modules/order/order.service.ts).
   * Nếu SQLite phát sinh lỗi hết hàng và ném ra `BadRequestException`, ngoại lệ này sẽ lan truyền ngược lại làm hủy (rollback) toàn bộ transaction tạo hóa đơn của PG. Khách hàng nhận được thông báo lỗi chi tiết và không bị tạo đơn khống.

---

## 2. Tranh chấp Bàn ăn (Dining Table Selection Concurrency) - **[KẾ HOẠCH]**

### 🚨 Hiện trạng & Lỗ hổng
* Hai nhân viên thu ngân mở giao diện POS cùng lúc, thấy Bàn số 10 ở trạng thái trống (`FREE`).
* Cả hai đều có thể chọn Bàn số 10, thêm các món ăn khác nhau vào giỏ hàng riêng và thanh toán hóa đơn cùng lúc, tạo ra 2 đơn hàng trùng lặp trên cùng 1 bàn.

### 📝 Kế hoạch khắc phục
1. **Khóa trạng thái bàn ăn trong Giao dịch:**
   * Trong phương thức `createOrder` của `order.service.ts`, thực hiện kiểm tra trạng thái hiện tại của bàn ăn trong database:
     * Nếu bàn đang có trạng thái `OCCUPIED` (đang có khách ăn và chưa thanh toán), hệ thống từ chối tạo đơn mới.
2. **Đồng bộ trạng thái bàn thời gian thực (WebSockets):**
   * Sử dụng kết nối WebSocket để phát tín hiệu cập nhật trạng thái bàn ăn tức thời cho tất cả các thiết bị POS khác mỗi khi có bàn chuyển đổi trạng thái.

---

## 3. Tranh chấp Phiên đăng nhập máy POS (POS Terminal Session Overriding) - **[KẾ HOẠCH]**

### 🚨 Hiện trạng & Lỗ hổng
* Khi nhân viên B đăng nhập vào máy POS 01 khi nhân viên A đang sử dụng, backend thực hiện ghi nhận `LOGIN_OVERRIDE` vào log và chuyển quyền sử dụng sang nhân viên B.
* Tuy nhiên, giao diện của nhân viên A không hề biết mình bị đá phiên đăng nhập cho tới khi nhân viên A thực hiện thanh toán hóa đơn.

### 📝 Kế hoạch khắc phục
1. **Đá phiên đăng nhập chủ động qua WebSocket:**
   * Khi nhân viên B đăng nhập thành công đè lên máy POS đang hoạt động, backend sẽ phát một sự kiện WebSocket (`pos_kicked`) riêng biệt tới Room của nhân viên A để khóa màn hình hoặc cảnh báo ngay lập tức.
2. **Hộp thoại xác nhận đăng nhập đè (Takeover Confirmation):**
   * Khi phát hiện máy POS đang hoạt động, frontend hiển thị popup: *"Máy POS này đang được sử dụng bởi [Tên nhân viên]. Bạn có chắc chắn muốn tiếp quản không?"* thay vì tự động chiếm quyền không cảnh báo.

---

## 4. Tranh chấp nhận mã Điểm thưởng (PointCode Claiming Race Condition) - **[ĐÃ HOÀN THÀNH]**

### 🚨 Hiện trạng & Lỗ hổng
* Khách hàng quét mã 6 số để nhận điểm. Trong trường hợp 2 khách hàng đồng thời gửi request nhận điểm cho cùng 1 mã trong cùng 1 mili giây.
* Trước đây, hệ thống tìm kiếm rồi mới cập nhật riêng lẻ nên có nguy cơ cả hai người cùng nhận được điểm thưởng (Double Claiming).

### ✔️ Giải pháp đã triển khai
* Sử dụng cập nhật nguyên tử bằng `updateMany` kết hợp điều kiện `usedById: null` trong giao dịch:
  ```typescript
  const updateResult = await tx.pointCode.updateMany({
    where: {
      id: pointCode.id,
      usedById: null, // Chỉ cập nhật nếu chưa ai nhận mã này
    },
    data: {
      usedById: userId,
      usedByName: user.name || user.email,
      usedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    throw new BadRequestException('Mã tích điểm này đã được sử dụng hoặc không hợp lệ.');
  }
  ```
* Cơ chế này chặn hoàn toàn hành vi chạy đua nhận điểm thưởng, chỉ có tối đa 1 giao dịch giành mã thành công, giao dịch còn lại sẽ bị từ chối và rollback.
