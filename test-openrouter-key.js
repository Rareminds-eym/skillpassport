/**
 * Test OpenRouter API Key
 * Run this to verify if your OpenRouter API key is valid
 */

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testOpenRouterKey() {
  console.log('🔑 Testing OpenRouter API Key...');
  console.log('📍 API URL:', OPENROUTER_API_URL);
  
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'SkillPassport Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, API key is working!" if you can read this.'
          }
        ],
        max_tokens: 50
      })
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', errorData);
      console.error('\n🔍 Error Details:');
      console.error('   Status:', response.status);
      console.error('   Message:', errorData.error?.message || errorData.message);
      console.error('\n💡 Common causes for this error:');
      console.error('   1. Invalid or expired API key');
      console.error('   2. No credits in OpenRouter account');
      console.error('   3. API key lacks necessary permissions');
      console.error('\n🔗 Check your OpenRouter account at: https://openrouter.ai/keys');
      return;
    }

    const data = await response.json();
    console.log('✅ Success! API Response:', data.choices[0]?.message?.content);
    console.log('\n💰 Usage:', data.usage);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testOpenRouterKey();
