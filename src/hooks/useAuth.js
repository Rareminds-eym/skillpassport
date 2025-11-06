import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { checkAuthentication } from '../services/authService';

/**
 * Custom hook for managing authentication state
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check initial authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authResult = await checkAuthentication();
        
        setUser(authResult.user);
        setRole(authResult.role);
        setIsAuthenticated(authResult.isAuthenticated);
        setError(authResult.error || null);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (session && session.user) {
          const userRole = session.user.raw_user_meta_data?.role || 
                          session.user.user_metadata?.role || 
                          null;
          
          setUser(session.user);
          setRole(userRole);
          setIsAuthenticated(true);
          setError(null);
        } else {
          setUser(null);
          setRole(null);
          setIsAuthenticated(false);
        }
        
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Check if user has a specific role
   * @param {string} requiredRole 
   * @returns {boolean}
   */
  const hasRole = (requiredRole) => {
    return role === requiredRole;
  };

  /**
   * Check if user is a student
   * @returns {boolean}
   */
  const isStudent = () => {
    return role === 'student';
  };

  /**
   * Check if user is an educator
   * @returns {boolean}
   */
  const isEducator = () => {
    return role === 'educator';
  };

  /**
   * Check if user is a recruiter
   * @returns {boolean}
   */
  const isRecruiter = () => {
    return role === 'recruiter';
  };

  /**
   * Check if user is an admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return role === 'admin';
  };

  /**
   * Refresh authentication state
   */
  const refresh = async () => {
    setLoading(true);
    try {
      const authResult = await checkAuthentication();
      
      setUser(authResult.user);
      setRole(authResult.role);
      setIsAuthenticated(authResult.isAuthenticated);
      setError(authResult.error || null);
    } catch (err) {
      console.error('Error refreshing auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    role,
    isAuthenticated,
    loading,
    error,
    hasRole,
    isStudent,
    isEducator,
    isRecruiter,
    isAdmin,
    refresh
  };
};

export default useAuth;

