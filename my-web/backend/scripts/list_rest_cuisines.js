const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const rests = await client.query(`
    SELECT id, name, cuisines, description
    FROM restaurants
    WHERE id >= 11
    ORDER BY id ASC
  `);

  console.log(`Restaurants from 11 to 100 count: ${rests.rows.length}`);
  for (const r of rests.rows) {
    console.log(`ID ${r.id}: "${r.name}" | Cuisines: ${JSON.stringify(r.cuisines)}`);
  }

  await client.end();
}

main().catch(console.error);
