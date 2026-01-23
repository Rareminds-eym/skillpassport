// Quick test for OpenRouter API key
const API_KEY = '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';

async function testKey() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://test.com',
        'X-Title': 'Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hi' }],
        max_tokens: 10
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testKey();
