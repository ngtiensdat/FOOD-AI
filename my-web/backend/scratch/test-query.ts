import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Truy vấn danh sách món bún có trong CSDL...');
    const result = await prisma.food.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        name: {
          contains: 'bún',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        city: true,
        district: true,
      },
    });
    console.log('Tìm thấy', result.length, 'món bún:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Lỗi khi truy vấn:', err);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
