import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // First, check if there's an active Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (session?.user) {
          // Session exists - load user data from localStorage or create from session
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Verify the stored user matches the session user
            // Check user_id (for admins) or id (for regular users) or email
            const userMatches = 
              parsedUser.user_id === session.user.id || 
              parsedUser.id === session.user.id ||
              parsedUser.email === session.user.email;
            
            if (userMatches) {
              setUser(parsedUser);
            } else {
              // Mismatch - clear and use session data
              const userData = {
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'user',
              };
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } else {
            // No stored user but session exists - create user data
            const userData = {
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || 'user',
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          // No session - check for demo users in localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Allow demo users (they don't have Supabase sessions)
            if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
              setUser(parsedUser);
            } else {
              // Real user but no session - clear
              setUser(null);
              localStorage.removeItem('user');
              localStorage.removeItem('userEmail');
            }
          } else {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('userEmail');
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Fallback to localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in - update state
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Check user_id (for admins) or id (for regular users) or email
            const userMatches = 
              parsedUser.user_id === session.user.id || 
              parsedUser.id === session.user.id ||
              parsedUser.email === session.user.email;
            
            if (userMatches) {
              setUser(parsedUser);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out - clear state (but preserve demo users)
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Don't clear demo users
            if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
              return;
            }
          }
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('userEmail');
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed - session is still valid
          console.log('Token refreshed successfully');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
