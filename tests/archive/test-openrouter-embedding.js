/**
 * Test OpenRouter embedding directly to see why it's failing
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your-key-here';

async function testOpenRouterEmbedding() {
  console.log('=== Testing OpenRouter Embedding API ===\n');
  
  const text = 'Name: Gokul\nField of Study: BCA\nUniversity: PES University\nCompleted Courses: BlockChain Basics';
  
  console.log('Test text:', text);
  console.log('\nCalling OpenRouter API...');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Embedding Service',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\nResponse body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ OpenRouter embedding successful!');
      console.log('Embedding dimensions:', data.data[0].embedding.length);
      console.log('Model used:', data.model);
    } else {
      console.log('\n❌ OpenRouter embedding failed!');
      console.log('This explains why the worker falls back to local model.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testOpenRouterEmbedding();
