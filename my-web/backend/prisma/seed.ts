import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

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
      profile: {
        create: {
          fullName: 'Admin FoodAI',
          bio: 'Quản trị viên cấp cao của hệ thống Food AI'
        }
      }
    },
  });
  console.log(`- Đã khởi tạo Admin: ${admin.email}`);

  // 3. Tạo Merchant mẫu
  const merchantPassword = await bcrypt.hash('merchant123456', 10);
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@gmail.com' },
    update: {},
    create: {
      email: 'merchant@gmail.com',
      name: 'Chủ quán ăn ngon',
      password: merchantPassword,
      role: 'RESTAURANT',
      status: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: {
          fullName: 'Nguyễn Văn Chủ',
        }
      }
    }
  });
  console.log(`- Đã khởi tạo Merchant: ${merchant.email}`);

  // 4. Tạo Nhà hàng mẫu
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Nhà Hàng Food AI Xa La',
      address: 'Phố Xa La, Phúc La, Hà Đông, Hà Nội',
      latitude: 20.9752273,
      longitude: 105.7452284,
      ownerId: merchant.id,
      isActive: true,
    }
  });
  console.log(`- Đã khởi tạo Nhà hàng: ${restaurant.name}`);

  // 5. Tạo món ăn mẫu
  console.log('- Đang tạo món ăn mẫu...');
  const foodsData = [
    {
      name: "Ngũ cốc kiểu Pháp",
      price: 199000,
      description: "Ngũ cốc kiểu Pháp thơm ngon, giàu chất xơ.",
      image: "https://res.cloudinary.com/dy16ujpkq/image/upload/v1778222690/cld-sample-4.jpg",
      lat: 20.9752273,
      lng: 105.7452284,
      tags: ["Ngũ cốc", "Kiểu Pháp"],
      isAdminRecommended: true,
      isFeaturedToday: true,
      status: 'APPROVED' as const
    },
    {
      name: "Phở Bò Gia Truyền",
      price: 55000,
      description: "Phở bò nước dùng ngọt thanh, thịt bò mềm.",
      image: "https://res.cloudinary.com/dy16ujpkq/image/upload/v1778222690/cld-sample-4.jpg",
      lat: 20.976,
      lng: 105.746,
      tags: ["Phở", "Bò"],
      isAdminRecommended: true,
      isFeaturedWeekly: true,
      status: 'APPROVED' as const
    },
    {
      name: "Cơm Tấm Sườn Bì",
      price: 45000,
      description: "Cơm tấm sài gòn chính hiệu.",
      image: "https://res.cloudinary.com/dy16ujpkq/image/upload/v1778222690/cld-sample-4.jpg",
      lat: 20.974,
      lng: 105.744,
      tags: ["Cơm Tấm"],
      isFeaturedToday: true,
      status: 'APPROVED' as const
    }
  ];

  for (const food of foodsData) {
    await prisma.food.create({
      data: {
        ...food,
        restaurantId: restaurant.id
      }
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
