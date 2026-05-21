const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_xiwgcja32trP@ep-patient-cherry-aoeua23l-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
  });
  
  await client.connect();
  const res = await client.query('SELECT id, email, role, status FROM "users"');
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
