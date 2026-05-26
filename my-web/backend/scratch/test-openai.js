require('dotenv').config();
const OpenAI = require('openai');

async function main() {
  console.log("Testing OpenAI API Key...");
  console.log("Key prefix:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) : "undefined");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Test food embedding',
    });
    console.log("SUCCESS! Embedding vector length:", response.data[0].embedding.length);
  } catch (error) {
    console.error("FAILED! OpenAI API error:", error);
  }
}

main();
