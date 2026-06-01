async function test() {
  console.log('Logging in as merchant01@gmail.com...');
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'merchant01@gmail.com', password: 'D12345678' })
  });

  if (loginRes.status !== 201 && loginRes.status !== 200) {
    console.error('Failed to log in! Status:', loginRes.status);
    return;
  }

  const cookieHeader = loginRes.headers.getSetCookie 
    ? loginRes.headers.getSetCookie().join('; ') 
    : loginRes.headers.get('set-cookie');

  const headers = { 'Cookie': cookieHeader || '' };

  console.log('\n1. Fetching /restaurants/my-restaurant...');
  const restRes = await fetch('http://localhost:3001/restaurants/my-restaurant', { headers });
  console.log('My Restaurant Status:', restRes.status);
  const restBody = await restRes.json();
  console.log('My Restaurant Body:', JSON.stringify(restBody, null, 2));

  console.log('\n2. Fetching /restaurants/my-branches...');
  const branchesRes = await fetch('http://localhost:3001/restaurants/my-branches', { headers });
  console.log('My Branches Status:', branchesRes.status);
  const branchesBody = await branchesRes.json();
  console.log('My Branches Body:', JSON.stringify(branchesBody, null, 2));

  console.log('\n3. Fetching /foods/my-foods...');
  const foodsRes = await fetch('http://localhost:3001/foods/my-foods', { headers });
  console.log('My Foods Status:', foodsRes.status);
  const foodsBody = await foodsRes.json();
  console.log('My Foods Body:', JSON.stringify(foodsBody, null, 2).substring(0, 500) + '...');
}

test().catch(console.error);
