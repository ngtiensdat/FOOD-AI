const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- ĐANG KIỂM TRA VÀ KHỞI TẠO DỮ LIỆU ---');

  const adminPassword = await bcrypt.hash('admin123456', 10);

  // 1. Tạo/Cập nhật Admin
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@gmail.com',
      name: 'Quản trị viên tối cao',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: { fullName: 'Hệ thống Quản trị' }
      }
    },
  });

  // 2. Đọc dữ liệu từ foods.json
  const foodsPath = path.join(__dirname, 'foods.json');
  if (fs.existsSync(foodsPath)) {
    console.log('--- Đang nạp dữ liệu món ăn từ foods.json ---');
    const foodsData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

    for (const food of foodsData) {
      // Kiểm tra trùng lặp theo tên để không tạo record dư thừa khi chạy lại
      const existing = await prisma.food.findFirst({
        where: { name: food.name }
      });

      if (existing) {
        // Cập nhật nếu đã tồn tại
        await prisma.food.update({
          where: { id: existing.id },
          data: {
            ...food,
            status: 'APPROVED',
            isActive: true
          }
        });
        console.log(`Đã cập nhật: ${food.name}`);
      } else {
        // Tạo mới nếu chưa có
        await prisma.food.create({
          data: {
            ...food,
            status: 'APPROVED',
            isActive: true
          }
        });
        console.log(`Đã thêm mới: ${food.name}`);
      }
    }
    console.log(`--- Hoàn tất xử lý ${foodsData.length} món ăn ---`);
  }

  console.log('--- HOÀN TẤT: DATABASE ĐÃ ĐƯỢC CẬP NHẬT ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
