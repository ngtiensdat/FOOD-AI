import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({
    where: { name: 'Đạt Đây' },
    include: { _count: { select: { posts: true } } }
  });
  console.log("User:", u?.name, "Total posts count ignoring where:", u?._count?.posts);

  const u2 = await prisma.user.findFirst({
    where: { name: 'Đạt Đây' },
    include: { _count: { select: { posts: { where: { deletedAt: null } } } } }
  });
  console.log("User:", u2?.name, "Posts with deletedAt=null count:", u2?._count?.posts);

  const posts = await prisma.post.findMany({
    where: { authorId: u?.id }
  });
  console.log("Posts detail:");
  posts.forEach(p => console.log(`- ID: ${p.id}, DeletedAt: ${p.deletedAt}, Status: ${p.status}`));
}

main().finally(() => prisma.$disconnect());
