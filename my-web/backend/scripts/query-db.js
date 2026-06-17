const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log(JSON.stringify(conversations, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
