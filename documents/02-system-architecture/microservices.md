# Kiến trúc Microservices & Mở rộng [LỘ TRÌNH - ROADMAP] - FOOD AI

Tài liệu này mô tả định hướng phân rã hệ thống trong tương lai.

## 1. Hiện trạng (Monolithic)
Hiện tại dự án đang chạy theo mô hình **Modular Monolith** (Một mã nguồn nhưng chia module rõ ràng). Điều này phù hợp cho giai đoạn khởi đầu để tăng tốc độ phát triển.

## 2. Lộ trình phân rã (Microservices Path)
Khi hệ thống lớn mạnh, các module sau sẽ được tách thành các dịch vụ độc lập:
- **AI Service:** Tách riêng để scale tài nguyên GPU/CPU chuyên dụng cho xử lý ngôn ngữ.
- **Notification Service:** Xử lý Mail, SMS, Push notification qua hàng đợi (Message Queue - RabbitMQ/Kafka).
- **Search Service:** Sử dụng Elasticsearch để tìm kiếm tốc độ cao bên cạnh Vector Search.

## 3. Giao tiếp giữa các dịch vụ
- **Đồng bộ:** RESTful API hoặc gRPC.
- **Bất đồng bộ:** Message Broker (Event-driven architecture).
