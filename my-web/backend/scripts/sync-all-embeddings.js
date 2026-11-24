const { Client } = require('pg');
const { OpenAIEmbeddings } = require('@langchain/openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function syncEmbeddings() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Connected to PostgreSQL.');

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small'
  });

  const query = `
    SELECT 
      f.id,
      f.name,
      f.price,
      f.description,
      f.tags,
      r.name as restaurant_name,
      c.name as category_name
    FROM foods f
    JOIN restaurants r ON f.restaurant_id = r.id
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.deleted_at IS NULL AND f.restaurant_id >= 11
    ORDER BY f.id ASC
  `;

  const res = await client.query(query);
  const foods = res.rows;
  console.log(`Total foods to re-embed: ${foods.length}`);

  const BATCH_SIZE = 50;
  let processed = 0;

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const chunk = foods.slice(i, i + BATCH_SIZE);
    const texts = chunk.map(f => {
      const tagsStr = f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Không có';
      const catName = f.category_name || 'Món ăn';
      const resName = f.restaurant_name ? `Quán: ${f.restaurant_name}. ` : '';
      const priceVal = Number(f.price || 0);
      return `Danh mục: ${catName}. ${resName}Món ăn: ${f.name}. Giá: ${priceVal.toLocaleString('vi-VN')}đ. Mô tả: ${f.description || 'Không có mô tả'}. Nhãn: ${tagsStr}.`;
    });

    try {
      const vectors = await embeddings.embedDocuments(texts);

      for (let j = 0; j < chunk.length; j++) {
        const foodId = chunk[j].id;
        const vectorStr = `[${vectors[j].join(',')}]`;
        await client.query('UPDATE foods SET embedding = CAST($1 AS vector) WHERE id = $2', [vectorStr, foodId]);
      }

      processed += chunk.length;
      console.log(`Embedded and saved ${processed}/${foods.length} foods (${Math.round(processed / foods.length * 100)}%)`);
    } catch (err) {
      console.error(`Error embedding batch starting at index ${i}:`, err);
      // Retry once with 2s delay
      await new Promise(r => setTimeout(r, 2000));
      try {
        const vectors = await embeddings.embedDocuments(texts);
        for (let j = 0; j < chunk.length; j++) {
          const foodId = chunk[j].id;
          const vectorStr = `[${vectors[j].join(',')}]`;
          await client.query('UPDATE foods SET embedding = CAST($1 AS vector) WHERE id = $2', [vectorStr, foodId]);
        }
        processed += chunk.length;
        console.log(`[RETRY OK] Embedded and saved ${processed}/${foods.length} foods`);
      } catch (retryErr) {
        console.error(`Fatal batch error for batch ${i}:`, retryErr);
      }
    }
  }

  console.log(`Finished synchronizing vector embeddings for ${processed} foods!`);
  await client.end();
}

syncEmbeddings().catch(console.error);
