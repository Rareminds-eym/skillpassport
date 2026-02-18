/**
 * Test OpenRouter chat API to confirm the key is invalid
 */

const OPENROUTER_API_KEY = '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';

async function testOpenRouterChat() {
  console.log('=== Testing OpenRouter Chat API ===\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Test',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
      }),
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ OpenRouter chat API working!');
    } else {
      console.log('\n❌ OpenRouter chat API failed!');
      console.log('The API key is invalid or expired.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testOpenRouterChat();
