/**
 * Debug script to test faculty login issues
 * Run this to verify faculty creation and login process
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFacultyLogin() {
  console.log('🔍 Starting Faculty Login Debug...\n');

  // Test email - replace with actual faculty email
  const testEmail = 'test.faculty@example.com';
  
  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth.users (admin API not available)');
      console.log('   This is normal in client-side environment');
    } else {
      const authUser = authUsers.users.find(u => u.email === testEmail);
      console.log(authUser ? '✅ User found in auth.users' : '❌ User NOT found in auth.users');
      if (authUser) {
        console.log(`   User ID: ${authUser.id}`);
        console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   User metadata:`, authUser.user_metadata);
      }
    }

    // 2. Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail);

    if (usersError) {
      console.log('❌ Error checking users table:', usersError.message);
    } else {
      console.log(usersData.length > 0 ? '✅ User found in users table' : '❌ User NOT found in users table');
      if (usersData.length > 0) {
        console.log('   User data:', usersData[0]);
      }
    }

    // 3. Check college_lecturers table
    console.log('\n3️⃣ Checking college_lecturers table...');
    const { data: lecturersData, error: lecturersError } = await supabase
      .from('college_lecturers')
      .select('*')
      .eq('metadata->>email', testEmail);

    if (lecturersError) {
      console.log('❌ Error checking college_lecturers table:', lecturersError.message);
    } else {
      console.log(lecturersData.length > 0 ? '✅ Faculty found in college_lecturers table' : '❌ Faculty NOT found in college_lecturers table');
      if (lecturersData.length > 0) {
        console.log('   Faculty data:', lecturersData[0]);
      }
    }

    // 4. Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'college_lecturers');

    if (policiesError) {
      console.log('❌ Cannot check RLS policies:', policiesError.message);
    } else {
      console.log(`📋 Found ${policies.length} RLS policies for college_lecturers table`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    }

    // 5. Test login attempt
    console.log('\n5️⃣ Testing login attempt...');
    console.log('⚠️  Manual test required:');
    console.log(`   1. Go to login page`);
    console.log(`   2. Use email: ${testEmail}`);
    console.log(`   3. Use the temporary password from faculty creation`);
    console.log(`   4. Check browser console for detailed error messages`);

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Additional helper functions
async function checkFacultyByUserId(userId) {
  console.log(`\n🔍 Checking faculty record for user ID: ${userId}`);
  
  // Check both user_id and userId fields
  const { data: byUserId, error: error1 } = await supabase
    .from('college_lecturers')
    .select('*')
    .eq('user_id', userId);

  const { data: byUserIdCamel, error: error2 } = await supabase
    .from('college_lecturers')
    .select('*')
    .eq('userId', userId);

  console.log('Results by user_id field:', byUserId?.length || 0, 'records');
  console.log('Results by userId field:', byUserIdCamel?.length || 0, 'records');
  
  if (error1) console.log('Error with user_id:', error1.message);
  if (error2) console.log('Error with userId:', error2.message);
}

async function listAllFaculty() {
  console.log('\n📋 Listing all faculty members...');
  
  const { data: faculty, error } = await supabase
    .from('college_lecturers')
    .select('id, employeeId, metadata, accountStatus, createdAt')
    .order('createdAt', { ascending: false })
    .limit(10);

  if (error) {
    console.log('❌ Error listing faculty:', error.message);
  } else {
    console.log(`Found ${faculty.length} faculty members:`);
    faculty.forEach((f, index) => {
      console.log(`   ${index + 1}. ${f.metadata?.first_name} ${f.metadata?.last_name} (${f.metadata?.email})`);
      console.log(`      Employee ID: ${f.employeeId}, Status: ${f.accountStatus}`);
    });
  }
}

// Export functions for manual testing
window.debugFacultyLogin = debugFacultyLogin;
window.checkFacultyByUserId = checkFacultyByUserId;
window.listAllFaculty = listAllFaculty;

console.log('🚀 Faculty Login Debug Script Loaded!');
console.log('📝 Available functions:');
console.log('   - debugFacultyLogin()');
console.log('   - checkFacultyByUserId(userId)');
console.log('   - listAllFaculty()');