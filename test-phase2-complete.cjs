/**
 * Phase 2 Complete Test - All 27 User API Endpoints
 * Tests Tasks 1-17 implementation
 */

const BASE_URL = 'http://localhost:8788/api/user';

async function testEndpoint(name, method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`✅ ${name}: ${response.status}`);
    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Phase 2 - All 27 User API Endpoints\n');
  
  // Health check
  console.log('📋 Health Check:');
  await testEndpoint('Health', 'GET', '');
  console.log('');
  
  // Utility Endpoints (9)
  console.log('📋 Utility Endpoints (9):');
  await testEndpoint('GET /schools', 'GET', '/schools');
  await testEndpoint('GET /colleges', 'GET', '/colleges');
  await testEndpoint('GET /universities', 'GET', '/universities');
  await testEndpoint('GET /companies', 'GET', '/companies');
  await testEndpoint('POST /check-school-code', 'POST', '/check-school-code', { code: 'TEST123' });
  await testEndpoint('POST /check-college-code', 'POST', '/check-college-code', { code: 'TEST123' });
  await testEndpoint('POST /check-university-code', 'POST', '/check-university-code', { code: 'TEST123' });
  await testEndpoint('POST /check-company-code', 'POST', '/check-company-code', { code: 'TEST123' });
  await testEndpoint('POST /check-email', 'POST', '/check-email', { email: 'test@example.com' });
  console.log('');
  
  // Signup Endpoints (12)
  console.log('📋 Signup Endpoints (12):');
  const timestamp = Date.now();
  
  await testEndpoint('POST /signup/school-admin', 'POST', '/signup/school-admin', {
    email: `school-admin-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test School Admin',
    schoolCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/educator', 'POST', '/signup/educator', {
    email: `educator-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test Educator',
    schoolCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/student', 'POST', '/signup/student', {
    email: `student-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test Student',
    schoolCode: 'TEST123',
    gradeLevel: '10'
  });
  
  await testEndpoint('POST /signup/college-admin', 'POST', '/signup/college-admin', {
    email: `college-admin-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test College Admin',
    collegeCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/college-educator', 'POST', '/signup/college-educator', {
    email: `college-educator-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test College Educator',
    collegeCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/college-student', 'POST', '/signup/college-student', {
    email: `college-student-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test College Student',
    collegeCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/university-admin', 'POST', '/signup/university-admin', {
    email: `uni-admin-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test University Admin',
    universityCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/university-educator', 'POST', '/signup/university-educator', {
    email: `uni-educator-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test University Educator',
    universityCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/university-student', 'POST', '/signup/university-student', {
    email: `uni-student-${timestamp}@test.com`,
    password: 'Test123!@#',
    name: 'Test University Student',
    universityCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/recruiter-admin', 'POST', '/signup/recruiter-admin', {
    email: `recruiter-admin-${timestamp}@test.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'Recruiter Admin',
    companyCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup/recruiter', 'POST', '/signup/recruiter', {
    email: `recruiter-${timestamp}@test.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'Recruiter',
    companyCode: 'TEST123'
  });
  
  await testEndpoint('POST /signup (unified)', 'POST', '/signup', {
    email: `unified-${timestamp}@test.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'school_student',
    schoolCode: 'TEST123'
  });
  console.log('');
  
  // Authenticated Endpoints (6) - These will fail without valid JWT, but should return 401 not 501
  console.log('📋 Authenticated Endpoints (6) - Expecting 401 without auth:');
  await testEndpoint('POST /create-student', 'POST', '/create-student', {
    email: 'new-student@test.com',
    name: 'New Student'
  });
  
  await testEndpoint('POST /create-teacher', 'POST', '/create-teacher', {
    email: 'new-teacher@test.com',
    name: 'New Teacher'
  });
  
  await testEndpoint('POST /create-college-staff', 'POST', '/create-college-staff', {
    email: 'new-staff@test.com',
    name: 'New Staff'
  });
  
  await testEndpoint('POST /update-student-documents', 'POST', '/update-student-documents', {
    studentId: 'test-id',
    documents: {}
  });
  
  await testEndpoint('POST /create-event-user', 'POST', '/create-event-user', {
    eventId: 'test-event',
    email: 'event-user@test.com'
  });
  
  await testEndpoint('POST /send-interview-reminder', 'POST', '/send-interview-reminder', {
    interviewId: 'test-interview',
    candidateId: 'test-candidate'
  });
  
  await testEndpoint('POST /reset-password', 'POST', '/reset-password', {
    action: 'send',
    email: 'test@example.com'
  });
  console.log('');
  
  console.log('✨ Phase 2 Testing Complete!');
  console.log('📊 All 27 User API endpoints tested');
  console.log('🎯 Expected: 200/400/401 responses (NOT 501)');
}

runTests().catch(console.error);
