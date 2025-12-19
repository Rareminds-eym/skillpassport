/**
 * Test Password Update Functionality
 * Run this in browser console while logged in as a student
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testPasswordUpdate() {
  console.log('🧪 Starting password update test...\n');

  // Step 1: Check current session
  console.log('📋 Step 1: Checking current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ No active session:', sessionError);
    return;
  }
  
  console.log('✅ Active session found');
  console.log('   User ID:', session.user.id);
  console.log('   Email:', session.user.email);
  console.log('   Session expires:', new Date(session.expires_at * 1000).toLocaleString());
  console.log('');

  // Step 2: Get current user details
  console.log('📋 Step 2: Getting user details...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Failed to get user:', userError);
    return;
  }
  
  console.log('✅ User details retrieved');
  console.log('   Created:', new Date(user.created_at).toLocaleString());
  console.log('   Updated:', new Date(user.updated_at).toLocaleString());
  console.log('   Last sign in:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A');
  console.log('');

  // Step 3: Prompt for new password
  const newPassword = prompt('Enter NEW password to test (min 8 characters):');
  
  if (!newPassword || newPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    return;
  }

  // Step 4: Attempt password update
  console.log('📋 Step 3: Attempting password update...');
  console.log('   New password length:', newPassword.length);
  
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error('❌ Password update FAILED');
    console.error('   Error code:', updateError.code);
    console.error('   Error message:', updateError.message);
    console.error('   Error status:', updateError.status);
    console.error('   Full error:', updateError);
    return;
  }

  console.log('✅ Password update SUCCESSFUL!');
  console.log('   User updated at:', new Date(updateData.user.updated_at).toLocaleString());
  console.log('');

  // Step 5: Verify session is still valid
  console.log('📋 Step 4: Verifying session after update...');
  const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
  
  if (newSessionError || !newSession) {
    console.error('❌ Session lost after password update!');
    return;
  }
  
  console.log('✅ Session still valid after password update');
  console.log('');

  // Step 6: Instructions for testing login
  console.log('📋 Step 5: Testing new password...');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('1. Open a new INCOGNITO/PRIVATE window');
  console.log('2. Go to: http://localhost:3000/auth/login-student');
  console.log('3. Login with:');
  console.log('   Email:', session.user.email);
  console.log('   Password:', newPassword);
  console.log('4. If login succeeds, password update worked! ✅');
  console.log('5. If login fails, there\'s an issue ❌');
  console.log('');
  console.log('💡 TIP: Your current session is still active, so you don\'t need to log out');
  console.log('');

  // Return test results
  return {
    success: true,
    email: session.user.email,
    newPassword: newPassword,
    updatedAt: updateData.user.updated_at,
  };
}

// Run the test
testPasswordUpdate().then(result => {
  if (result) {
    console.log('✅ Test completed successfully!');
    console.log('📊 Test Results:', result);
  }
}).catch(err => {
  console.error('❌ Test failed with exception:', err);
});
