import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyLoginAndData() {
  console.log('=== VERIFICATION SCRIPT ===\n');

  const testEmail = 'karthikeyan@rareminds.in';
  
  console.log(`1. Checking if educator exists with email: ${testEmail}`);
  const { data: educator, error: educatorError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle();

  if (educatorError) {
    console.error('❌ Error fetching educator:', educatorError);
    return;
  }

  if (!educator) {
    console.log('❌ No educator found with this email');
    return;
  }

  console.log('✅ Educator found!');
  console.log(`   Name: ${educator.first_name} ${educator.last_name || ''}`);
  console.log(`   School ID: ${educator.school_id}`);
  console.log(`   Role: ${educator.role}`);
  console.log(`   Status: ${educator.onboarding_status}`);

  console.log('\n2. Checking school details...');
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('id', educator.school_id)
    .single();

  if (schoolError) {
    console.error('❌ Error fetching school:', schoolError);
  } else {
    console.log('✅ School found!');
    console.log(`   Name: ${school.name}`);
    console.log(`   Code: ${school.code}`);
  }

  console.log('\n3. Checking all educators in this school...');
  const { data: allEducators, error: allError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('school_id', educator.school_id);

  if (allError) {
    console.error('❌ Error fetching all educators:', allError);
  } else {
    console.log(`✅ Found ${allEducators.length} educator(s) in this school:`);
    allEducators.forEach((edu, idx) => {
      console.log(`   ${idx + 1}. ${edu.first_name} ${edu.last_name || ''} (${edu.email}) - ${edu.role}`);
    });
  }

  console.log('\n4. Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', { 
      sql: "SELECT tablename, policyname FROM pg_policies WHERE tablename = 'school_educators'" 
    })
    .catch(() => ({ data: null, error: 'RPC not available' }));

  if (policies) {
    console.log('RLS Policies:', policies);
  } else {
    console.log('⚠️  Cannot check RLS policies (need admin access)');
  }

  console.log('\n=== NEXT STEPS ===');
  console.log('1. Make sure you are logged in with email: karthikeyan@rareminds.in');
  console.log('2. Check browser console for any errors');
  console.log('3. Look for the "Debug Info" section in the UI to verify:');
  console.log(`   - User Email should be: ${testEmail}`);
  console.log(`   - School ID should be: ${educator.school_id}`);
  console.log('4. If School ID shows "Not found", the login email doesn\'t match');
}

verifyLoginAndData().catch(console.error);
