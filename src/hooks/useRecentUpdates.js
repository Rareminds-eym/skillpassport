import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export const useRecentUpdates = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentUpdates = async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If no user is authenticated, clear data
    if (!user) {
      setRecentUpdates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching recent updates for authenticated user:', user.id);

      // First, get the student_id for this user
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        console.error('❌ Error fetching student:', studentError);
        throw studentError;
      }

      if (!studentData) {
        console.log('⚠️ No student record found for user:', user.id);
        setRecentUpdates([]);
        return;
      }

      console.log('👤 Found student_id:', studentData.id);

      // Fetch recent updates for this student
      const { data: updatesData, error: updatesError } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('student_id', studentData.id)
        .single();

      if (updatesError && updatesError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error fetching recent updates:', updatesError);
        throw updatesError;
      }

      console.log('📢 Raw query result:', { 
        updatesData, 
        updatesError,
        errorCode: updatesError?.code,
        errorMessage: updatesError?.message
      });

      // Handle case when no row is found
      if (updatesError && updatesError.code === 'PGRST116') {
        console.log('⚠️ No recent_updates row found for user_id:', user.id);
        setRecentUpdates([]);
        return;
      }

      if (updatesData && updatesData.updates) {
        console.log('📢 Updates column:', JSON.stringify(updatesData.updates, null, 2));
        
        // Check if updates is an object with an 'updates' array (nested)
        if (updatesData.updates.updates && Array.isArray(updatesData.updates.updates)) {
          console.log('✅ Found nested structure:', updatesData.updates.updates);
          setRecentUpdates(updatesData.updates.updates);
        } 
        // Check if updates is directly an array
        else if (Array.isArray(updatesData.updates)) {
          console.log('✅ Found direct array:', updatesData.updates);
          setRecentUpdates(updatesData.updates);
        }
        else {
          console.log('⚠️ Unexpected structure. Type:', typeof updatesData.updates);
          setRecentUpdates([]);
        }
      } else {
        console.log('📝 No updates column found');
        setRecentUpdates([]);
      }

    } catch (err) {
      console.error('❌ Error in useRecentUpdates:', err);
      setError(err.message);
      setRecentUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUpdates();
  }, [user, authLoading]);

  const refreshRecentUpdates = () => {
    fetchRecentUpdates();
  };

  return {
    recentUpdates,
    loading,
    error,
    refreshRecentUpdates
  };
};