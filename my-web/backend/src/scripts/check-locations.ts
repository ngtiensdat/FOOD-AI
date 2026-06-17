/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from 'path';
import * as fs from 'fs';

// Load .env file thủ công từ thư mục backend
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts
        .slice(1)
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

// Import động sau khi đã nạp biến môi trường thành công
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const foodCities: any =
    await prisma.$queryRaw`SELECT city, COUNT(*)::int as count FROM foods GROUP BY city`;
  const foodDistricts: any =
    await prisma.$queryRaw`SELECT district, COUNT(*)::int as count FROM foods GROUP BY district`;
  const restCities: any =
    await prisma.$queryRaw`SELECT city, COUNT(*)::int as count FROM restaurants GROUP BY city`;
  const restDistricts: any =
    await prisma.$queryRaw`SELECT district, COUNT(*)::int as count FROM restaurants GROUP BY district`;

  console.log('Food Cities:', foodCities);
  console.log('Food Districts:', foodDistricts);
  console.log('Restaurant Cities:', restCities);
  console.log('Restaurant Districts:', restDistricts);
}

check()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
