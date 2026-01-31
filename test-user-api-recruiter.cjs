/**
 * Test script for Recruiter signup endpoints
 * Run with: node test-user-api-recruiter.cjs
 */

const BASE_URL = 'http://localhost:8788/api/user';

// Generate unique test data
const timestamp = Date.now();
const testCompanyCode = `COMP${timestamp}`;
const testEmail = `test-recruiter-admin-${timestamp}@example.com`;
const testRecruiterEmail = `test-recruiter-${timestamp}@example.com`;

async function testRecruiterAdminSignup() {
  console.log('\n🧪 Testing Recruiter Admin Signup...');
  
  const response = await fetch(`${BASE_URL}/signup/recruiter-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123456',
      companyName: 'Test Company Inc',
      companyCode: testCompanyCode,
      address: '123 Business St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      phone: '1234567890',
      website: 'https://testcompany.com',
      hrName: 'Test HR Manager',
      hrEmail: testEmail,
      hrPhone: '1234567890',
      industry: 'Technology',
      companySize: '50-100',
      dateOfBirth: '1980-01-01',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('✅ Recruiter Admin signup successful!');
    return data.data.companyId;
  } else {
    console.log('❌ Recruiter Admin signup failed!');
    return null;
  }
}

async function testRecruiterSignup(companyId) {
  console.log('\n🧪 Testing Recruiter Signup...');
  
  if (!companyId) {
    console.log('⚠️  Skipping - no company ID available');
    return;
  }

  const response = await fetch(`${BASE_URL}/signup/recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testRecruiterEmail,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'Recruiter',
      companyId: companyId,
      phone: '9876543210',
      dateOfBirth: '1990-05-15',
      designation: 'Senior Recruiter',
      department: 'Human Resources',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('✅ Recruiter signup successful!');
  } else {
    console.log('❌ Recruiter signup failed!');
  }
}

async function runTests() {
  console.log('🚀 Starting Recruiter Signup Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🔑 Test Company Code:', testCompanyCode);

  try {
    // Test 1: Recruiter Admin Signup
    const companyId = await testRecruiterAdminSignup();

    // Test 2: Recruiter Signup
    await testRecruiterSignup(companyId);

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Run tests
runTests();
