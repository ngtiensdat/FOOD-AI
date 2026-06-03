async function test() {
  const email = 'datga27@gmail.com';
  const password = 'D1234567';

  console.log(`1. Logging in as ${email}...`);
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (loginRes.status !== 201 && loginRes.status !== 200) {
    console.error('Failed to log in! Status:', loginRes.status);
    console.error('Response:', await loginRes.text());
    return;
  }

  const cookieHeader = loginRes.headers.getSetCookie 
    ? loginRes.headers.getSetCookie().join('; ') 
    : loginRes.headers.get('set-cookie');

  const headers = { 
    'Content-Type': 'application/json',
    'Cookie': cookieHeader || '' 
  };
  console.log('Login successful! Cookies retrieved.');

  console.log('\n2. Creating a new conversation...');
  const convRes = await fetch('http://localhost:3001/ai/conversations', {
    method: 'POST',
    headers
  });
  console.log('Conversation creation status:', convRes.status);
  const convBody = await convRes.json();
  const conversationId = convBody.id;
  console.log('Created conversation ID:', conversationId);

  console.log('\n3. Sending message "đói quá" to AI Chat...');
  const chatRes = await fetch('http://localhost:3001/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'đói quá',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
      temperature: 28,
      isRaining: false,
      conversationId
    })
  });

  console.log('Chat Status:', chatRes.status);
  const chatBody = await chatRes.json();
  console.log('AI Response Body:\n', JSON.stringify(chatBody, null, 2));
}

test().catch(console.error);
