/**
 * Test All Signup Endpoints - User API
 * Tests all 12 signup endpoints to verify router configuration
 * 
 * Run with: node test-all-signup-endpoints.cjs
 */

const BASE_URL = 'http://localhost:8788/api/user';

// Generate unique test data
const timestamp = Date.now();

const testCases = [
  {
    name: 'Unified Signup',
    endpoint: '/signup',
    data: {
      email: `unified_${timestamp}@test.com`,
      password: 'Test123456',
      firstName: 'Unified',
      lastName: 'User',
      role: 'school_student',
      phone: `+1555${timestamp.toString().slice(-7)}`,
    }
  },
  {
    name: 'School Admin Signup',
    endpoint: '/signup/school-admin',
    data: {
      email: `school_admin_${timestamp}@test.com`,
      password: 'Test123456',
      schoolName: `Test School ${timestamp}`,
      schoolCode: `SCH${timestamp}`,
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '12345',
      principalName: 'Principal Test',
    }
  },
  {
    name: 'School Educator Signup',
    endpoint: '/signup/educator',
    data: {
      email: `educator_${timestamp}@test.com`,
      password: 'Test123456',
      firstName: 'Educator',
      lastName: 'Test',
      schoolId: '00000000-0000-0000-0000-000000000001', // Dummy ID for test
    }
  },
  {
    name: 'School Student Signup',
    endpoint: '/signup/student',
    data: {
      email: `student_${timestamp}@test.com`,
      password: 'Test123456',
      name: 'Student Test',
      schoolId: '00000000-0000-0000-0000-000000000001', // Dummy ID for test
    }
  },
  {
    name: 'College Admin Signup',
    endpoint: '/signup/college-admin',
    data: {
      email: `college_admin_${timestamp}@test.com`,
      password: 'Test123456',
      collegeName: `Test College ${timestamp}`,
      collegeCode: `COL${timestamp}`,
      address: '456 College Ave',
      city: 'College City',
      state: 'College State',
      pincode: '54321',
      deanName: 'Dean Test',
    }
  },
  {
    name: 'College Educator Signup',
    endpoint: '/signup/college-educator',
    data: {
      email: `college_educator_${timestamp}@test.com`,
      password: 'Test123456',
      firstName: 'College',
      lastName: 'Educator',
      collegeId: '00000000-0000-0000-0000-000000000002', // Dummy ID for test
    }
  },
  {
    name: 'College Student Signup',
    endpoint: '/signup/college-student',
    data: {
      email: `college_student_${timestamp}@test.com`,
      password: 'Test123456',
      name: 'College Student',
      collegeId: '00000000-0000-0000-0000-000000000002', // Dummy ID for test
    }
  },
  {
    name: 'University Admin Signup',
    endpoint: '/signup/university-admin',
    data: {
      email: `university_admin_${timestamp}@test.com`,
      password: 'Test123456',
      universityName: `Test University ${timestamp}`,
      universityCode: `UNI${timestamp}`,
      address: '789 University Blvd',
      city: 'University City',
      state: 'University State',
      pincode: '67890',
      chancellorName: 'Chancellor Test',
    }
  },
  {
    name: 'University Educator Signup',
    endpoint: '/signup/university-educator',
    data: {
      email: `university_educator_${timestamp}@test.com`,
      password: 'Test123456',
      firstName: 'University',
      lastName: 'Educator',
      universityId: '00000000-0000-0000-0000-000000000003', // Dummy ID for test
    }
  },
  {
    name: 'University Student Signup',
    endpoint: '/signup/university-student',
    data: {
      email: `university_student_${timestamp}@test.com`,
      password: 'Test123456',
      name: 'University Student',
      universityId: '00000000-0000-0000-0000-000000000003', // Dummy ID for test
    }
  },
  {
    name: 'Recruiter Admin Signup',
    endpoint: '/signup/recruiter-admin',
    data: {
      email: `recruiter_admin_${timestamp}@test.com`,
      password: 'Test123456',
      companyName: `Test Company ${timestamp}`,
      companyCode: `COM${timestamp}`,
      address: '321 Business St',
      city: 'Business City',
      state: 'Business State',
      pincode: '98765',
      hrName: 'HR Test',
    }
  },
  {
    name: 'Recruiter Signup',
    endpoint: '/signup/recruiter',
    data: {
      email: `recruiter_${timestamp}@test.com`,
      password: 'Test123456',
      firstName: 'Recruiter',
      lastName: 'Test',
      companyId: '00000000-0000-0000-0000-000000000004', // Dummy ID for test
    }
  },
];

async function testEndpoint(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Endpoint: POST ${testCase.endpoint}`);
    
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS (${response.status})`);
      console.log(`   User ID: ${result.userId || result.user?.id || 'N/A'}`);
      return { success: true, name: testCase.name };
    } else {
      console.log(`   ❌ FAILED (${response.status})`);
      console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
      return { success: false, name: testCase.name, error: result.error };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, name: testCase.name, error: error.message };
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 Testing All Signup Endpoints');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Tests: ${testCases.length}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    results.push(result);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${testCases.length}`);
  console.log(`❌ Failed: ${failed.length}/${testCases.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }
  
  if (successful.length === testCases.length) {
    console.log('\n🎉 All signup endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints need attention.');
  }
  
  console.log('='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
