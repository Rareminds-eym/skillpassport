import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to restore user from localStorage
  const restoreUserFromStorage = useCallback((sessionUser) => {
    // Always get the latest role from session metadata - check user_role first (set by UnifiedSignup)
    let sessionRole = sessionUser.user_metadata?.user_role 
      || sessionUser.user_metadata?.role 
      || 'user';
    
    console.log('🔍 [AuthContext] restoreUserFromStorage:', {
      userId: sessionUser.id,
      email: sessionUser.email,
      user_metadata: sessionUser.user_metadata,
      sessionRole,
    });
    
    // Handle legacy "admin" role - preserve the stored user's role if it's more specific
    // This allows both school_admin and college_admin to work with "admin" in metadata
    const storedUser = localStorage.getItem('user');
    if (storedUser && sessionRole === 'admin') {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userMatches = 
          parsedUser.user_id === sessionUser.id || 
          parsedUser.id === sessionUser.id ||
          parsedUser.email === sessionUser.email;
        
        if (userMatches && parsedUser.role && 
            ['school_admin', 'college_admin', 'university_admin'].includes(parsedUser.role)) {
          // Use the more specific role from localStorage instead of generic "admin"
          console.log('🔄 Using stored admin role:', parsedUser.role, 'instead of generic "admin"');
          sessionRole = parsedUser.role;
        }
      } catch (e) {
        console.warn('Failed to parse stored user for admin role mapping:', e);
      }
    }
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userMatches = 
          parsedUser.user_id === sessionUser.id || 
          parsedUser.id === sessionUser.id ||
          parsedUser.email === sessionUser.email;
        
        if (userMatches) {
          // Always update role from session to ensure it's current
          return {
            ...parsedUser,
            role: sessionRole,
          };
        }
      } catch (e) {
        console.warn('Failed to parse stored user:', e);
      }
    }
    
    // Create new user data from session
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionRole,
    };
  }, []);

  // Check if session is valid without manual refresh (Supabase handles auto-refresh)
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return null;
      }
      
      return session;
    } catch (err) {
      console.error('Session validity check failed:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize auth state (trust Supabase auto-refresh)
    const initializeAuth = async () => {
      try {
        // Check if there's an active Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (!mounted) return;

        if (session?.user) {
          // Session exists - load user data from localStorage or create from session
          const userData = restoreUserFromStorage(session.user);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // No session - clear any stale user data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Only allow demo users without a session
              if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
                setUser(parsedUser);
              } else {
                // Real user but no session - clear stale data
                console.warn('⚠️ Clearing stale user data - no valid Supabase session');
                setUser(null);
                localStorage.removeItem('user');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('pendingUser');
              }
            } catch (e) {
              console.warn('Failed to parse stored user:', e);
              setUser(null);
              localStorage.removeItem('user');
              localStorage.removeItem('pendingUser');
            }
          } else {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('pendingUser');
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (!mounted) return;
        
        // Fallback to localStorage for demo users only
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
              setUser(parsedUser);
            }
          } catch (e) {
            console.warn('Failed to parse stored user:', e);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if faculty onboarding is in progress and this is a new user being created
          if (typeof window !== 'undefined' && window.facultyOnboardingInProgress) {
            const newUserRole = session.user.user_metadata?.role || session.user.user_metadata?.user_role;
            if (newUserRole === 'college_educator') {
              return;
            }
          }
          
          // User signed in - update state
          const userData = restoreUserFromStorage(session.user);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (event === 'SIGNED_OUT') {
          // User signed out - clear state (but preserve demo users)
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Don't clear demo users
              if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
                return;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('userEmail');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token automatically refreshed by Supabase - update user state
          console.log('✅ Token auto-refreshed by Supabase');
          
          // Update user state to ensure consistency
          const userData = restoreUserFromStorage(session.user);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (event === 'USER_UPDATED' && session?.user) {
          // User data updated - refresh stored user data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Update with latest session data - but preserve specific admin roles
              let role = session.user.user_metadata?.user_role 
                || session.user.user_metadata?.role 
                || parsedUser.role;
              
              // Handle legacy "admin" role - preserve the stored user's role if it's more specific
              if (role === 'admin' && parsedUser.role && 
                  ['school_admin', 'college_admin', 'university_admin'].includes(parsedUser.role)) {
                console.log('🔄 Using stored admin role:', parsedUser.role, 'instead of generic "admin"');
                role = parsedUser.role;
              }
              
              const updatedUser = {
                ...parsedUser,
                email: session.user.email,
                role: role,
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {
              // If parse fails, create new user data
              const userData = restoreUserFromStorage(session.user);
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [restoreUserFromStorage]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    checkSessionValidity, // Expose session check utility
  }), [user, loading, checkSessionValidity]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
