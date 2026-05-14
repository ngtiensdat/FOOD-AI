backend/
├── .husky/                 # Thư mục chứa các script chặn commit (pre-commit hook) để đảm bảo code đã chuẩn convention, đáp ứng đúng lint, build không lỗi,... trước khi được đẩy lên
├── src/
│   ├── main.ts                       # Entry point (Khởi tạo app, setup Global Pipes/Filters/Swagger)
│   ├── app.module.ts                 # Root Module (Gắn kết mọi thứ lại với nhau)
│   │
│   ├── common/                       # [TẦNG DÙNG CHUNG] (Cross-cutting concerns)
│   │   ├── base/                     # [LỰA CHỌN NÂNG CAO] Các class chung để tái sử dụng
│   │   │   ├── base.dto.ts           # PaginationDto, ApiResponseDto
│   │   │   ├── base.service.ts       # Abstract Class định nghĩa sẵn CRUD bằng Generics
│   │   │   └── base.controller.ts    # Abstract Controller định nghĩa sẵn GET, POST, PUT, DELETE
│   │   ├── constants/                # Hằng số (Messages, ErrorCodes)
│   │   ├── decorators/               # Custom Decorators (VD: @CurrentUser(), @Roles())
│   │   ├── exceptions/               # Custom Exceptions (Business exceptions)
│   │   ├── filters/                  # Bắt lỗi toàn cục (AllExceptionsFilter)
│   │   ├── guards/                   # Chắn cổng bảo mật (JwtAuthGuard, RolesGuard)
│   │   ├── interceptors/             # Ghi log request, biến đổi Response cho đồng nhất
│   │   ├── i18n/                     # chứa các text đa ngôn ngữ
│   │   └── utils/                    # Các hàm tiện ích (BcryptHelper, DateHelper)
│   │
│   ├── config/                       # Cấu hình môi trường (Load từ .env)
│   │   └── app.config.ts
│   │
│   ├── database/                     # Cấu hình kết nối DB
│   │   └── prisma.service.ts         # Khởi tạo Prisma Client để chọc xuống DB
│   │
│   └── modules/                      #[TẦNG NGHIỆP VỤ LÕI] - Gói theo Feature
│       │
│       ├── auth/                     # Module Đăng nhập / Phân quyền
│       │   ├── dto/                  # login.dto.ts, register.dto.ts
│       │   ├── strategies/           # jwt.strategy.ts (Xác thực token)
│       │   ├── auth.controller.ts    
│       │   ├── auth.service.ts       
│       │   └── auth.module.ts        # Định nghĩa các Provider và Controller của Auth
│       │
│       ├── students/                 # Module Quản lý Sinh viên
│       │   ├── dto/                  # create-student.dto.ts, update-student.dto.ts
│       │   ├── student.controller.ts # [Kế thừa BaseController]
│       │   ├── student.service.ts    # [Kế thừa BaseService]
│       │   └── student.module.ts     
│       │
│       └── projects/                 # Module Quản lý Dự án (Cấu trúc tương tự)
│
├── prisma/                           # TẦNG DATABASE (Prisma ORM)
│   ├── schema.prisma                 # Khai báo cấu trúc bảng CSDL (Entities)
│   └── migrations/                   # Chứa lịch sử thay đổi DB 
│
├── .env                              # Biến môi trường
├── nest-cli.json                     # Cấu hình của Nest CLI
├── package.json
├── eslint.config.mjs                 # Khuyên dùng bộ ESLint chặt chẽ như Frontend
├── .prettierrc
├── Dockerfile, .dockerignore, docker compose         # Nếu sử dụng Docker để build
├── .gitignore           # Cấu hình những thứ không push lên git
└── tsconfig.json                     # (Bật strict mode)