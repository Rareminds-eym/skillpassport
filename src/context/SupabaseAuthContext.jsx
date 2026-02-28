import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { handleAuthError, isJwtExpiryError } from '../utils/authErrorHandler';
import { getGlobalTokenMonitor } from '../utils/tokenMonitor';
import { getGlobalRefreshCoordinator } from '../utils/refreshCoordinator';
import { getGlobalActivityTracker } from '../utils/activityTracker';
import { getGlobalTokenRefreshErrorHandler } from '../utils/tokenRefreshErrorHandler';

/**
 * Enhanced AuthContext with Supabase Integration
 * This integrates authentication with the student data system
 */

const SupabaseAuthContext = createContext(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);
  const isRefreshing = useRef(false);
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  // Initialize Token Monitor, Refresh Coordinator, and Activity Tracker
  const tokenMonitorRef = useRef(null);
  const refreshCoordinatorRef = useRef(null);
  const activityTrackerRef = useRef(null);
  const errorHandlerRef = useRef(null);
  const refreshCallbackUnsubscribeRef = useRef(null);
  const activityCallbackUnsubscribeRef = useRef(null);
  const errorNotificationUnsubscribeRef = useRef(null);

  // Attempt to refresh the session when it becomes invalid
  const attemptSessionRefresh = useCallback(async () => {
    if (isRefreshing.current || refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      return null;
    }

    isRefreshing.current = true;
    refreshAttempts.current += 1;
    
    try {
      console.log('SupabaseAuth: Attempting session refresh...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('SupabaseAuth: Session refresh failed:', error.message);
        return null;
      }
      
      if (data?.session) {
        console.log('SupabaseAuth: Session refreshed successfully');
        refreshAttempts.current = 0; // Reset on success
        
        // Update Token Monitor with new token
        if (tokenMonitorRef.current && data.session.access_token) {
          tokenMonitorRef.current.setToken(data.session.access_token);
        }
        
        return data.session;
      }
      
      return null;
    } catch (err) {
      console.error('SupabaseAuth: Session refresh error:', err);
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize Token Monitor, Refresh Coordinator, and Activity Tracker
    if (!tokenMonitorRef.current) {
      // Note: We'll set isSessionActive after Activity Tracker is initialized
      tokenMonitorRef.current = getGlobalTokenMonitor({
        refreshWindowMs: 5 * 60 * 1000, // 5 minutes
        checkIntervalMs: 60 * 1000, // 60 seconds
      });
    }

    if (!refreshCoordinatorRef.current) {
      // Create refresh function that wraps attemptSessionRefresh
      const refreshFunction = async () => {
        const session = await attemptSessionRefresh();
        if (session) {
          return { data: { session }, error: null };
        }
        return { data: null, error: { message: 'Refresh failed' } };
      };

      refreshCoordinatorRef.current = getGlobalRefreshCoordinator(refreshFunction, {
        maxRetries: 3,
        initialRetryDelayMs: 1000,
        timeoutMs: 10000,
      });
    }

    if (!activityTrackerRef.current) {
      activityTrackerRef.current = getGlobalActivityTracker({
        idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
        trackUIInteractions: true,
      });
    }

    // Initialize error handler
    if (!errorHandlerRef.current) {
      errorHandlerRef.current = getGlobalTokenRefreshErrorHandler();
    }

    // Now that Activity Tracker is initialized, configure Token Monitor with session activity check
    if (tokenMonitorRef.current && activityTrackerRef.current) {
      tokenMonitorRef.current.updateConfig({
        isSessionActive: () => activityTrackerRef.current?.isSessionActive() ?? true,
      });
      console.log('[SupabaseAuth] Token Monitor configured with Activity Tracker integration');
    }

    // Connect Token Monitor refresh events to Refresh Coordinator
    if (tokenMonitorRef.current && refreshCoordinatorRef.current && !refreshCallbackUnsubscribeRef.current) {
      const handleRefreshNeeded = async () => {
        console.log('[SupabaseAuth] Token refresh needed, triggering refresh...');
        
        // Use Refresh Coordinator to handle the refresh
        const result = await refreshCoordinatorRef.current.refreshToken();
        
        if (result.success) {
          console.log('[SupabaseAuth] Proactive token refresh successful');
          // Token Monitor will be updated by attemptSessionRefresh
        } else {
          console.warn('[SupabaseAuth] Proactive token refresh failed:', result.error);
          
          // Handle error with error handler
          if (errorHandlerRef.current) {
            const handleRetry = async () => {
              console.log('[SupabaseAuth] User requested retry');
              setErrorNotification(null);
              const retryResult = await refreshCoordinatorRef.current.refreshToken();
              if (!retryResult.success) {
                // Show error again if retry fails
                errorHandlerRef.current.handleFailure(
                  retryResult.error,
                  1,
                  retryResult.retryable,
                  'Manual retry failed',
                  handleRetry,
                  handleLogin
                );
              }
            };

            const handleLogin = () => {
              console.log('[SupabaseAuth] Redirecting to login due to invalid refresh token');
              setErrorNotification(null);
              // Sign out and redirect to login
              signOut().then(() => {
                window.location.href = '/login';
              });
            };

            errorHandlerRef.current.handleFailure(
              result.error,
              refreshCoordinatorRef.current.getCurrentAttempt() || 1,
              result.retryable,
              'Proactive refresh failed',
              result.retryable ? handleRetry : undefined,
              result.error === 'invalid_refresh_token' ? handleLogin : undefined
            );
          }
        }
      };

      refreshCallbackUnsubscribeRef.current = tokenMonitorRef.current.onRefreshNeeded(handleRefreshNeeded);
    }

    // Connect Activity Tracker to Token Monitor
    if (activityTrackerRef.current && tokenMonitorRef.current && !activityCallbackUnsubscribeRef.current) {
      const handleActivity = (activityType) => {
        console.log(`[SupabaseAuth] Activity detected: ${activityType}`);
        
        // Trigger immediate token check on user activity
        if (activityType === 'message_sent' || activityType === 'ui_interaction') {
          tokenMonitorRef.current.checkNow();
        }
        
        // Trigger check when tab becomes visible after being hidden
        if (activityType === 'tab_visible') {
          console.log('[SupabaseAuth] Tab became visible, checking token validity');
          tokenMonitorRef.current.checkNow();
          
          // Resume monitoring if session is active
          if (activityTrackerRef.current.isSessionActive()) {
            if (!tokenMonitorRef.current.isMonitoring()) {
              console.log('[SupabaseAuth] Resuming token monitoring after tab became visible');
              tokenMonitorRef.current.startMonitoring();
            }
          }
        }
        
        // Pause monitoring when tab is hidden
        if (activityType === 'tab_hidden') {
          console.log('[SupabaseAuth] Tab became hidden, pausing token monitoring');
          tokenMonitorRef.current.stopMonitoring();
        }
        
        // Check if session is idle and pause monitoring if needed
        if (!activityTrackerRef.current.isSessionActive()) {
          if (tokenMonitorRef.current.isMonitoring()) {
            console.log('[SupabaseAuth] Session idle (>30 minutes), pausing token monitoring');
            tokenMonitorRef.current.stopMonitoring();
          }
        } else {
          // Resume monitoring if session becomes active again
          if (!tokenMonitorRef.current.isMonitoring() && activityTrackerRef.current.isTabCurrentlyVisible()) {
            console.log('[SupabaseAuth] Session active again, resuming token monitoring');
            tokenMonitorRef.current.startMonitoring();
          }
        }
      };

      activityCallbackUnsubscribeRef.current = activityTrackerRef.current.onActivity(handleActivity);
    }

    // Subscribe to error notifications
    if (errorHandlerRef.current && !errorNotificationUnsubscribeRef.current) {
      const handleNotification = (notification) => {
        console.log('[SupabaseAuth] Error notification:', notification);
        setErrorNotification(notification);
      };

      errorNotificationUnsubscribeRef.current = errorHandlerRef.current.onNotification(handleNotification);
    }

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('SupabaseAuth: Error getting session:', error);
          
          // If 403 error, try to refresh the session
          if (error.status === 403 || error.message?.includes('403')) {
            console.log('SupabaseAuth: Session invalid (403), attempting refresh...');
            const refreshedSession = await attemptSessionRefresh();
            
            if (refreshedSession && mounted) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
              if (refreshedSession.user) {
                loadUserProfile(refreshedSession.user.id);
              }
              setLoading(false);
              return;
            }
          }
        }

        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          loadUserProfile(initialSession.user.id);
        }

        // Initialize Token Monitor with current token if session exists
        if (initialSession?.access_token && tokenMonitorRef.current) {
          tokenMonitorRef.current.setToken(initialSession.access_token);
          // Start monitoring if user is signed in
          tokenMonitorRef.current.startMonitoring();
          console.log('[SupabaseAuth] Token monitoring started for existing session');
        }

        // Start Activity Tracker if session exists
        if (initialSession && activityTrackerRef.current) {
          activityTrackerRef.current.startTracking();
          console.log('[SupabaseAuth] Activity tracking started for existing session');
        }
      } catch (err) {
        console.error('SupabaseAuth: Initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      
      console.log('SupabaseAuth state changed:', event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset refresh attempts on successful auth events
        refreshAttempts.current = 0;
        // Load/refresh user profile on sign in or token refresh
        if (currentSession?.user) {
          loadUserProfile(currentSession.user.id);
        }

        // Update Token Monitor and start monitoring
        if (tokenMonitorRef.current && currentSession?.access_token) {
          tokenMonitorRef.current.setToken(currentSession.access_token);
          
          // Start monitoring on SIGNED_IN
          if (event === 'SIGNED_IN') {
            tokenMonitorRef.current.startMonitoring();
            console.log('[SupabaseAuth] Token monitoring started on sign in');
          }
        }

        // Start Activity Tracker on SIGNED_IN
        if (event === 'SIGNED_IN' && activityTrackerRef.current) {
          activityTrackerRef.current.startTracking();
          console.log('[SupabaseAuth] Activity tracking started on sign in');
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        
        // Stop monitoring on SIGNED_OUT
        if (tokenMonitorRef.current) {
          tokenMonitorRef.current.stopMonitoring();
          tokenMonitorRef.current.setToken(null);
          console.log('[SupabaseAuth] Token monitoring stopped on sign out');
        }

        // Stop Activity Tracker on SIGNED_OUT
        if (activityTrackerRef.current) {
          activityTrackerRef.current.stopTracking();
          console.log('[SupabaseAuth] Activity tracking stopped on sign out');
        }
      } else if (event === 'USER_UPDATED' && currentSession?.user) {
        // Refresh profile when user is updated
        loadUserProfile(currentSession.user.id);
        
        // Update token in monitor if changed
        if (tokenMonitorRef.current && currentSession?.access_token) {
          tokenMonitorRef.current.setToken(currentSession.access_token);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // Cleanup: unsubscribe from refresh callback
      if (refreshCallbackUnsubscribeRef.current) {
        refreshCallbackUnsubscribeRef.current();
        refreshCallbackUnsubscribeRef.current = null;
      }

      // Cleanup: unsubscribe from activity callback
      if (activityCallbackUnsubscribeRef.current) {
        activityCallbackUnsubscribeRef.current();
        activityCallbackUnsubscribeRef.current = null;
      }

      // Cleanup: unsubscribe from error notifications
      if (errorNotificationUnsubscribeRef.current) {
        errorNotificationUnsubscribeRef.current();
        errorNotificationUnsubscribeRef.current = null;
      }
      
      // Note: We don't destroy the global instances here as they may be used elsewhere
      // They will be cleaned up when the app unmounts
    };
  }, [attemptSessionRefresh]);

  // Load user profile from students table (only for student users)
  const loadUserProfile = async (userId) => {
    try {
      // Query using user_id column, not id
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // PGRST116 means no rows found - this is expected for non-student users (educators, admins)
      if (error) {
        if (error.code === 'PGRST116') {
          return;
        }
        
        // Handle JWT expiration
        if (isJwtExpiryError(error)) {
          await handleAuthError(error);
          return;
        }

        console.error('❌ Error loading user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        // Also store email in localStorage for backward compatibility
        localStorage.setItem('userEmail', data.email);
      }
      // For non-student users, userProfile will remain null - this is expected
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      if (isJwtExpiryError(error)) {
        await handleAuthError(error);
      }
    }
  };

  // Sign up student - uses worker API for proper rollback
  const signUp = async (email, password, studentData = {}) => {
    try {
      // Use the Pages Function API for signup with proper rollback support
      const { getPagesApiUrl } = await import('../utils/pagesUrl');
      const USER_API_URL = getPagesApiUrl('user');
      
      const response = await fetch(`${USER_API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: studentData.firstName || studentData.name?.split(' ')[0] || email.split('@')[0],
          lastName: studentData.lastName || studentData.name?.split(' ').slice(1).join(' ') || '',
          role: studentData.role || 'school_student',
          phone: studentData.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create account');
      }

      // CRITICAL FIX: Auto-login after successful signup
      // This establishes a Supabase session so the user is authenticated
      console.log('🔐 Auto-logging in after signup...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('⚠️ Auto-login failed:', signInError.message);
        // Even if auto-login fails, the account was created successfully
      } else {
        console.log('✅ Auto-login successful, session established');
      }

      // Return in the same format as supabase.auth.signUp
      return { 
        data: { 
          user: { 
            id: result.data.userId, 
            email: result.data.email,
            session: signInData?.session || null
          } 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    try {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;


      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUserProfile(null);
      // Clear localStorage
      localStorage.removeItem('userEmail');
      
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  };

  // Update user profile (only works for student users)
  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return { data: null, error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    errorNotification,
    dismissErrorNotification: () => setErrorNotification(null),
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    resetPassword,
    updatePassword,
    refreshProfile: () => user && loadUserProfile(user.id),
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// Helper HOC for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useSupabaseAuth();
    const navigate = useNavigate();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      // Redirect to login
      navigate('/login');
      return null;
    }

    return <Component {...props} />;
  };
};

// Example usage in a component:
/*
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useStudentData } from '../hooks/useStudentData';

const StudentDashboard = () => {
  const { user, userProfile } = useSupabaseAuth();
  const { studentData, loading } = useStudentData(user?.id);

  return (
    <div>
      <h1>Welcome, {userProfile?.name}</h1>
      {/* Dashboard content *\/}
    </div>
  );
};

export default withAuth(StudentDashboard);
*/
