import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserManagementFetch() {
  console.log('🔍 Testing User Management Data Fetch\n');

  // Test 1: Check college_lecturers table
  console.log('1️⃣ Fetching college_lecturers...');
  const { data: lecturers, error: lecturersError } = await supabase
    .from('college_lecturers')
    .select('*')
    .limit(5);

  if (lecturersError) {
    console.error('❌ Error fetching lecturers:', lecturersError);
  } else {
    console.log(`✅ Found ${lecturers?.length || 0} lecturers`);
    if (lecturers && lecturers.length > 0) {
      console.log('Sample lecturer:', JSON.stringify(lecturers[0], null, 2));
    }
  }

  // Test 2: Check college_lecturers with users join (using userId)
  console.log('\n2️⃣ Fetching college_lecturers with users join (userId)...');
  const { data: lecturersWithUsers1, error: joinError1 } = await supabase
    .from('college_lecturers')
    .select(`
      id,
      userId,
      employeeId,
      department,
      accountStatus,
      users!college_lecturers_userId_fkey (
        id,
        email,
        full_name
      )
    `)
    .limit(5);

  if (joinError1) {
    console.error('❌ Error with userId join:', joinError1);
  } else {
    console.log(`✅ Found ${lecturersWithUsers1?.length || 0} lecturers with users (userId)`);
    if (lecturersWithUsers1 && lecturersWithUsers1.length > 0) {
      console.log('Sample:', JSON.stringify(lecturersWithUsers1[0], null, 2));
    }
  }

  // Test 3: Check college_lecturers with users join (using user_id)
  console.log('\n3️⃣ Fetching college_lecturers with users join (user_id)...');
  const { data: lecturersWithUsers2, error: joinError2 } = await supabase
    .from('college_lecturers')
    .select(`
      id,
      user_id,
      employeeId,
      department,
      accountStatus,
      users!fk_college_lecturers_user (
        id,
        email,
        full_name
      )
    `)
    .limit(5);

  if (joinError2) {
    console.error('❌ Error with user_id join:', joinError2);
  } else {
    console.log(`✅ Found ${lecturersWithUsers2?.length || 0} lecturers with users (user_id)`);
    if (lecturersWithUsers2 && lecturersWithUsers2.length > 0) {
      console.log('Sample:', JSON.stringify(lecturersWithUsers2[0], null, 2));
    }
  }

  // Test 4: Check students table
  console.log('\n4️⃣ Fetching students...');
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      user_id,
      email,
      name,
      student_id,
      college_id,
      grade,
      section,
      roll_number,
      is_deleted
    `)
    .eq('is_deleted', false)
    .limit(5);

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
  } else {
    console.log(`✅ Found ${students?.length || 0} students`);
    if (students && students.length > 0) {
      console.log('Sample student:', JSON.stringify(students[0], null, 2));
    }
  }

  // Test 5: Check users table structure
  console.log('\n5️⃣ Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(3);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
  } else {
    console.log(`✅ Found ${users?.length || 0} users`);
    if (users && users.length > 0) {
      console.log('Sample user:', JSON.stringify(users[0], null, 2));
    }
  }

  // Test 6: Try the actual service query
  console.log('\n6️⃣ Testing actual service query...');
  const { data: serviceTest, error: serviceError } = await supabase
    .from('college_lecturers')
    .select(`
      id,
      userId,
      user_id,
      collegeId,
      employeeId,
      department,
      specialization,
      qualification,
      experienceYears,
      dateOfJoining,
      accountStatus,
      createdAt,
      updatedAt,
      users!college_lecturers_userId_fkey (
        id,
        email,
        full_name
      )
    `);

  if (serviceError) {
    console.error('❌ Service query error:', serviceError);
  } else {
    console.log(`✅ Service query returned ${serviceTest?.length || 0} results`);
    if (serviceTest && serviceTest.length > 0) {
      console.log('First result:', JSON.stringify(serviceTest[0], null, 2));
    }
  }
}

testUserManagementFetch().catch(console.error);
