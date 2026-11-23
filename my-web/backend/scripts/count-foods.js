const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: 'E:/FOOD_AI_code/my-web/backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const count = await prisma.food.count();
  console.log('Total foods in DB:', count);
  await prisma.$disconnect();
  await pool.end();
}
run();
