/**
 * Debug script to check student settings password issue
 * This will help identify:
 * 1. What email is stored in localStorage
 * 2. What email is in the auth.users table
 * 3. What email is in the students table
 * 4. Whether password verification works
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugStudentSettings() {
  console.log('\n🔍 DEBUGGING STUDENT SETTINGS PASSWORD ISSUE\n');
  console.log('='.repeat(60));

  // Step 1: Check what's in localStorage (simulated - you need to check browser)
  console.log('\n📋 Step 1: Check Browser localStorage');
  console.log('   Please check in your browser console:');
  console.log('   - localStorage.getItem("user")');
  console.log('   - localStorage.getItem("userEmail")');
  console.log('   Copy the email value here for testing...\n');

  // For testing, let's use a sample email - REPLACE THIS with actual email from browser
  const testEmail = 'student@example.com'; // ⚠️ REPLACE WITH ACTUAL EMAIL
  console.log(`   Using test email: ${testEmail}`);

  // Step 2: Check auth.users table
  console.log('\n📋 Step 2: Check auth.users table');
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  
  if (sessionError) {
    console.log('   ❌ No active session:', sessionError.message);
    console.log('   This means the user is not logged in to Supabase Auth');
  } else if (user) {
    console.log('   ✅ Active Supabase session found:');
    console.log('      User ID:', user.id);
    console.log('      Email:', user.email);
    console.log('      Email Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('      Created:', user.created_at);
    console.log('      Last Sign In:', user.last_sign_in_at);
  } else {
    console.log('   ⚠️ No active session - user needs to log in');
  }

  // Step 3: Check students table
  console.log('\n📋 Step 3: Check students table');
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, email, name, contactNumber, created_at')
    .eq('email', testEmail);

  if (studentsError) {
    console.log('   ❌ Error querying students table:', studentsError.message);
  } else if (students && students.length > 0) {
    console.log('   ✅ Student record found:');
    students.forEach((student, idx) => {
      console.log(`      Record ${idx + 1}:`);
      console.log('         ID:', student.id);
      console.log('         Email:', student.email);
      console.log('         Name:', student.name);
      console.log('         Phone:', student.contactNumber);
      console.log('         Created:', student.created_at);
    });
    
    if (students.length > 1) {
      console.log('   ⚠️ WARNING: Multiple student records found for same email!');
    }
  } else {
    console.log('   ❌ No student record found for email:', testEmail);
  }

  // Step 4: Test password verification flow
  console.log('\n📋 Step 4: Test Password Verification');
  console.log('   To test password verification, you need to:');
  console.log('   1. Know the current password');
  console.log('   2. Try signing in with it');
  console.log('\n   Example test (replace with actual credentials):');
  console.log('   const testPassword = "your-current-password";');
  console.log('   const { data, error } = await supabase.auth.signInWithPassword({');
  console.log('     email: "student@example.com",');
  console.log('     password: testPassword');
  console.log('   });');

  // Step 5: Check for email mismatches
  console.log('\n📋 Step 5: Common Issues to Check');
  console.log('   ❓ Is the email in localStorage different from auth.users?');
  console.log('   ❓ Is the email in students table different from auth.users?');
  console.log('   ❓ Are there multiple student records with same email?');
  console.log('   ❓ Is the user logged in with a different account?');
  console.log('   ❓ Was the password recently changed in Supabase Auth directly?');

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 SOLUTION STEPS:\n');
  console.log('1. Check browser console for localStorage values');
  console.log('2. Compare emails across all three sources');
  console.log('3. If emails don\'t match, the password verification will fail');
  console.log('4. The password is stored in auth.users, NOT in students table');
  console.log('5. The Settings page uses user.email from AuthContext');
  console.log('6. Make sure the logged-in user email matches the student record\n');
}

// Run the debug
debugStudentSettings().catch(console.error);
