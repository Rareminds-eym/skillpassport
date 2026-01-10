import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCurrentUser() {
  console.log('🔍 Checking current user and college ID...\n');

  // Get current user from auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ No user logged in or auth error:', authError?.message);
    return;
  }

  console.log('✅ Current user:', {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata,
  });

  // Check in college_lecturers
  console.log('\n📚 Checking college_lecturers table...');
  const { data: lecturerData, error: lecturerError } = await supabase
    .from('college_lecturers')
    .select('id, collegeId, email, first_name, last_name, metadata')
    .eq('email', user.email)
    .maybeSingle();

  if (lecturerError) {
    console.log('❌ Error querying college_lecturers:', lecturerError.message);
  } else if (lecturerData) {
    console.log('✅ Found in college_lecturers:', lecturerData);
  } else {
    console.log('⚠️  Not found in college_lecturers');
  }

  // Check in colleges table by email
  console.log('\n🏫 Checking colleges table (email)...');
  const { data: collegeByEmail, error: collegeEmailError } = await supabase
    .from('colleges')
    .select('id, name, email, admin_email')
    .eq('email', user.email)
    .maybeSingle();

  if (collegeEmailError) {
    console.log('❌ Error:', collegeEmailError.message);
  } else if (collegeByEmail) {
    console.log('✅ Found college by email:', collegeByEmail);
  } else {
    console.log('⚠️  Not found by email');
  }

  // Check in colleges table by admin_email
  console.log('\n🏫 Checking colleges table (admin_email)...');
  const { data: collegeByAdmin, error: collegeAdminError } = await supabase
    .from('colleges')
    .select('id, name, email, admin_email')
    .eq('admin_email', user.email)
    .maybeSingle();

  if (collegeAdminError) {
    console.log('❌ Error:', collegeAdminError.message);
  } else if (collegeByAdmin) {
    console.log('✅ Found college by admin_email:', collegeByAdmin);
  } else {
    console.log('⚠️  Not found by admin_email');
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  const collegeId = lecturerData?.collegeId || collegeByEmail?.id || collegeByAdmin?.id;
  if (collegeId) {
    console.log('✅ College ID found:', collegeId);
  } else {
    console.log('❌ No college ID found for this user');
    console.log('\n💡 SOLUTION: Add this user to college_lecturers or colleges table');
  }
}

checkCurrentUser().catch(console.error);
