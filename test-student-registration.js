/**
 * Test Student Registration
 * Verifies that student signup creates records in both users and students tables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStudentRegistration() {
  console.log('🧪 Testing Student Registration Fix\n');

  const testEmail = `test-student-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test Student';

  try {
    // Step 1: Check if we can query users table
    console.log('1️⃣ Checking database access...');
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('❌ Cannot access users table:', usersError.message);
      return;
    }
    console.log('✅ Users table accessible\n');

    // Step 2: Check if we can query students table
    console.log('2️⃣ Checking students table access...');
    const { data: studentsCheck, error: studentsError } = await supabase
      .from('students')
      .select('count')
      .limit(1);

    if (studentsError) {
      console.error('❌ Cannot access students table:', studentsError.message);
      return;
    }
    console.log('✅ Students table accessible\n');

    // Step 3: Check colleges table
    console.log('3️⃣ Checking colleges table...');
    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('id, name, city, state')
      .limit(5);

    if (collegesError) {
      console.warn('⚠️ Cannot access colleges table:', collegesError.message);
      console.log('College selection will not work without this table\n');
    } else {
      console.log(`✅ Found ${colleges.length} colleges in database`);
      if (colleges.length > 0) {
        console.log('Sample colleges:');
        colleges.forEach(c => console.log(`  - ${c.name} (${c.city}, ${c.state})`));
      }
      console.log('');
    }

    // Step 4: Test auth signup
    console.log('4️⃣ Testing auth user creation...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'student',
          name: testName,
          phone: '1234567890',
          studentType: 'college'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}\n`);

    // Step 5: Check if user record exists
    console.log('5️⃣ Checking if user record was created...');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('❌ Error checking user record:', userError.message);
    } else if (!userRecord) {
      console.error('❌ User record NOT found in users table');
      console.log('This means the signup modal is not calling completeStudentRegistration()');
    } else {
      console.log('✅ User record found in users table');
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Name: ${userRecord.firstName} ${userRecord.lastName}`);
      console.log(`   Role: ${userRecord.role}`);
      console.log('');
    }

    // Step 6: Check if student record exists
    console.log('6️⃣ Checking if student record was created...');
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError) {
      console.error('❌ Error checking student record:', studentError.message);
    } else if (!studentRecord) {
      console.error('❌ Student record NOT found in students table');
      console.log('This means the signup modal is not calling completeStudentRegistration()');
    } else {
      console.log('✅ Student record found in students table');
      console.log(`   Name: ${studentRecord.name}`);
      console.log(`   Email: ${studentRecord.email}`);
      console.log(`   Phone: ${studentRecord.phone}`);
      console.log(`   Student Type: ${studentRecord.student_type}`);
      console.log(`   College ID: ${studentRecord.college_id || 'Not set'}`);
      console.log('');
    }

    // Step 7: Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`Auth User: ${authData.user ? '✅ Created' : '❌ Failed'}`);
    console.log(`Users Table: ${userRecord ? '✅ Record exists' : '❌ No record'}`);
    console.log(`Students Table: ${studentRecord ? '✅ Record exists' : '❌ No record'}`);
    console.log('');

    if (authData.user && userRecord && studentRecord) {
      console.log('🎉 SUCCESS! Student registration is working correctly!');
      console.log('All three records (auth, users, students) were created.');
    } else if (authData.user && !userRecord && !studentRecord) {
      console.log('❌ FAILURE! Only auth user was created.');
      console.log('The SignupModal is NOT calling completeStudentRegistration().');
      console.log('Please verify the fix was applied correctly.');
    } else {
      console.log('⚠️ PARTIAL SUCCESS! Some records are missing.');
      console.log('Please check the implementation.');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    if (studentRecord) {
      await supabase.from('students').delete().eq('id', studentRecord.id);
      console.log('✅ Deleted test student record');
    }
    if (userRecord) {
      await supabase.from('users').delete().eq('id', userId);
      console.log('✅ Deleted test user record');
    }
    // Note: Auth user cleanup requires admin API, skip for now

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testStudentRegistration();
