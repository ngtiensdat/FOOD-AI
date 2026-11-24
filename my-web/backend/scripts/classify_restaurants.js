const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkRestTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT id, name, cuisines, description FROM restaurants ORDER BY id ASC');
  
  const restTypes = {};
  for (const r of res.rows) {
    const name = r.name.toLowerCase();
    const cuisines = (r.cuisines || []).join(' ').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const allText = `${name} ${cuisines} ${desc}`;

    let type = 'VIETNAMESE_TRADITIONAL';

    if (name.includes('chay') || cuisines.includes('chay') || desc.includes('chay')) {
      type = 'VEGAN';
    } else if (name.includes('trà sữa') || name.includes('cà phê') || name.includes('coffee') || name.includes('kafa')) {
      type = 'BEVERAGE_COFFEE_TEA';
    } else if (name.includes('chè') || name.includes('tàu hũ')) {
      type = 'DESSERT_SWEETS';
    } else if (name.includes('pizza') || name.includes('gà rán') || name.includes('jollibee') || name.includes('lotteria') || name.includes('popeye') || name.includes('pop-eye') || name.includes('domino') || name.includes('pháp') || name.includes('le ciel') || name.includes('kebab')) {
      type = 'WESTERN_PIZZA_FASTFOOD';
    } else if (name.includes('sushi') || name.includes('omakase') || name.includes('tokyo deli') || name.includes('yakiniku') || name.includes('korea') || name.includes('gogi') || name.includes('mì cay') || name.includes('seoul') || cuisines.includes('sashimi')) {
      type = 'JAPANESE_KOREAN';
    } else if (name.includes('lẩu') || name.includes('bbq') || name.includes('nướng') || name.includes('meat & meet') || name.includes('hải đế lao') || name.includes('manwah') || name.includes('hutong') || name.includes('king nướng')) {
      type = 'HOTPOT_BBQ';
    } else if (name.includes('ốc') || name.includes('hải sản') || name.includes('cua ghẹ') || name.includes('king crab') || r.id === 100) {
      type = 'SEAFOOD';
    } else if (name.includes('bánh tráng') || name.includes('nem chua rán') || name.includes('bột chiên') || name.includes('bánh giò') || name.includes('bánh đúc')) {
      type = 'STREET_FOOD_SNACKS';
    } else if (name.includes('healthy') || name.includes('salad') || name.includes('poke')) {
      type = 'HEALTHY_SALAD';
    } else if (name.includes('dimsum') || name.includes('san fu lou') || name.includes('meiwei')) {
      type = 'CHINESE_DIMSUM';
    }

    if (!restTypes[type]) restTypes[type] = [];
    restTypes[type].push({ id: r.id, name: r.name });
  }

  console.log('=== RESTAURANT CLASSIFICATION ===');
  for (const [type, list] of Object.entries(restTypes)) {
    console.log(`\n--- ${type} (${list.length} restaurants) ---`);
    for (const r of list) {
      console.log(`  [${r.id}] ${r.name}`);
    }
  }

  await client.end();
}

checkRestTypes().catch(console.error);
