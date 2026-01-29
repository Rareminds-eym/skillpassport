// Test career chat endpoint
const SUPABASE_URL = 'https://dpooleduinyyzxgrcwko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';

async function testChat() {
  console.log('🧪 Testing career chat endpoint...\n');

  // First, get a valid auth token
  console.log('1. Getting auth token...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ No active session. Please log in first.');
    return;
  }

  const token = session.access_token;
  console.log('✅ Got auth token:', token.substring(0, 20) + '...\n');

  // Test the chat endpoint
  console.log('2. Calling /api/career/chat...');
  const response = await fetch('http://localhost:8788/api/career/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'Hello, can you help me with my career?'
    })
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));

  if (response.ok) {
    console.log('\n✅ Success! Streaming response:');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
    }
  } else {
    const error = await response.text();
    console.error('\n❌ Error:', error);
  }
}

testChat().catch(console.error);
