/**
 * Debug script to identify the subscription redirect loop issue
 * 
 * ISSUE ANALYSIS:
 * After signup, users are redirected to subscription plans page.
 * When they click "Get Started", they're redirected back to signup instead of payment.
 * 
 * ROOT CAUSE:
 * The handlePlanSelection function in SubscriptionPlans.jsx checks `isAuthenticated`
 * but there's a timing issue where the authentication state hasn't fully loaded
 * or the user session is not properly established after signup.
 */

import { supabase } from './src/lib/supabaseClient.ts';

async function debugAuthState() {
  console.log('🔍 Debugging Authentication State...\n');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('📋 Session Check:');
    console.log('- Session exists:', !!session);
    console.log('- Session error:', sessionError?.message || 'None');
    
    if (session) {
      console.log('- User ID:', session.user.id);
      console.log('- Email:', session.user.email);
      console.log('- User metadata:', JSON.stringify(session.user.user_metadata, null, 2));
      console.log('- Raw metadata:', JSON.stringify(session.user.raw_user_meta_data, null, 2));
      
      // Check role extraction logic (same as in authService.js)
      const role = session.user.user_metadata?.user_role ||
                  session.user.user_metadata?.role ||
                  session.user.raw_user_meta_data?.user_role ||
                  session.user.raw_user_meta_data?.role ||
                  null;
      
      console.log('- Extracted role:', role);
      
      // Check if user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, firstName, lastName, phone, email, role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      console.log('\n📊 Database User Check:');
      console.log('- User in database:', !!userData);
      console.log('- Database error:', userError?.message || 'None');
      
      if (userData) {
        console.log('- Database role:', userData.role);
        console.log('- Name:', `${userData.firstName} ${userData.lastName}`);
        console.log('- Phone:', userData.phone);
      }
      
      // Check subscription status
      try {
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        console.log('\n💳 Subscription Check:');
        console.log('- Has subscription:', !!subscriptionData);
        console.log('- Subscription error:', subError?.message || 'None');
        
        if (subscriptionData) {
          console.log('- Status:', subscriptionData.status);
          console.log('- Plan:', subscriptionData.plan);
          console.log('- End date:', subscriptionData.endDate);
        }
      } catch (subErr) {
        console.log('\n💳 Subscription Check: Error -', subErr.message);
      }
      
    } else {
      console.log('❌ No active session found');
    }
    
    console.log('\n🔧 POTENTIAL ISSUES:');
    console.log('1. Session exists but role is null/undefined');
    console.log('2. User exists in auth but not in database');
    console.log('3. Authentication state loading timing issue');
    console.log('4. localStorage vs session mismatch');
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('1. Add loading state check in handlePlanSelection');
    console.log('2. Add user database validation before allowing payment');
    console.log('3. Add retry logic for authentication state');
    console.log('4. Improve error handling in subscription flow');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugAuthState();