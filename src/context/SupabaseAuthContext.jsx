import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from students table
  const loadUserProfile = async (userId) => {
    try {
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        // Also store email in localStorage for backward compatibility
        localStorage.setItem('userEmail', data.email);
      } else {
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
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

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');


      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', user.id)
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
