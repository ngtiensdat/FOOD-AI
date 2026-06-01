const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_xiwgcja32trP@ep-patient-cherry-aoeua23l-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
  });
  
  await client.connect();

  console.log('--- RESTAURANTS ---');
  const restaurantsRes = await client.query('SELECT id, name, address, owner_id, is_active FROM "restaurants"');
  console.log(restaurantsRes.rows);

  console.log('--- FOODS COUNT PER RESTAURANT ---');
  const foodsCountRes = await client.query('SELECT restaurant_id, COUNT(*), SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count, SUM(CASE WHEN status = \'APPROVED\' THEN 1 ELSE 0 END) as approved_count FROM "foods" GROUP BY restaurant_id');
  console.log(foodsCountRes.rows);

  await client.end();
}

main().catch(console.error);
