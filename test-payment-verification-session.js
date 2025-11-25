/**
 * Test Payment Verification Session Handling
 * 
 * This script tests the session retry mechanism for payment verification
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Simulate the session retry mechanism
 */
async function waitForSession(maxRetries = 3, delayMs = 1000) {
  console.log('🔄 Starting session retry mechanism...\n');
  
  for (let i = 0; i < maxRetries; i++) {
    console.log(`Attempt ${i + 1}/${maxRetries}:`);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else if (session?.access_token) {
      console.log(`  ✅ Session found!`);
      console.log(`  User: ${session.user.email}`);
      console.log(`  Token: ${session.access_token.substring(0, 20)}...`);
      return session;
    } else {
      console.log(`  ⚠️  No session available`);
    }
    
    if (i < maxRetries - 1) {
      console.log(`  ⏳ Waiting ${delayMs}ms before retry...\n`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log('\n❌ No session found after all retries');
  return null;
}

/**
 * Test the verification flow
 */
async function testVerificationFlow() {
  console.log('='.repeat(60));
  console.log('Payment Verification Session Test');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Check current session
  console.log('Test 1: Current Session Status');
  console.log('-'.repeat(60));
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  
  if (currentSession) {
    console.log('✅ Active session found');
    console.log(`   User: ${currentSession.user.email}`);
    console.log(`   Role: ${currentSession.user.user_metadata?.role || 'N/A'}`);
  } else {
    console.log('⚠️  No active session');
    console.log('   This simulates the post-redirect scenario');
  }
  console.log();

  // Test 2: Simulate retry mechanism
  console.log('Test 2: Session Retry Mechanism');
  console.log('-'.repeat(60));
  const session = await waitForSession(3, 1000);
  console.log();

  // Test 3: Verify Edge Function accessibility
  if (session) {
    console.log('Test 3: Edge Function Call Simulation');
    console.log('-'.repeat(60));
    console.log('✅ Would call Edge Function with:');
    console.log(`   Authorization: Bearer ${session.access_token.substring(0, 20)}...`);
    console.log(`   User ID: ${session.user.id}`);
    console.log();
  } else {
    console.log('Test 3: Edge Function Call Simulation');
    console.log('-'.repeat(60));
    console.log('❌ Cannot call Edge Function - no session');
    console.log('   Would redirect to login page');
    console.log();
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  if (session) {
    console.log('✅ All tests passed');
    console.log('   Payment verification would succeed');
  } else {
    console.log('⚠️  No session available');
    console.log('   User would be redirected to login');
    console.log('   This is expected if not logged in');
  }
  console.log();
}

// Run tests
testVerificationFlow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
