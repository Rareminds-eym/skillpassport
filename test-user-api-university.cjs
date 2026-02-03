/**
 * Test script for University signup endpoints
 * Run with: node test-user-api-university.cjs
 */

const BASE_URL = 'http://localhost:8788/api/user';

// Generate unique test data
const timestamp = Date.now();
const testUniversityCode = `UNIV${timestamp}`;
const testEmail = `test-univ-${timestamp}@example.com`;
const testEducatorEmail = `test-univ-educator-${timestamp}@example.com`;
const testStudentEmail = `test-univ-student-${timestamp}@example.com`;

async function testUniversityAdminSignup() {
  console.log('\n🧪 Testing University Admin Signup...');
  
  const response = await fetch(`${BASE_URL}/signup/university-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123456',
      universityName: 'Test University',
      universityCode: testUniversityCode,
      address: '123 University St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      phone: '1234567890',
      chancellorName: 'Dr. Test Chancellor',
      chancellorEmail: testEmail,
      chancellorPhone: '1234567890',
      establishedYear: 1950,
      accreditation: 'NAAC A+',
      dateOfBirth: '1970-01-01',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('✅ University Admin signup successful!');
    return data.data.universityId;
  } else {
    console.log('❌ University Admin signup failed!');
    return null;
  }
}

async function testUniversityEducatorSignup(universityId) {
  console.log('\n🧪 Testing University Educator Signup...');
  
  if (!universityId) {
    console.log('⚠️  Skipping - no university ID available');
    return;
  }

  const response = await fetch(`${BASE_URL}/signup/university-educator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEducatorEmail,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'Educator',
      universityId: universityId,
      phone: '9876543210',
      dateOfBirth: '1985-05-15',
      designation: 'Professor',
      department: 'Computer Science',
      employeeId: 'EMP001',
      qualification: 'PhD',
      experienceYears: 10,
      specialization: 'Artificial Intelligence',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('✅ University Educator signup successful!');
  } else {
    console.log('❌ University Educator signup failed!');
  }
}

async function testUniversityStudentSignup(universityId) {
  console.log('\n🧪 Testing University Student Signup...');
  
  if (!universityId) {
    console.log('⚠️  Skipping - no university ID available');
    return;
  }

  const response = await fetch(`${BASE_URL}/signup/university-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: 'Test123456',
      name: 'Test Student',
      universityId: universityId,
      phone: '5555555555',
      dateOfBirth: '2002-03-20',
      gender: 'Male',
      course: 'B.Tech',
      branch: 'Computer Science',
      semester: '5',
      rollNumber: 'ROLL001',
      registrationNumber: 'REG001',
      guardianName: 'Test Guardian',
      guardianPhone: '4444444444',
      address: '456 Student St',
      city: 'Test City',
      state: 'Test State',
      pincode: '654321',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.success) {
    console.log('✅ University Student signup successful!');
  } else {
    console.log('❌ University Student signup failed!');
  }
}

async function runTests() {
  console.log('🚀 Starting University Signup Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🔑 Test University Code:', testUniversityCode);

  try {
    // Test 1: University Admin Signup
    const universityId = await testUniversityAdminSignup();

    // Test 2: University Educator Signup
    await testUniversityEducatorSignup(universityId);

    // Test 3: University Student Signup
    await testUniversityStudentSignup(universityId);

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Run tests
runTests();
