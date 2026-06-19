import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: { author: { name: 'Đạt Đây' } }
  });
  console.log(posts.map(p => ({id: p.id, deletedAt: p.deletedAt, status: p.status})));
}

main().catch(console.error).finally(() => prisma.$disconnect());
