import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { handleAuthError, isJwtExpiryError } from '../utils/authErrorHandler';

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
  const isRefreshing = useRef(false);
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 3;

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
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      } else if (event === 'USER_UPDATED' && currentSession?.user) {
        // Refresh profile when user is updated
        loadUserProfile(currentSession.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

  // Sign up student
  const signUp = async (email, password, studentData = {}) => {
    try {
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: studentData.name || email
          }
        }
      });

      if (authError) throw authError;


      // Note: Student profile will be created automatically via database trigger
      // The trigger handles creating the students record when auth.users record is inserted

      return { data: authData, error: null };
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

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      // Redirect to login
      window.location.href = '/login';
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
