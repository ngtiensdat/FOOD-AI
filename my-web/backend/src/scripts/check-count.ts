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
  const totalFoods: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods`;
  const nullEmbeddings: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods WHERE embedding IS NULL`;
  const activeFoods: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods WHERE is_active = true`;
  const activeNullEmbeddings: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods WHERE is_active = true AND embedding IS NULL`;
  const approvedFoods: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods WHERE status::text = 'APPROVED'`;
  const approvedNullEmbeddings: any =
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM foods WHERE status::text = 'APPROVED' AND embedding IS NULL`;

  console.log({
    totalFoods: totalFoods[0].count,
    nullEmbeddings: nullEmbeddings[0].count,
    activeFoods: activeFoods[0].count,
    activeNullEmbeddings: activeNullEmbeddings[0].count,
    approvedFoods: approvedFoods[0].count,
    approvedNullEmbeddings: approvedNullEmbeddings[0].count,
  });
}

check()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
