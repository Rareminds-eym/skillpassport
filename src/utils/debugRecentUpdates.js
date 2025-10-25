import { supabase } from '../lib/supabaseClient';

/**
 * Debug utility for recent updates functionality
 * Provides comprehensive debugging and testing capabilities
 */

export const debugRecentUpdates = async (userEmail = null) => {
  console.log('🐛 Starting debug session for recent updates...');
  
  try {
    // Test 1: Check authentication status
    console.log('🔍 Test 1: Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ Auth session missing (this is normal if not logged in):', authError.message);
      console.log('ℹ️ Continuing debug session without authentication...');
    }
    
    const isAuthenticated = !authError && user;
    console.log('✅ Auth status:', isAuthenticated ? `Logged in as ${user.email} (${user.id})` : 'Not authenticated');
    
    // Test 1.5: Check current session more thoroughly
    if (isAuthenticated) {
      console.log('🔍 Test 1.5: Checking session details...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Session info:', { 
        hasSession: !!session, 
        sessionError: sessionError?.message,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing'
      });
    }
    
    // Test 2: Check recent_updates table structure (public access)
    console.log('🔍 Test 2: Checking recent_updates table structure...');
    try {
      // First, try a basic count to see if table exists
      const { count, error: countError } = await supabase
        .from('recent_updates')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Table access error:', countError.message);
        console.log('ℹ️ This might be due to RLS policies or table not existing');
        
        // Try to get more specific error info
        if (countError.code === '42P01') {
          console.error('💀 Table does not exist!');
        } else if (countError.code === '42501') {
          console.error('🔒 Permission denied - RLS policy blocking access');
        }
      } else {
        console.log('✅ Table accessible. Total records:', count);
        
        // Try to get some sample data structure
        const { data: sampleData, error: sampleError } = await supabase
          .from('recent_updates')
          .select('*')
          .limit(1);
          
        if (sampleData && sampleData.length > 0) {
          console.log('📊 Sample record structure:', Object.keys(sampleData[0]));
          console.log('📋 Sample record:', sampleData[0]);
        } else {
          console.log('📝 No records found in table');
        }
      }
    } catch (tableErr) {
      console.error('❌ Table check failed:', tableErr.message);
    }
    
    // Test 3: Check user-specific data if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔍 Test 3: Checking user-specific recent updates...');
      try {
        // Simulate the exact query from useRecentUpdates hook
        console.log('🎯 Simulating useRecentUpdates query...');
        const { data: userData, error: userError } = await supabase
          .from('recent_updates')
          .select('*')
          .eq('user_id', user.id);
          
        if (userError) {
          console.error('❌ User data error:', userError.message);
          console.log('🔍 Error details:', {
            code: userError.code,
            details: userError.details,
            hint: userError.hint
          });
        } else {
          console.log('👤 User query result:', userData);
          console.log('👤 User has', userData?.length || 0, 'recent update records');
          
          if (userData && userData.length > 0) {
            console.log('📋 User record structure:', userData[0]);
            if (userData[0].updates) {
              console.log('📋 Updates data:', userData[0].updates);
            }
          }
          
          // Test 4: Try the exact .single() query like in the hook
          console.log('🎯 Testing .single() query (like in hook)...');
          const { data: singleData, error: singleError } = await supabase
            .from('recent_updates')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (singleError) {
            console.warn('⚠️ Single query error:', singleError.message, singleError.code);
            if (singleError.code === 'PGRST116') {
              console.log('ℹ️ This means no records found for this user (which is expected initially)');
            }
          } else {
            console.log('✅ Single query successful:', singleData);
          }
        }
      } catch (userErr) {
        console.error('❌ User data check failed:', userErr.message);
      }
    } else {
      console.log('ℹ️ Test 3: Skipping user-specific tests (not authenticated)');
      console.log('💡 To test user-specific functionality, please log in first');
    }
    
    // Test 5: Check database configuration and basic connectivity
    console.log('🔍 Test 5: Checking database configuration...');
    try {
      // Test basic connection instead of RLS check
      const { data: connectionTest, error: connError } = await supabase
        .from('recent_updates')
        .select('count', { count: 'exact', head: true });
        
      if (connError) {
        console.warn('⚠️ Connection test issue:', connError.message);
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (connErr) {
      console.log('ℹ️ Connection test failed:', connErr.message);
    }
    
    // Test 6: Connection and basic functionality test
    console.log('🔍 Test 6: Testing basic Supabase connection...');
    try {
      const { data: connectionTest } = await supabase
        .from('recent_updates')
        .select('count', { count: 'exact', head: true });
      console.log('✅ Connection successful');
    } catch (connErr) {
      console.error('❌ Connection test failed:', connErr.message);
    }
    
    console.log('✅ Debug session completed');
    console.log('📋 Summary:');
    console.log(`   • Authentication: ${isAuthenticated ? '✅ Active' : '⚠️ None'}`);
    console.log(`   • Database access: ${await checkTableExists() ? '✅ Available' : '❌ Limited'}`);
    console.log(`   • User data: ${isAuthenticated && user ? (await checkUserHasData(user.id) ? '✅ Found' : '⚠️ Empty') : '➖ N/A'}`);
    
    return true;
    
  } catch (err) {
    console.error('❌ Debug session failed:', err);
    return false;
  }
};

