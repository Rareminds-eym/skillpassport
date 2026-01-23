/**
 * Student Authentication Testing Script
 * 
 * This script helps test the student authentication system
 * Run with: node test-student-auth.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test 1: Validate Database Setup
 */
async function testDatabaseSetup() {
  console.log('\n📋 Test 1: Database Setup Validation');
  console.log('=====================================');

  try {
    // Check if students table exists
    const { data, error } = await supabase
      .from('students')
      .select('id, email, user_id, school_id, university_college_id, approval_status')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing students table:', error.message);
      return false;
    }

    console.log('✅ Students table is accessible');
    
    if (data && data.length > 0) {
      const student = data[0];
      console.log(`✅ Sample student found: ${student.email}`);
      console.log(`   - user_id: ${student.user_id ? '✓' : '✗'}`);
      console.log(`   - school_id: ${student.school_id || 'null'}`);
      console.log(`   - university_college_id: ${student.university_college_id || 'null'}`);
      console.log(`   - approval_status: ${student.approval_status}`);
    } else {
      console.log('⚠️  No students found in database');
    }

    return true;
  } catch (error) {
    console.error('❌ Database setup test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Test Student Login
 */
async function testStudentLogin(email, password) {
  console.log('\n🔐 Test 2: Student Login');
  console.log('========================');
  console.log(`Testing with: ${email}`);

  try {
    // Step 1: Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return false;
    }

    console.log('✅ Supabase authentication successful');
    console.log(`   User ID: ${authData.user.id}`);

    // Step 2: Fetch student profile
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          code
        )
      `)
      .eq('user_id', authData.user.id)
      .single();

    if (studentError) {
      console.error('❌ Failed to fetch student profile:', studentError.message);
      await supabase.auth.signOut();
      return false;
    }

    console.log('✅ Student profile retrieved');
    console.log(`   Name: ${studentData.name || 'Not set'}`);
    console.log(`   Email: ${studentData.email}`);
    console.log(`   Approval Status: ${studentData.approval_status}`);

    if (studentData.school_id) {
      console.log(`   School: ${studentData.schools?.school_name || 'Unknown'}`);
    }

    if (studentData.university_college_id) {
      console.log(`   College: ${studentData.university_colleges?.college_name || 'Unknown'}`);
    }

    // Cleanup: Sign out
    await supabase.auth.signOut();
    console.log('✅ Logged out successfully');

    return true;
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Get Students by School
 */
async function testGetStudentsBySchool(schoolId) {
  console.log('\n🏫 Test 3: Get Students by School');
  console.log('==================================');
  console.log(`School ID: ${schoolId}`);

  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, approval_status')
      .eq('school_id', schoolId)
      .eq('approval_status', 'approved');

    if (error) {
      console.error('❌ Failed to fetch students:', error.message);
      return false;
    }

    console.log(`✅ Found ${data.length} approved students`);
    
    if (data.length > 0) {
      console.log('\nStudent List:');
      data.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name || 'No name'} (${student.email})`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Validate Approval Status Check
 */
async function testApprovalStatusCheck() {
  console.log('\n✓ Test 4: Approval Status Validation');
  console.log('=====================================');

  try {
    // Get count of students by approval status
    const statuses = ['pending', 'approved', 'rejected'];
    
    for (const status of statuses) {
      const { data, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', status);

      if (error) {
        console.error(`❌ Error checking ${status} students:`, error.message);
        continue;
      }

      console.log(`   ${status.toUpperCase()}: ${data || 0} students`);
    }

    return true;
  } catch (error) {
    console.error('❌ Approval status test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Verify User-Student Link
 */
async function testUserStudentLink() {
  console.log('\n🔗 Test 5: User-Student Link Verification');
  console.log('==========================================');

  try {
    // Get students without user_id
    const { data: orphanedStudents, error: orphanError } = await supabase
      .from('students')
      .select('id, email')
      .is('user_id', null);

    if (orphanError) {
      console.error('❌ Error checking orphaned students:', orphanError.message);
      return false;
    }

    if (orphanedStudents && orphanedStudents.length > 0) {
      console.log(`⚠️  Found ${orphanedStudents.length} students without user_id:`);
      orphanedStudents.forEach(student => {
        console.log(`   - ${student.email} (ID: ${student.id})`);
      });
      console.log('\n💡 These students need to be linked to auth.users');
    } else {
      console.log('✅ All students have valid user_id links');
    }

    return true;
  } catch (error) {
    console.error('❌ Link verification test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting Student Authentication Tests');
  console.log('=========================================\n');

  const results = {
    databaseSetup: await testDatabaseSetup(),
    approvalStatus: await testApprovalStatusCheck(),
    userStudentLink: await testUserStudentLink()
  };

  // Optional: Test login if credentials provided
  const testEmail = process.env.TEST_STUDENT_EMAIL;
  const testPassword = process.env.TEST_STUDENT_PASSWORD;

  if (testEmail && testPassword) {
    results.login = await testStudentLogin(testEmail, testPassword);
  } else {
    console.log('\n⚠️  Skipping login test (no credentials provided)');
    console.log('   Add TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD to .env to test login');
  }

  // Optional: Test school query if school ID provided
  const testSchoolId = process.env.TEST_SCHOOL_ID;
  if (testSchoolId) {
    results.schoolQuery = await testGetStudentsBySchool(testSchoolId);
  } else {
    console.log('\n⚠️  Skipping school query test (no school ID provided)');
    console.log('   Add TEST_SCHOOL_ID to .env to test school queries');
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const emoji = result ? '✅' : '❌';
    console.log(`${emoji} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\nTotal: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('🎉 All tests passed! Student authentication is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  process.exit(1);
});
