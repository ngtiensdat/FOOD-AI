import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = ['users', 'restaurants', 'foods', 'categories', 'category_groups', 'posts', 'comments', 'likes', 'histories', 'favorites'];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 0) + 1, false) FROM "${table}";`);
      console.log('Fixed sequence for ' + table);
    } catch (e: any) {
      console.error('Failed to fix ' + table, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
