/**
 * Test script for Career API Job Matches endpoint
 * Tests the Cloudflare worker at VITE_CAREER_API_URL/job-matches
 */

const CAREER_API_URL = 'https://career-api.dark-mode-d021.workers.dev';
const TEST_STUDENT_ID = '95364f0d-23fb-4616-b0f4-48caafee5439'; // gokul@rareminds.in

async function testJobMatchesEndpoint() {
  console.log('='.repeat(60));
  console.log('Testing Career API Job Matches Endpoint');
  console.log('='.repeat(60));
  console.log(`\nAPI URL: ${CAREER_API_URL}`);
  console.log(`Student ID: ${TEST_STUDENT_ID}`);
  
  try {
    // Test 1: Health check
    console.log('\n--- Test 1: Health Check ---');
    const healthResponse = await fetch(`${CAREER_API_URL}/health`);
    console.log(`Health Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health Response:', JSON.stringify(healthData, null, 2));
    }
    
    // Test 2: Recommend Opportunities endpoint (correct endpoint)
    console.log('\n--- Test 2: Recommend Opportunities Endpoint ---');
    const matchesResponse = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: TEST_STUDENT_ID,
        limit: 10
      })
    });
    
    console.log(`Matches Status: ${matchesResponse.status}`);
    
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json();
      console.log(`\nTotal Matches: ${matchesData.matches?.length || 0}`);
      console.log(`From Cache: ${matchesData.fromCache || false}`);
      
      if (matchesData.matches && matchesData.matches.length > 0) {
        console.log('\nTop 5 Job Matches:');
        console.log('-'.repeat(80));
        matchesData.matches.slice(0, 5).forEach((match, index) => {
          console.log(`${index + 1}. ${match.title || match.opportunity_title}`);
          console.log(`   Company: ${match.company_name || match.company || 'N/A'}`);
          console.log(`   Location: ${match.location || 'N/A'}`);
          console.log(`   Match Score: ${((match.final_score || match.match_score || 0) * 100).toFixed(1)}%`);
          console.log('');
        });
      }
    } else {
      const errorText = await matchesResponse.text();
      console.log('Error Response:', errorText);
    }
    
    // Test 3: Test with invalid student ID
    console.log('\n--- Test 3: Invalid Student ID ---');
    const invalidResponse = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: '00000000-0000-0000-0000-000000000000',
        limit: 10
      })
    });
    
    console.log(`Invalid Student Status: ${invalidResponse.status}`);
    const invalidData = await invalidResponse.json().catch(() => ({}));
    console.log('Response:', JSON.stringify(invalidData, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

testJobMatchesEndpoint();
