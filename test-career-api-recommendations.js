// Test career-api recommendations endpoint
const CAREER_API_URL = 'https://career-api.dark-mode-d021.workers.dev';
const STUDENT_ID = '95364f0d-23fb-4616-b0f4-48caafee5439';

async function testRecommendations() {
  console.log('Testing career-api /recommend-opportunities endpoint...\n');
  
  try {
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: STUDENT_ID,
        limit: 5,
        forceRefresh: true
      })
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\nFull response:', JSON.stringify(data, null, 2));
    
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\n=== TOP RECOMMENDATIONS ===');
      data.recommendations.forEach((rec, idx) => {
        console.log(`\n${idx + 1}. ${rec.job_title || rec.title}`);
        console.log(`   Company: ${rec.company_name || rec.company || 'N/A'}`);
        console.log(`   Similarity: ${(rec.similarity * 100).toFixed(1)}%`);
        console.log(`   ID: ${rec.id}`);
      });
    } else {
      console.log('\nNo recommendations returned');
      console.log('Fallback:', data.fallback);
      console.log('Reason:', data.reason);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRecommendations();
