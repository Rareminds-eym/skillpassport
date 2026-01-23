// Test Career API Worker Auth
// Save this as test-career-api.html and open in browser

const WORKER_URL = prompt('Enter your worker URL (e.g., https://career-api.your-subdomain.workers.dev)');

async function testWorkerAuth() {
  try {
    // Get Supabase session
    const { createClient } = supabase;
    const supabaseClient = createClient(
      prompt('Supabase URL:'),
      prompt('Supabase Anon Key:')
    );
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      console.error('❌ Not logged in');
      return;
    }
    
    console.log('✅ Got session, token:', session.access_token.substring(0, 20) + '...');
    
    // Test worker endpoint
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        message: 'test',
        conversationId: undefined,
        selectedChips: []
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Worker error:', error);
      return;
    }
    
    console.log('✅ Worker responded successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkerAuth();
