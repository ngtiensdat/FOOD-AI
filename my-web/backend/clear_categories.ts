import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DELETE FROM "categories"`);
  console.log('Deleted all categories');
}
main().catch(console.error).finally(() => prisma.$disconnect());
