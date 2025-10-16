/**
 * Hook to fetch authenticated student data from Supabase
 * Uses the current authenticated user from Supabase Auth
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export const useAuthenticatedStudent = () => {
  const { user, userProfile, loading: authLoading } = useSupabaseAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If no user is authenticated, clear data
      if (!user) {
        setStudentData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('👤 Fetching authenticated student data for user:', user.id);

        // Use userProfile from auth context if available
        if (userProfile) {
          console.log('✅ Using cached user profile from auth context');
          setStudentData(userProfile);
          setLoading(false);
          return;
        }

        // Otherwise fetch directly from database
        const { data, error: dbError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (dbError) {
          console.error('❌ Error fetching student data:', dbError);
          setError(dbError.message);
          setStudentData(null);
        } else if (data) {
          console.log('✅ Student data fetched successfully:', data);
          setStudentData(data);
          setError(null);
        } else {
          console.warn('⚠️ No student data found for user:', user.id);
          setError('Student profile not found');
          setStudentData(null);
        }

      } catch (err) {
        console.error('❌ Error in useAuthenticatedStudent:', err);
        setError(err.message);
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user, userProfile, authLoading]);

  // Function to update student data
  const updateStudentData = async (updates) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      console.log('🔄 Updating student data:', updates);

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating student data:', error);
        throw error;
      }

      console.log('✅ Student data updated successfully:', data);
      setStudentData(data);
      return { success: true, data };

    } catch (err) {
      console.error('❌ Error in updateStudentData:', err);
      return { success: false, error: err.message };
    }
  };

  // Function to refresh student data
  const refreshStudentData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error refreshing student data:', error);
        setError(error.message);
      } else {
        console.log('✅ Student data refreshed:', data);
        setStudentData(data);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error refreshing student data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    studentData,
    loading,
    error,
    user,
    isAuthenticated: !!user,
    updateStudentData,
    refreshStudentData
  };
};