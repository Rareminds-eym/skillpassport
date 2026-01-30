/**
 * Test the recommend-opportunities endpoint
 */

const TEST_STUDENT_ID = '95364f0d-23fb-4616-b0f4-48caafee5439'; // From the error logs

async function testRecommendEndpoint() {
  console.log('Testing recommend-opportunities endpoint...\n');

  try {
    const response = await fetch('http://localhost:8788/api/career/recommend-opportunities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: TEST_STUDENT_ID,
        limit: 5,
        forceRefresh: false
      })
    });

    console.log('Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (data.recommendations) {
      console.log(`\n✅ Success! Got ${data.recommendations.length} recommendations`);
      if (data.cached) {
        console.log('📦 From cache');
      } else {
        console.log('🆕 Freshly computed');
      }
      if (data.fallback) {
        console.log(`⚠️  Fallback mode: ${data.fallback}`);
      }
    } else {
      console.log('\n❌ No recommendations returned');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRecommendEndpoint();
