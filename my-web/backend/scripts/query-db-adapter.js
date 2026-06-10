const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  .finally(() => prisma.$disconnect().then(() => pool.end()));
