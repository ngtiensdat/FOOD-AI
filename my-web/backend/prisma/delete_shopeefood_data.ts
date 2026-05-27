/**
 * SCRIPT TIỆN ÍCH DỌN DẸP DỮ LIỆU SHOPEEFOOD
 * 
 * Mục đích: Xóa sạch dữ liệu mẫu 
 * và toàn bộ món ăn, danh mục liên quan ra khỏi cơ sở dữ liệu để chuẩn bị cho việc import mới.
 * 
 * Cách chạy: npx tsx prisma/delete_shopeefood_data.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("❌ Đang tiến hành xóa dữ liệu của dataset ShopeeFood...");

    const emails = ['merchant01@gmail.com', 'merchant02@gmail.com', 'merchant03@gmail.com']; //thêm dc

    // Lấy thông tin các merchant và quán ăn trước khi xóa để log
    const merchants = await prisma.user.findMany({
        where: { email: { in: emails } },
        include: { restaurants: true }
    });

    if (merchants.length === 0) {
        console.log("ℹ️ Không tìm thấy merchant nào trong database để xóa.");
        return;
    }

    console.log(`📌 Tìm thấy ${merchants.length} tài khoản merchant cần xóa.`);

    for (const merchant of merchants) {
        console.log(`-> Xóa chủ quán: ${merchant.email}`);
        for (const rest of merchant.restaurants) {
            console.log(`   - Xóa nhà hàng: ${rest.name}`);
        }
    }

    // Xóa User sẽ kích hoạt Cascade Delete xóa toàn bộ Restaurant, CategoryGroup, Category, Food liên quan
    const deleteResult = await prisma.user.deleteMany({
        where: { email: { in: emails } }
    });

    console.log(`✅ Đã xóa thành công ${deleteResult.count} chủ quán cùng toàn bộ nhà hàng, danh mục và món ăn liên quan từ 3 dataset.`);
}

main()
    .catch((e) => {
        console.error("❌ Lỗi khi xóa dữ liệu:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
