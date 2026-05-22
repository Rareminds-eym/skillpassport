import { supabase } from '@/shared/api/supabaseClient';

/**
 * Debug utility for recent updates functionality
 * Provides comprehensive debugging and testing capabilities
 */

export const debugRecentUpdates = async (userEmail = null) => {
  
  try {
    // Test 1: Check authentication status (via SSO, not Supabase auth)
    const user = useAuthStore.getState().user;
    const authError = null;
    
    if (authError) {
    }
    
    const isAuthenticated = !authError && user;
    
    // Test 1.5: Check current session more thoroughly
    if (isAuthenticated) {
      const user = useAuthStore.getState().user;
    const sessionError = null;
      console.log('Session check:', {
        hasSession: !!session, 
        sessionError: sessionError?.message,
        accessToken: ssoClient.getAccessToken() ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing'
      });
    }
    
    // Test 2: Check recent_updates table structure (public access)
    try {
      // First, try a basic count to see if table exists
      const { count, error: countError } = await supabase
        .from('recent_updates')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Table access error:', countError.message);
        
        // Try to get more specific error info
        if (countError.code === '42P01') {
          console.error('💀 Table does not exist!');
        } else if (countError.code === '42501') {
          console.error('🔒 Permission denied - RLS policy blocking access');
        }
      } else {
        
        // Try to get some sample data structure
        const { data: sampleData, error: sampleError } = await supabase
          .from('recent_updates')
          .select('*')
          .limit(1);
          
        if (sampleData && sampleData.length > 0) {
        } else {
        }
      }
    } catch (tableErr) {
      console.error('❌ Table check failed:', tableErr.message);
    }
    
    // Test 3: Check user-specific data if user is authenticated
    if (isAuthenticated && user) {
      try {
        // Simulate the exact query from useRecentUpdates hook
        const { data: userData, error: userError } = await supabase
          .from('recent_updates')
          .select('*')
          .eq('user_id', user.id);
          
        if (userError) {
          console.error('❌ User data error:', userError.message, {
            code: userError.code,
            details: userError.details,
            hint: userError.hint
          });
        } else {
          
          if (userData && userData.length > 0) {
            if (userData[0].updates) {
              console.log('User updates found:', userData[0].updates.length);
            }
          }
          
          // Test 4: Try the exact .single() query like in the hook
          const { data: singleData, error: singleError } = await supabase
            .from('recent_updates')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (singleError) {
            if (singleError.code === 'PGRST116') {
              console.log('No single row found (PGRST116) - expected for new users');
            }
          } else {
            console.log('Single query result:', singleData);
          }
        }
      } catch (userErr) {
        console.error('❌ User data check failed:', userErr.message);
      }
    } else {
      console.log('User not authenticated, skipping user-specific tests');
    }
    
    // Test 5: Check database configuration and basic connectivity
    try {
      // Test basic connection instead of RLS check
      const { data: connectionTest, error: connError } = await supabase
        .from('recent_updates')
        .select('count', { count: 'exact', head: true });
        
      if (connError) {
        console.error('Connection test error:', connError.message);
      } else {
        console.log('Connection test passed');
      }
    } catch (connErr) {
      console.error('❌ Connection test failed:', connErr.message);
    }
    
    // Test 6: Connection and basic functionality test
    try {
      const { data: connectionTest } = await supabase
        .from('recent_updates')
        .select('count', { count: 'exact', head: true });
    } catch (connErr) {
      console.error('❌ Connection test failed:', connErr.message);
    }
    
    
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
    
    const user = useAuthStore.getState().user;
    const authError = null;
    if (authError || !user) {
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
  const user = useAuthStore.getState().user;
    const authError = null;
  
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
  const user = useAuthStore.getState().user;
    const error = null;
  const user = useAuthStore.getState().user;
  
  
  return { user, session, error };
};

/**
 * Quick recent updates check
 */
export const checkRecentUpdates = async () => {
  const { user } = await checkAuth();
  
  if (!user) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('recent_updates')
      .select('*')
      .eq('user_id', user.id);
      
    
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