/**
 * SCRIPT ĐỒNG BỘ AUTO-INCREMENT SEQUENCE POSTGRESQL
 * 
 * Mục đích: Đồng bộ lại giá trị sequence (bộ đếm ID tự sinh) của bảng `users` và `restaurants`
 * về giá trị MAX(id) hiện tại trong database. Tránh lỗi trùng lặp ID (Unique constraint failed)
 * khi thêm người dùng mới hoặc nhà hàng mới sau khi đã import dữ liệu cứng.
 * 
 * Cách chạy: npx tsx prisma/fix_seq.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$executeRawUnsafe(`SELECT setval('restaurants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM restaurants));`);
    await prisma.$executeRawUnsafe(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));`);
    console.log("Sequences fixed");
}
main().finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
