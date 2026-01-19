/**
 * Test the /generate-field-keywords endpoint on the deployed career-api worker
 */

const WORKER_URL = 'https://career-api.dark-mode-d021.workers.dev';

async function testFieldKeywords(field) {
  console.log(`\n🧪 Testing field: "${field}"`);
  console.log('─'.repeat(60));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${WORKER_URL}/generate-field-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      console.log(`❌ FAILED (${response.status}): ${error.error}`);
      console.log(`   Use Fallback: ${error.useFallback}`);
      return { success: false, field, error: error.error };
    }
    
    const data = await response.json();
    console.log(`✅ SUCCESS (${duration}ms)`);
    console.log(`   Keywords: ${data.keywords}`);
    console.log(`   Source: ${data.source}`);
    console.log(`   Model: ${data.model}`);
    
    return { success: true, field, keywords: data.keywords, duration };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, field, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing career-api worker /generate-field-keywords endpoint');
  console.log(`📍 Worker URL: ${WORKER_URL}`);
  console.log('='.repeat(60));
  
  const testFields = [
    'B.COM',
    'Mechanical Engineering',
    'Animation',
    'Computer Science',
    'BBA',
    'Journalism',
    'Data Science',
    'Psychology'
  ];
  
  const results = [];
  
  for (const field of testFields) {
    const result = await testFieldKeywords(field);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (successful > 0) {
    const avgDuration = results
      .filter(r => r.success && r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / successful;
    console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  }
  
  console.log('\n✨ Worker endpoint is ready to use!');
}

runTests().catch(console.error);
