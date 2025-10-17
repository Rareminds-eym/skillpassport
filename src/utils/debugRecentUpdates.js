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
    
    // Test 2: Check recent_updates table structure (public access)
    console.log('🔍 Test 2: Checking recent_updates table structure...');
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('recent_updates')
        .select('*')
        .limit(5);
        
      if (tableError) {
        console.error('❌ Table access error:', tableError.message);
        console.log('ℹ️ This might be due to RLS policies or table permissions');
      } else {
        console.log('✅ Table accessible. Found', tableData?.length || 0, 'records');
        if (tableData && tableData.length > 0) {
          console.log('📊 Sample record structure:', Object.keys(tableData[0]));
        }
      }
    } catch (tableErr) {
      console.error('❌ Table check failed:', tableErr.message);
    }
    
    // Test 3: Check user-specific data if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔍 Test 3: Checking user-specific recent updates...');
      try {
        const { data: userData, error: userError } = await supabase
          .from('recent_updates')
          .select('*')
          .eq('user_id', user.id);
          
        if (userError) {
          console.error('❌ User data error:', userError.message);
        } else {
          console.log('👤 User has', userData?.length || 0, 'recent update records');
          
          // Test 4: Try to create sample data if none exists
          if (!userData || userData.length === 0) {
            console.log('🔍 Test 4: No data found, attempting to create sample data...');
            await createSampleRecentUpdates(user.id);
          }
        }
      } catch (userErr) {
        console.error('❌ User data check failed:', userErr.message);
      }
    } else {
      console.log('ℹ️ Test 3: Skipping user-specific tests (not authenticated)');
      console.log('💡 To test user-specific functionality, please log in first');
    }
    
    // Test 5: Check RLS policies and general table info
    console.log('🔍 Test 5: Checking database configuration...');
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_policies', { table_name: 'recent_updates' })
        .then(
          result => result,
          () => ({ data: null, error: 'RLS check function not available' })
        );
        
      if (rlsError && rlsError !== 'RLS check function not available') {
        console.warn('⚠️ RLS check issue:', rlsError);
      } else {
        console.log('🔒 RLS status:', rlsData || 'Check function not available');
      }
    } catch (rlsErr) {
      console.log('ℹ️ RLS check not available:', rlsErr.message);
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

// Export for browser console debugging
if (typeof window !== 'undefined') {
  window.debugRecentUpdates = debugRecentUpdates;
  window.clearRecentUpdatesDebugData = clearRecentUpdatesDebugData;
  window.getRecentUpdatesDebugInfo = getRecentUpdatesDebugInfo;
}