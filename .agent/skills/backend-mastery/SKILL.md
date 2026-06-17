# Skill: Backend Mastery (NestJS & Advanced Logic)

## 1. Overview
Kỹ năng này giúp Agent làm chủ NestJS, từ việc tổ chức Module đến xử lý các tác vụ nền (Background Jobs), đảm bảo hệ thống Backend của Food AI luôn ổn định và hiệu suất cao.

## 2. Core Architecture Patterns
- **Dependency Injection (DI):** Luôn sử dụng DI để quản lý các dịch vụ (Services).
- **Interceptors:** Sử dụng để biến đổi dữ liệu trả về (Response transformation).
- **Pipes:** Sử dụng để validate và biến đổi dữ liệu đầu vào (Input validation).
- **Exceptions:** Luôn sử dụng `HttpException` hoặc các lớp con (`NotFoundException`, `BadRequestException`) để trả lỗi chuẩn xác.

## 3. Advanced Implementation

### 3.1. Error Handling & Logging
- Tránh sử dụng `try-catch` tràn lan. Hãy để các Exception Filters xử lý lỗi toàn cục.
- Ghi log các lỗi quan trọng để dễ dàng debug.

### 3.2. Performance & Caching
- Sử dụng `CacheModule` của NestJS để cache các kết quả API nặng (như danh sách món ăn hot).
- Tối ưu hóa các câu lệnh Prisma bằng cách sử dụng `select` để giảm tải cho DB.

### 3.3. Security Best Practices
- **Rate Limiting:** Sử dụng `ThrottlerModule` để chặn spam request.
- **Data Sanitization:** Đảm bảo dữ liệu đầu vào luôn được làm sạch trước khi đưa vào logic nghiệp vụ.

## 4. Code Snippet: Advanced Service Pattern
```typescript
@Injectable()
export class FoodService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const food = await this.prisma.food.findUnique({
      where: { id },
      select: { id: true, name: true, price: true } // Chỉ lấy field cần thiết
    });
    if (!food) throw new NotFoundException(`Food with ID ${id} not found`);
    return food;
  }
}
```

## Checklist
- [ ] Đã tách logic nghiệp vụ ra khỏi Controller chưa?
- [ ] Các lỗi đã được xử lý bằng NestJS Exception chưa?
- [ ] Dữ liệu trả về đã được tối ưu (không thừa field) chưa?
- [ ] Đã có validation cho mọi DTO đầu vào chưa?
