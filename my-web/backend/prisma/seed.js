const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// 1. Tạo Pool kết nối
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Khởi tạo Prisma với Adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- ĐANG KHỞI TẠO DỮ LIỆU HỆ THỐNG ---');

  const adminPassword = await bcrypt.hash('admin123456', 10);

  // 1. Tạo/Cập nhật Admin mặc định
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@gmail.com',
      name: 'Quản trị viên tối cao',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      fullName: 'Admin FoodAI',
      bio: 'Quản trị viên cấp cao của hệ thống Food AI'
    }
  });
  console.log(`- Đã khởi tạo Admin: ${admin.email}`);

  // 2. Tạo các Danh mục (Categories) mẫu
  const categories = [
    'Món nước', 'Cơm', 'Phở', 'Bún', 'Đồ ăn nhanh', 'Lẩu', 'Hải sản', 'Ăn vặt', 'Đồ uống'
  ];

  console.log('- Đang tạo danh mục món ăn...');
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('--- HOÀN TẤT: HỆ THỐNG ĐÃ SẴN SÀNG ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
