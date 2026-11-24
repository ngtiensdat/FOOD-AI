const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const rests = await client.query("SELECT id, name, address, description, rating FROM restaurants ORDER BY id ASC");
  console.log(`Total restaurants: ${rests.rows.length}`);
  for (const r of rests.rows) {
    console.log(`[${r.id}] ${r.name} | ${r.address}`);
  }

  await client.end();
}

main().catch(console.error);
