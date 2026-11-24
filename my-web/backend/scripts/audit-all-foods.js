const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const query = `
    SELECT 
      r.id as restaurant_id,
      r.name as restaurant_name,
      r.address,
      f.id as food_id,
      f.name as food_name,
      f.description,
      f.price,
      c.name as category_name
    FROM foods f
    JOIN restaurants r ON f.restaurant_id = r.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.deleted_at IS NULL
    ORDER BY r.id, f.id
  `;

  const res = await client.query(query);
  console.log(`Total foods retrieved: ${res.rows.length}`);

  // Group by restaurant
  const byRestaurant = {};
  const noDescList = [];
  
  for (const row of res.rows) {
    if (!byRestaurant[row.restaurant_id]) {
      byRestaurant[row.restaurant_id] = {
        name: row.restaurant_name,
        address: row.address,
        foods: []
      };
    }
    byRestaurant[row.restaurant_id].foods.push({
      id: row.food_id,
      name: row.food_name,
      desc: row.description,
      category: row.category_name,
      price: row.price
    });

    if (!row.description || row.description.trim() === '' || row.description.includes('Không có mô tả')) {
      noDescList.push({
        res: row.restaurant_name,
        res_id: row.restaurant_id,
        food: row.food_name,
        food_id: row.food_id,
        desc: row.description
      });
    }
  }

  fs.writeFileSync(__dirname + '/audit_dump.json', JSON.stringify({
    total: res.rows.length,
    noDescCount: noDescList.length,
    noDescList,
    byRestaurant
  }, null, 2));

  console.log(`Saved audit_dump.json. Foods with missing/empty/"Không có mô tả" description: ${noDescList.length}`);

  // Let's print out restaurants and their food names to see what looks weird
  for (const [resId, r] of Object.entries(byRestaurant)) {
    const foodNames = r.foods.map(f => f.name).join(', ');
    console.log(`[#${resId}] ${r.name}: ${foodNames}`);
  }

  await client.end();
}

main().catch(console.error);
