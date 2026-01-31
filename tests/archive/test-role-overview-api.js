/**
 * Test script to verify the Role Overview API is working
 * Run this in the browser console to diagnose issues
 */

async function testRoleOverviewAPI() {
  console.log('=== Testing Role Overview API ===\n');
  
  // Check if API key is configured
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found! Please add VITE_OPENAI_API_KEY or OPENROUTER_API_KEY to your .env file');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 20) + '...');
  console.log('   Key type:', apiKey.startsWith('sk-or-v1-') ? 'OpenRouter' : 'OpenAI');
  
  // Test API call
  const testRole = 'Software Engineer';
  const testCluster = 'Technology';
  
  console.log(`\n📝 Testing API call for: ${testRole} in ${testCluster}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Career Path Generator Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a career advisor. Return valid JSON only.'
          },
          {
            role: 'user',
            content: `For a ${testRole} role, provide 3 key responsibilities. Return ONLY a JSON array: ["resp1", "resp2", "resp3"]`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });
    
    console.log('   Response status:', response.status);
    
    if (response.status === 402) {
      console.error('❌ Insufficient credits! Please add credits at https://openrouter.ai/settings/credits');
      return;
    }
    
    if (response.status === 401) {
      console.error('❌ Invalid API key! Please check your API key in .env file');
      return;
    }
    
    if (response.status === 429) {
      console.error('❌ Rate limit exceeded! Please wait and try again');
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API response received!');
    console.log('   Model used:', data.model);
    console.log('   Response:', data.choices[0]?.message?.content);
    
    console.log('\n🎉 API is working correctly! The issue might be elsewhere.');
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n   Possible causes:');
    console.log('   - CORS issue (try from the actual app domain)');
    console.log('   - Network connectivity issue');
    console.log('   - API endpoint is down');
  }
}

// Export for use in browser console
window.testRoleOverviewAPI = testRoleOverviewAPI;

console.log('Test function loaded! Run: testRoleOverviewAPI()');
