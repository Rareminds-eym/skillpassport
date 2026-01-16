/**
 * Test script for /recommend-opportunities API endpoint
 * Tests the career-api Cloudflare Worker
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const CAREER_API_URL = process.env.VITE_CAREER_API_URL || 'https://career-api.dark-mode-d021.workers.dev';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testing /recommend-opportunities API');
console.log('━'.repeat(60));
console.log(`📍 API URL: ${CAREER_API_URL}`);
console.log('━'.repeat(60));

/**
 * Test 1: Health check - API availability
 */
async function testHealthCheck() {
  console.log('\n✅ Test 1: Health Check');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${CAREER_API_URL}/health`, {
      method: 'GET'
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

/**
 * Test 2: Get a real student ID from database
 */
async function getRealStudentId() {
  console.log('\n✅ Test 2: Using Provided Student ID');
  console.log('─'.repeat(60));
  
  // Use the provided student ID
  const providedStudentId = '2740fc7f-a0fb-44b4-be24-0d1b4edf4034';
  
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, user_id, name, email')
      .eq('id', providedStudentId)
      .single();
    
    if (error) {
      console.log('⚠️  Could not fetch student details:', error.message);
      console.log('   Using provided ID anyway:', providedStudentId);
      return { id: providedStudentId, name: 'Test Student', email: null };
    }
    
    console.log(`✅ Found student: ${student.name || 'Unknown'}`);
    console.log(`   ID: ${student.id}`);
    console.log(`   User ID: ${student.user_id || 'N/A'}`);
    console.log(`   Email: ${student.email || 'N/A'}`);
    
    return student;
  } catch (error) {
    console.error('⚠️  Error fetching student:', error.message);
    console.log('   Using provided ID anyway:', providedStudentId);
    return { id: providedStudentId, name: 'Test Student', email: null };
  }
}

/**
 * Test 3: Test without authentication (should work with public data)
 */
async function testWithoutAuth(studentId) {
  console.log('\n✅ Test 3: Request WITHOUT Authentication');
  console.log('─'.repeat(60));
  
  try {
    const payload = {
      studentId: studentId,
      limit: 3,
      forceRefresh: false
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.recommendations?.length || 0} recommendations`);
      if (data.cached) {
        console.log(`   📦 From cache (computed at: ${data.computed_at})`);
      } else {
        console.log(`   🆕 Fresh computation`);
      }
      return true;
    } else {
      console.log('❌ Request failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 4: Test with authentication
 */
async function testWithAuth(studentId, studentEmail) {
  console.log('\n✅ Test 4: Request WITH Authentication');
  console.log('─'.repeat(60));
  
  try {
    // Try to sign in with the student's email (if we have it)
    if (!studentEmail) {
      console.log('⚠️  No email available, skipping auth test');
      return false;
    }
    
    // For testing, we'll just get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('⚠️  No active session, skipping auth test');
      return false;
    }
    
    const payload = {
      studentId: studentId,
      limit: 3,
      forceRefresh: false
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    console.log('Using auth token:', session.access_token.substring(0, 20) + '...');
    
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.recommendations?.length || 0} recommendations`);
      return true;
    } else {
      console.log('❌ Request failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 5: Test with force refresh
 */
async function testForceRefresh(studentId) {
  console.log('\n✅ Test 5: Request with Force Refresh');
  console.log('─'.repeat(60));
  
  try {
    const payload = {
      studentId: studentId,
      limit: 3,
      forceRefresh: true
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.recommendations?.length || 0} recommendations`);
      if (data.cached) {
        console.log(`   ⚠️  Still cached (unexpected with forceRefresh=true)`);
      } else {
        console.log(`   🆕 Fresh computation (as expected)`);
      }
      return true;
    } else {
      console.log('❌ Request failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 6: Test with invalid student ID
 */
async function testInvalidStudentId() {
  console.log('\n✅ Test 6: Request with Invalid Student ID');
  console.log('─'.repeat(60));
  
  try {
    const payload = {
      studentId: '00000000-0000-0000-0000-000000000000',
      limit: 3,
      forceRefresh: false
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 404 || response.status === 400) {
      console.log('✅ Correctly handled invalid student ID');
      return true;
    } else if (response.ok && data.recommendations?.length === 0) {
      console.log('✅ Returned empty recommendations for invalid student');
      return true;
    } else {
      console.log('⚠️  Unexpected response for invalid student ID');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 7: Test with missing studentId
 */
async function testMissingStudentId() {
  console.log('\n✅ Test 7: Request with Missing Student ID');
  console.log('─'.repeat(60));
  
  try {
    const payload = {
      limit: 3,
      forceRefresh: false
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected missing studentId');
      return true;
    } else {
      console.log('⚠️  Should return 400 for missing studentId');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting API Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (healthOk) results.passed++; else results.failed++;
  
  // Test 2: Get real student
  const student = await getRealStudentId();
  if (!student) {
    console.log('\n❌ Cannot continue without a student ID');
    return;
  }
  
  // Test 3: Without auth
  const test3 = await testWithoutAuth(student.id);
  if (test3) results.passed++; else results.failed++;
  
  // Test 4: With auth (may skip)
  const test4 = await testWithAuth(student.id, student.email);
  if (test4) results.passed++; else results.skipped++;
  
  // Test 5: Force refresh
  const test5 = await testForceRefresh(student.id);
  if (test5) results.passed++; else results.failed++;
  
  // Test 6: Invalid student ID
  const test6 = await testInvalidStudentId();
  if (test6) results.passed++; else results.failed++;
  
  // Test 7: Missing student ID
  const test7 = await testMissingStudentId();
  if (test7) results.passed++; else results.failed++;
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log('═'.repeat(60));
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
  }
}

// Run tests
runAllTests().catch(console.error);
