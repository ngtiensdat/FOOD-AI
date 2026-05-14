# Rule: Social Data Consistency (Facebook Engineering Standards)

You are a social graph specialist. Apply Facebook's principles (TAO - Objects & Associations) to ensure high availability, extreme performance, and bidirectional data integrity.

## 1. Objects & Associations (Thực thể & Liên kết)
- **Objects:** Mọi thực thể (User, Food, Restaurant, Comment) là một Object với ID duy nhất.
- **Associations:** Các hành động (Follow, Like, Rate) là các liên kết (Edges) giữa các Objects.
- **Bi-directional Integrity:** Khi tạo một liên kết (A follow B), hệ thống PHẢI đảm bảo tính nhất quán của cả hai phía (A's following list/count và B's follower list/count) trong cùng một Transaction.

## 2. Write-Through Consistency
- **Rule:** Đảm bảo tính nhất quán "Read-after-write". Người dùng phải nhìn thấy hành động của chính mình (Like/Follow) ngay lập tức sau khi thực hiện.
- **Action:** Cập nhật Database và các biến đếm (Counters) đồng thời trước khi trả về Response.

## 3. Idempotency & Conflict Resolution
- **Idempotency:** Một hành động được thực hiện nhiều lần (do retry hoặc user click nhanh) chỉ được tạo ra duy nhất một kết quả.
- **Constraint:** Sử dụng Unique Constraints trên các cặp liên kết (ví dụ: `unique(followerId, followingId)`). Tuyệt đối không dùng logic check-then-insert thủ công nếu không có transaction lock.

## 4. Denormalization & Counter Integrity
Để đạt tốc độ đọc cực nhanh (High Read Performance):
- **Counters:** Các trường `totalLikes`, `totalFollowers`, `averageRating` là dữ liệu dư thừa (denormalized). 
- **Recalculation Policy:** Luôn cập nhật Counters bằng cách tính toán lại từ thực tế (`count()`) bên trong transaction thay vì chỉ tăng/giảm đơn thuần (+1/-1) để tránh sai số tích lũy do race conditions.

## 5. Visibility & Cascading
- **Cascade Cleanup:** Khi một Object bị xóa (Soft/Hard delete), tất cả các Associations liên quan (Likes của món ăn đó, Follows của người dùng đó) phải được xử lý ngay lập tức để tránh "liên kết ma" (Dangling associations).

## Examples

### ✅ Follow Association (Facebook Standard)
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Tạo liên kết Association (Idempotency via Unique Constraint)
  await tx.follow.create({ data: { followerId, followingId } });
  
  // 2. Đồng bộ Bi-directional Counters
  const [followers, following] = await Promise.all([
    tx.follow.count({ where: { followingId } }),
    tx.follow.count({ where: { followerId } })
  ]);

  await tx.user.update({ where: { id: followingId }, data: { followerCount: followers } });
  await tx.user.update({ where: { id: followerId }, data: { followingCount: following } });
});
```

## Checklist
- [ ] Hành động này đã đảm bảo tính giao hoán (Idempotency) chưa? (Bấm 2 lần có lỗi không?)
- [ ] Các liên kết hai chiều (Bi-directional) đã được cập nhật đồng thời chưa?
- [ ] Biến đếm (Counters) có được cập nhật dựa trên giá trị thực tế (`count()`) không?
- [ ] Khi xóa Object, các liên kết liên quan đã được xử lý (Cleanup) chưa?
