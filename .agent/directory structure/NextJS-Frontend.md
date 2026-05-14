frontend/
├── .husky/                 # Thư mục chứa các script chặn commit (pre-commit hook) để đảm bảo code đã chuẩn convention, đáp ứng đúng lint, build không lỗi,... trước khi được đẩy lên
│   └── pre-commit          # Script chạy tsc và eslint trước khi cho phép git commit
│
├── public/                 # Tài nguyên tĩnh không qua build (favicon, robots.txt, ảnh landing page)
│
├── src/
│   ├── assets/             # Tài nguyên tĩnh đi qua build (images, svg, local fonts)
│   ├── app/                # Next.js App Router (Định nghĩa routing gồm layout, page,... Theo Next)
│   ├── components/         # Chứa các component giao diện
│   │   ├── base/           # Các component base tự custom (BaseButton, BaseTable...)
│   │   └── features/       # Component theo nghiệp vụ
│   ├── lib/                # Cấu hình thư viện (Axios client, utils)
│   ├── hooks/              # Custom React Hooks
│   ├── store/              # Global State (Zustand/Redux)
│   ├── types/              # Định nghĩa TypeScript
│   ├── index.css           # Global CSS (Cấu hình Tailwind)
│   ├── providers/           # Các provider của react
│   ├── schemas/           # Các validator trên front end (Sử dụng zod)
│   ├── services/           # Các hàm gọi api đến backend
│   ├── utils/           # Chứa các hàm sử dụng chung
│   └── constants/              # Định nghĩa các hằng số
│
├── eslint.config.mjs          # Cấu hình linter khắt khe để đảm bảo chất lượng mã nguồn. Cơ bản sẽ phải kiểm tra những điều sau: eslint-plugin-boundaries (để phân chia ranh giới các phần vào đúng folder), áp dụng quy tắc đặt tên của dự án (kebab-case), không hard code hard text hard mã màu, unusedImports, không lạm dụng any, không sử dụng Magic number
├── .prettierrc             # Cấu hình format code chuẩn chung cho cả team
├── tailwind.config.ts      # Cấu hình TailwindCSS, nên ghi đè tailwind bằng ghi đè mã màu
├── tsconfig.json           # Cấu hình TypeScript (Bật Strict Mode)
├── package.json            
├── Dockerfile, .dockerignore, docker compose         # Nếu sử dụng Docker để build
├── Sentry         # Cấu hình để ghi nhận bug trên product
├── .gitignore           # Cấu hình những thứ không push lên git
└── .env             # Cấu hình biến môi trường, có thể tạo thêm các biến thể như .env.local, .e