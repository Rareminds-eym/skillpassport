import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAdminSchool() {
  const adminEmail = 'info@dpsdelhi.edu.in';
  
  console.log('=== CHECKING SCHOOL ADMIN ACCESS ===\n');
  console.log(`Admin email: ${adminEmail}\n`);

  // Check if admin exists in school_educators
  console.log('1. Checking school_educators table...');
  const { data: adminEducator, error: educatorError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', adminEmail)
    .maybeSingle();

  if (educatorError) {
    console.error('Error:', educatorError);
  }

  if (adminEducator) {
    console.log('✅ Found in school_educators:');
    console.log(`   School ID: ${adminEducator.school_id}`);
    console.log(`   Role: ${adminEducator.role}`);
  } else {
    console.log('❌ NOT found in school_educators');
  }

  // Check if email matches a school
  console.log('\n2. Checking schools table...');
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('email', adminEmail)
    .maybeSingle();

  if (schoolError) {
    console.error('Error:', schoolError);
  }

  if (school) {
    console.log('✅ Found school with this email:');
    console.log(`   School ID: ${school.id}`);
    console.log(`   School Name: ${school.name}`);
    console.log(`   School Code: ${school.code}`);
  } else {
    console.log('❌ NOT found in schools table');
  }

  // Check users table
  console.log('\n3. Checking users table...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', adminEmail)
    .maybeSingle();

  if (userError) {
    console.error('Error:', userError);
  }

  if (user) {
    console.log('✅ Found in users table:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
  } else {
    console.log('❌ NOT found in users table');
  }

  // Find the DPS school
  console.log('\n4. Finding Delhi Public School...');
  const { data: dpsSchool, error: dpsError } = await supabase
    .from('schools')
    .select('*')
    .eq('code', 'DPS001')
    .maybeSingle();

  if (dpsError) {
    console.error('Error:', dpsError);
  }

  if (dpsSchool) {
    console.log('✅ Found DPS:');
    console.log(`   School ID: ${dpsSchool.id}`);
    console.log(`   School Name: ${dpsSchool.name}`);
    console.log(`   School Email: ${dpsSchool.email}`);
    
    // Check educators in this school
    const { data: educators } = await supabase
      .from('school_educators')
      .select('*')
      .eq('school_id', dpsSchool.id);
    
    console.log(`\n   Educators in this school: ${educators?.length || 0}`);
    if (educators && educators.length > 0) {
      educators.forEach((edu, idx) => {
        console.log(`   ${idx + 1}. ${edu.first_name} ${edu.last_name || ''} (${edu.email}) - ${edu.role}`);
      });
    }
  }

  console.log('\n=== SOLUTION ===');
  if (!adminEducator && school) {
    console.log('You need to create a school_educators record for the admin:');
    console.log(`
INSERT INTO school_educators (
  user_id,
  school_id,
  email,
  first_name,
  last_name,
  role,
  onboarding_status,
  account_status
) VALUES (
  '${user?.id || 'USER-ID-HERE'}',
  '${school.id}',
  '${adminEmail}',
  'School',
  'Admin',
  'school_admin',
  'active',
  'active'
);
    `);
  } else if (!adminEducator && !school && dpsSchool) {
    console.log('You need to create a school_educators record linking admin to DPS:');
    console.log(`
INSERT INTO school_educators (
  user_id,
  school_id,
  email,
  first_name,
  last_name,
  role,
  onboarding_status,
  account_status
) VALUES (
  '${user?.id || 'USER-ID-HERE'}',
  '${dpsSchool.id}',
  '${adminEmail}',
  'School',
  'Admin',
  'school_admin',
  'active',
  'active'
);
    `);
  }
}

checkAdminSchool().catch(console.error);
