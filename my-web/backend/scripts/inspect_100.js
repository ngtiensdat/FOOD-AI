const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const r100 = await client.query("SELECT * FROM restaurants WHERE id = 100");
  console.log('Restaurant 100:', r100.rows);

  const f100 = await client.query("SELECT id, name, description, tags FROM foods WHERE restaurant_id = 100 AND deleted_at IS NULL");
  console.log('Foods 100:', f100.rows);

  await client.end();
}

main().catch(console.error);
