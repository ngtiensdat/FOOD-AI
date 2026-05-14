# Kiến trúc Triển khai [ĐỀ XUẤT - PROPOSAL] - FOOD AI

Tài liệu mô tả quy trình đưa ứng dụng lên môi trường thực tế.

## 1. Môi trường triển khai
- **Frontend:** Vercel hoặc Netlify (tối ưu cho Next.js).
- **Backend:** VPS (Ubuntu/CentOS), Render hoặc Railway.
- **Database:** Supabase hoặc AWS RDS (hỗ trợ PostgreSQL + pgvector).

## 2. Dockerization
Ứng dụng sẽ được đóng gói bằng Docker để đảm bảo tính nhất quán:
- `Dockerfile.frontend`
- `Dockerfile.backend`
- `docker-compose.yml` (cho môi trường Development/Staging).

## 3. Quy trình CI/CD
- **GitHub Actions:** 
  1. Tự động kiểm tra lỗi (Linting & Testing).
  2. Tự động build Docker Image.
  3. Deploy lên môi trường Staging/Production khi có code mới được merge vào nhánh chính.
