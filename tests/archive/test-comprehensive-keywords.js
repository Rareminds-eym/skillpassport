/**
 * Test comprehensive keyword generation
 */

const WORKER_URL = 'https://career-api.dark-mode-d021.workers.dev';

async function testField(field) {
  console.log(`\n🧪 Testing: "${field}"`);
  console.log('─'.repeat(80));
  
  try {
    const response = await fetch(`${WORKER_URL}/generate-field-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.log(`❌ FAILED (${response.status}): ${error.error}`);
      return;
    }
    
    const data = await response.json();
    const keywords = data.keywords.split(',').map(k => k.trim());
    
    console.log(`✅ SUCCESS - Generated ${keywords.length} keywords:`);
    console.log(`\n${data.keywords}\n`);
    
    return keywords.length;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function run() {
  console.log('🚀 Testing Comprehensive Keyword Generation');
  console.log('='.repeat(80));
  
  const fields = ['B.COM', 'Mechanical Engineering', 'Computer Science'];
  
  for (const field of fields) {
    await testField(field);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

run().catch(console.error);
