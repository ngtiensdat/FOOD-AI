const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: 'E:/FOOD_AI_code/my-web/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/food_ai',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const ids = [772, 773, 774, 775, 776, 777, 784, 785, 786, 787, 788, 796, 797, 798, 800, 801];
  const foods = await prisma.food.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      category: true,
      tags: true,
      description: true,
      price: true,
    },
    orderBy: { id: 'asc' }
  });

  console.log(JSON.stringify(foods, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
