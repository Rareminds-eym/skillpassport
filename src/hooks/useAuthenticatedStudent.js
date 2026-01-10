/**
 * Hook to fetch authenticated student data from Supabase
 * Uses the current authenticated user from Supabase Auth
 */

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabaseClient';

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


        // Use userProfile from auth context if available
        if (userProfile) {
          setStudentData(userProfile);
          setLoading(false);
          return;
        }

        // Otherwise fetch directly from database
        const { data, error: dbError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dbError) {
          console.error('❌ Error fetching student data:', dbError);
          setError(dbError.message);
          setStudentData(null);
        } else if (data) {
          setStudentData(data);
          setError(null);
        } else {
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

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Error updating student data:', error);
        throw error;
      }

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
        .maybeSingle();

      if (error) {
        console.error('❌ Error refreshing student data:', error);
        setError(error.message);
      } else {
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