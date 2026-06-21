import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.offer.deleteMany();
  console.log(`Deleted ${result.count} offers.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
