/**
 * Test script for User API - College Signup Handlers
 * Tests 3 college signup endpoints
 * 
 * Run with: node test-user-api-college.cjs
 */

const BASE_URL = 'http://localhost:8788/api/user';

// Test data
const testCollegeAdmin = {
  email: `college-admin-${Date.now()}@test.com`,
  password: 'TestPass123!',
  collegeName: 'Test College of Engineering',
  collegeCode: `TCOE${Date.now()}`,
  address: '123 College Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  pincode: '400001',
  phone: '+919876543210',
  website: 'https://testcollege.edu',
  deanName: 'Dr. Jane Smith',
  deanEmail: 'dean@testcollege.edu',
  deanPhone: '+919876543211',
  establishedYear: 1995,
  collegeType: 'Engineering',
  affiliation: 'Mumbai University',
  accreditation: 'NAAC A+',
  dateOfBirth: '1970-05-15',
};

let createdCollegeId = null;

async function testCollegeAdminSignup() {
  console.log('\n🧪 Test 1: College Admin Signup');
  console.log('POST /signup/college-admin');
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCollegeAdmin),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ College admin signup successful');
      console.log('   College ID:', data.data.collegeId);
      console.log('   User ID:', data.data.userId);
      console.log('   College Name:', data.data.collegeName);
      console.log('   College Code:', data.data.collegeCode);
      createdCollegeId = data.data.collegeId;
      return true;
    } else {
      console.log('❌ College admin signup failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testCollegeEducatorSignup() {
  console.log('\n🧪 Test 2: College Educator Signup');
  console.log('POST /signup/college-educator');
  
  if (!createdCollegeId) {
    console.log('⚠️  Skipping - no college ID available');
    return false;
  }
  
  const testEducator = {
    email: `college-educator-${Date.now()}@test.com`,
    password: 'TestPass123!',
    firstName: 'John',
    lastName: 'Doe',
    collegeId: createdCollegeId,
    phone: '+919876543212',
    dateOfBirth: '1985-08-20',
    designation: 'Assistant Professor',
    department: 'Computer Science',
    employeeId: 'EMP001',
    qualification: 'PhD in Computer Science',
    experienceYears: 8,
    specialization: 'Machine Learning',
    dateOfJoining: '2020-07-01',
  };
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-educator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEducator),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ College educator signup successful');
      console.log('   Educator ID:', data.data.educatorId);
      console.log('   User ID:', data.data.userId);
      console.log('   Name:', data.data.name);
      console.log('   College:', data.data.collegeName);
      return true;
    } else {
      console.log('❌ College educator signup failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testCollegeStudentSignup() {
  console.log('\n🧪 Test 3: College Student Signup');
  console.log('POST /signup/college-student');
  
  if (!createdCollegeId) {
    console.log('⚠️  Skipping - no college ID available');
    return false;
  }
  
  const testStudent = {
    email: `college-student-${Date.now()}@test.com`,
    password: 'TestPass123!',
    name: 'Alice Johnson',
    collegeId: createdCollegeId,
    phone: '+919876543213',
    dateOfBirth: '2003-03-15',
    gender: 'Female',
    course: 'B.Tech Computer Science',
    branch: 'Computer Science',
    semester: '3',
    enrollmentNumber: 'CS2022001',
    guardianName: 'Robert Johnson',
    guardianPhone: '+919876543214',
    address: '456 Student Lane',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400002',
  };
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ College student signup successful');
      console.log('   Student ID:', data.data.studentId);
      console.log('   User ID:', data.data.userId);
      console.log('   Name:', data.data.name);
      console.log('   College:', data.data.collegeName);
      return true;
    } else {
      console.log('❌ College student signup failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n🧪 Test 4: Validation - Missing Required Fields');
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      console.log('✅ Validation working - rejected incomplete data');
      console.log('   Error:', data.error);
      return true;
    } else {
      console.log('❌ Validation failed - should reject incomplete data');
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testDuplicateCollegeCode() {
  console.log('\n🧪 Test 5: Validation - Duplicate College Code');
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testCollegeAdmin,
        email: `different-${Date.now()}@test.com`,
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.error && data.error.includes('code')) {
      console.log('✅ Duplicate code validation working');
      console.log('   Error:', data.error);
      return true;
    } else {
      console.log('❌ Should reject duplicate college code');
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testInvalidEmail() {
  console.log('\n🧪 Test 6: Validation - Invalid Email Format');
  
  try {
    const response = await fetch(`${BASE_URL}/signup/college-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testCollegeAdmin,
        email: 'invalid-email',
        collegeCode: `DIFF${Date.now()}`,
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.error && data.error.includes('email')) {
      console.log('✅ Email validation working');
      console.log('   Error:', data.error);
      return true;
    } else {
      console.log('❌ Should reject invalid email format');
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 User API - College Signup Handlers Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Testing against:', BASE_URL);
  console.log('Make sure the dev server is running: npm run pages:dev');
  
  const results = [];
  
  // Core functionality tests
  results.push(await testCollegeAdminSignup());
  results.push(await testCollegeEducatorSignup());
  results.push(await testCollegeStudentSignup());
  
  // Validation tests
  results.push(await testValidation());
  results.push(await testDuplicateCollegeCode());
  results.push(await testInvalidEmail());
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
  }
  
  console.log('\n💡 Note: Created test accounts should be cleaned up from the database');
  console.log('   College ID:', createdCollegeId);
}

// Run tests
runTests().catch(console.error);
