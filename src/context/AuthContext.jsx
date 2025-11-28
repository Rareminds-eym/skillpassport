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
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing Supabase session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (currentSession) {
          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          if (currentSession.expires_at && currentSession.expires_at < now) {
            // Session expired, clear everything
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            setLoading(false);
            return;
          }

          setSession(currentSession);
          
          // Try to get user data from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (e) {
              console.error('Error parsing user data:', e);
              // Cannot create fallback without role info - require re-login
              await supabase.auth.signOut();
              localStorage.removeItem('user');
              setLoading(false);
              return;
            }
          } else {
            // No stored user data - require re-login to get role
            // We can't determine user role from session alone
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession) {
        setSession(currentSession);
        
        // User data should be set by login function
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        localStorage.removeItem('user');
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        setSession(currentSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // Keep userEmail for backward compatibility with existing code
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear even if signOut fails
      setUser(null);
      setSession(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
    }
  };

  const value = {
    user,
    session,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!session,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
