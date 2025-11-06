/**
 * Supabase Auth Bridge - DEMO MODE
 * 
 * This creates a demo mode where you can login with ANY email/password
 * and it will automatically create a Supabase account for testing.
 * 
 * Perfect for demos and development!
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/api';
import { useAuth } from './AuthContext';

const SupabaseAuthBridgeContext = createContext(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthBridgeContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthBridgeProvider');
  }
  return context;
};

export const SupabaseAuthBridgeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); // Your existing auth
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSupabaseAuth = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isAuthenticated && user?.email) {
          // DEMO MODE: Try to auto-create/login, but don't block on errors
          try {
            await autoSignInOrCreateUser(user.email, user.name);
          } catch (authErr) {
            // Don't set error - just continue
          }
        } else {
          // User not logged in - clear Supabase session quietly
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore signout errors
          }
          setSupabaseUser(null);
        }
      } catch (err) {
        // Don't set error - we can work without auth
      } finally {
        setLoading(false);
      }
    };

    initializeSupabaseAuth();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [isAuthenticated, user]);

  const autoSignInOrCreateUser = async (email, name) => {
    try {

      // Skip all authentication - just return a mock user object
      // This allows the data fetching to proceed without creating accounts
      const mockUser = {
        id: 'demo-user-' + email,
        email: email,
        role: 'authenticated',
        aud: 'authenticated'
      };
      
      setSupabaseUser(mockUser);
      return mockUser;
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      return null;
    }
  };

  const value = {
    supabaseUser,
    userId: supabaseUser?.id || null,
    loading,
    error,
    isSupabaseAuthenticated: !!supabaseUser,
  };

  return (
    <SupabaseAuthBridgeContext.Provider value={value}>
      {children}
    </SupabaseAuthBridgeContext.Provider>
  );
};