/**
 * Create sample recent updates data for testing
 */
const createSampleRecentUpdates = async (userId) => {
  try {
    console.log('📝 Creating sample recent updates for user:', userId);
    
    const sampleData = {
      updates: [
        {
          id: `debug-${Date.now()}-1`,
          message: "Debug: Profile analytics updated",
          timestamp: "Just now",
          type: "debug"
        },
        {
          id: `debug-${Date.now()}-2`,
          message: "Debug: System health check completed",
          timestamp: "1 minute ago",
          type: "system"
        },
        {
          id: `debug-${Date.now()}-3`,
          message: "Debug: Recent updates functionality tested",
          timestamp: "2 minutes ago",
          type: "test"
        }
      ]
    };
    
    const { data, error } = await supabase
      .from('recent_updates')
      .upsert({
        user_id: userId,
        updates: sampleData
      }, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('❌ Failed to create sample data:', error);
      return false;
    }
    
    console.log('✅ Sample recent updates created:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Error creating sample data:', err);
    return false;
  }
};

/**
 * Clear all recent updates data for debugging
 */
export const clearRecentUpdatesDebugData = async () => {
  try {
    console.log('🧹 Clearing debug recent updates data...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('⚠️ No authenticated user found, cannot clear user-specific data');
      return false;
    }
    
    const { data, error } = await supabase
      .from('recent_updates')
      .delete()
      .eq('user_id', user.id);
      
    if (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
    
    console.log('✅ Debug data cleared successfully');
    return true;
    
  } catch (err) {
    console.error('❌ Error clearing debug data:', err);
    return false;
  }
};

/**
 * Get comprehensive debug info
 */
export const getRecentUpdatesDebugInfo = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  return {
    timestamp: new Date().toISOString(),
    authenticated: !authError && !!user,
    user: (!authError && user) ? { id: user.id, email: user.email } : null,
    authError: authError ? authError.message : null,
    tableExists: await checkTableExists(),
    userHasData: (!authError && user) ? await checkUserHasData(user.id) : null,
    sampleDataCount: await getSampleDataCount()
  };
};

const checkTableExists = async () => {
  try {
    const { error } = await supabase.from('recent_updates').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

const checkUserHasData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('recent_updates')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    return !error && data && data.length > 0;
  } catch {
    return false;
  }
};

const getSampleDataCount = async () => {
  try {
    const { count, error } = await supabase
      .from('recent_updates')
      .select('*', { count: 'exact', head: true });
    return error ? 0 : count;
  } catch {
    return 0;
  }
};

/**
 * Quick auth check function for browser console
 */
export const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('🔍 Quick Auth Check:');
  console.log('  User:', user ? `${user.email} (${user.id})` : 'None');
  console.log('  Session:', session ? 'Active' : 'None');
  console.log('  Error:', error?.message || 'None');
  
  return { user, session, error };
};

/**
 * Quick recent updates check
 */
export const checkRecentUpdates = async () => {
  const { user } = await checkAuth();
  
  if (!user) {
    console.log('❌ No authenticated user for recent updates check');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('recent_updates')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('📋 Recent Updates Check:');
    console.log('  Records found:', data?.length || 0);
    console.log('  Data:', data);
    console.log('  Error:', error?.message || 'None');
    
    return { data, error };
  } catch (err) {
    console.error('❌ Recent updates check failed:', err);
    return null;
  }
};

// Export for browser console debugging
if (typeof window !== 'undefined') {
  window.debugRecentUpdates = debugRecentUpdates;
  window.clearRecentUpdatesDebugData = clearRecentUpdatesDebugData;
  window.getRecentUpdatesDebugInfo = getRecentUpdatesDebugInfo;
  window.checkAuth = checkAuth;
  window.checkRecentUpdates = checkRecentUpdates;
}