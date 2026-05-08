const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Đang tạo HNSW Index cho bảng foods...');
    
    // Tạo index HNSW cho pgvector để tăng tốc độ truy vấn gấp nhiều lần khi dữ liệu lớn
    await client.query(`
      CREATE INDEX IF NOT EXISTS foods_embedding_idx 
      ON foods USING hnsw (embedding vector_cosine_ops);
    `);
    
    console.log('✅ Đã tạo HNSW Index thành công!');
  } catch (err) {
    console.error('Lỗi tạo Index:', err.message);
  } finally {
    await client.end();
  }
}

main();
