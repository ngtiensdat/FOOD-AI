async function test() {
  // Login
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123456' })
  });

  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);
  console.log('Login body:', await loginRes.text());
}

test().catch(console.error);
