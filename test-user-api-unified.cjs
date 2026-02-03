/**
 * Test script for Unified signup endpoint
 * Run with: node test-user-api-unified.cjs
 */

const BASE_URL = 'http://localhost:8788/api/user';

// Generate unique test data
const timestamp = Date.now();

async function testUnifiedSignup(role, additionalData = {}) {
  console.log(`\n🧪 Testing Unified Signup for role: ${role}...`);
  
  const testEmail = `test-unified-${role}-${timestamp}@example.com`;
  
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User',
      role: role,
      phone: `${timestamp}`.slice(-10),
      dateOfBirth: '1995-01-01',
      country: 'India',
      state: 'Test State',
      city: 'Test City',
      preferredLanguage: 'en',
      ...additionalData,
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log(`✅ Unified signup successful for ${role}!`);
    return true;
  } else {
    console.log(`❌ Unified signup failed for ${role}!`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Unified Signup Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🔑 Timestamp:', timestamp);

  try {
    // Test different roles
    const roles = [
      'school_student',
      'college_student',
      'school_educator',
      'college_educator',
      'recruiter',
      'school_admin',
      'college_admin',
      'university_admin',
    ];

    let successCount = 0;
    for (const role of roles) {
      const success = await testUnifiedSignup(role);
      if (success) successCount++;
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✨ Tests completed: ${successCount}/${roles.length} successful`);
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Run tests
runTests();
