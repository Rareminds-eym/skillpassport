/**
 * Test script to verify question caching
 * Tests that questions are generated once and cached for subsequent requests
 */

const testQuestionCaching = async () => {
  const backendUrl = 'http://localhost:3001';
  const testCourse = 'SQL Basic';

  console.log('🧪 Testing Question Caching System\n');

  // Test 1: First request (should generate)
  console.log('📝 Test 1: First request (should generate new questions)');
  const start1 = Date.now();
  const response1 = await fetch(`${backendUrl}/api/assessment/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: testCourse,
      level: 'Intermediate',
      questionCount: 15
    })
  });
  const data1 = await response1.json();
  const time1 = Date.now() - start1;
  
  console.log(`✅ Response received in ${time1}ms`);
  console.log(`   Questions: ${data1.questions?.length}`);
  console.log(`   Cached: ${data1.cached || false}`);
  console.log(`   First question: ${data1.questions?.[0]?.question?.substring(0, 50)}...`);
  console.log('');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Second request (should use cache)
  console.log('📝 Test 2: Second request (should use cached questions)');
  const start2 = Date.now();
  const response2 = await fetch(`${backendUrl}/api/assessment/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: testCourse,
      level: 'Intermediate',
      questionCount: 15
    })
  });
  const data2 = await response2.json();
  const time2 = Date.now() - start2;
  
  console.log(`✅ Response received in ${time2}ms`);
  console.log(`   Questions: ${data2.questions?.length}`);
  console.log(`   Cached: ${data2.cached || false}`);
  console.log(`   First question: ${data2.questions?.[0]?.question?.substring(0, 50)}...`);
  console.log('');

  // Verify
  console.log('📊 Results:');
  console.log(`   First request: ${time1}ms ${data1.cached ? '(cached)' : '(generated)'}`);
  console.log(`   Second request: ${time2}ms ${data2.cached ? '(cached)' : '(generated)'}`);
  console.log(`   Speed improvement: ${Math.round((time1 - time2) / time1 * 100)}%`);
  console.log('');

  if (data2.cached && time2 < time1) {
    console.log('✅ SUCCESS: Caching is working correctly!');
  } else {
    console.log('⚠️ WARNING: Caching may not be working as expected');
  }
};

// Run test
testQuestionCaching().catch(console.error);
