const jwt = require('jsonwebtoken');

async function test() {
  const secret = 'super-secret-key-for-dev-only'; // Default from app.config.ts
  const token = jwt.sign({ sub: 1, email: 'admin@gmail.com' }, secret, { expiresIn: '1d' });

  const usersRes = await fetch('http://localhost:3001/admin/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const users = await usersRes.json();
  console.log('Users response:', JSON.stringify(users, null, 2));
}

test().catch(console.error);
