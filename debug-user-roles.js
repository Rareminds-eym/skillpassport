/**
 * Debug script to check user roles in the database
 * Run this to see what roles a user has
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUserRoles(email) {
  console.log(`\n🔍 Checking roles for: ${email}\n`);
  
  // First, get the auth user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: prompt('Enter password: ')
  });

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ User ID: ${userId}\n`);

  const foundRoles = [];

  // Check students table
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!studentError && studentData) {
    console.log('✅ STUDENT role found:');
    console.log('   ID:', studentData.id);
    console.log('   Name:', studentData.name);
    console.log('   Email:', studentData.email);
    console.log('   School ID:', studentData.school_id);
    console.log('   University College ID:', studentData.university_college_id);
    foundRoles.push({ role: 'student', data: studentData });
  } else {
    console.log('❌ No student role');
  }

  // Check recruiters table
  const { data: recruiterData, error: recruiterError } = await supabase
    .from('recruiters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!recruiterError && recruiterData) {
    console.log('\n✅ RECRUITER role found:');
    console.log('   ID:', recruiterData.id);
    console.log('   Name:', recruiterData.name);
    console.log('   Email:', recruiterData.email);
    foundRoles.push({ role: 'recruiter', data: recruiterData });
  } else {
    console.log('❌ No recruiter role');
  }

  // Check school_educators table
  const { data: educatorData, error: educatorError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!educatorError && educatorData) {
    console.log('\n✅ EDUCATOR role found (school_educators):');
    console.log('   ID:', educatorData.id);
    console.log('   Name:', `${educatorData.first_name} ${educatorData.last_name}`);
    console.log('   Email:', educatorData.email);
    console.log('   School ID:', educatorData.school_id);
    foundRoles.push({ role: 'educator', data: educatorData });
  } else {
    console.log('❌ No educator role (school_educators)');
  }

  // Check educators table (fallback)
  const { data: educatorAltData, error: educatorAltError } = await supabase
    .from('educators')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!educatorAltError && educatorAltData) {
    console.log('\n✅ EDUCATOR role found (educators):');
    console.log('   ID:', educatorAltData.id);
    console.log('   Name:', `${educatorAltData.first_name} ${educatorAltData.last_name}`);
    console.log('   Email:', educatorAltData.email);
    if (!foundRoles.find(r => r.role === 'educator')) {
      foundRoles.push({ role: 'educator', data: educatorAltData });
    }
  } else {
    console.log('❌ No educator role (educators)');
  }

  // Check users table for admin roles
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!userError && userData && userData.role) {
    const adminRoles = ['school_admin', 'college_admin', 'university_admin'];
    if (adminRoles.includes(userData.role)) {
      console.log(`\n✅ ADMIN role found: ${userData.role.toUpperCase()}`);
      console.log('   ID:', userData.id);
      console.log('   Name:', userData.name);
      console.log('   Email:', userData.email);
      foundRoles.push({ role: userData.role, data: userData });
    }
  } else {
    console.log('❌ No admin role');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY: Found ${foundRoles.length} role(s)`);
  console.log('='.repeat(50));
  
  if (foundRoles.length === 0) {
    console.log('⚠️  No roles found for this user!');
    console.log('   This user will see an error when trying to log in.');
  } else if (foundRoles.length === 1) {
    console.log(`✅ Single role: ${foundRoles[0].role}`);
    console.log('   User will be logged in directly to their dashboard.');
  } else {
    console.log(`✅ Multiple roles: ${foundRoles.map(r => r.role).join(', ')}`);
    console.log('   User will see role selection screen.');
  }

  console.log('\n');
  
  // Sign out
  await supabase.auth.signOut();
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node debug-user-roles.js <email>');
  console.log('Example: node debug-user-roles.js user@example.com');
  process.exit(1);
}

checkUserRoles(email);
