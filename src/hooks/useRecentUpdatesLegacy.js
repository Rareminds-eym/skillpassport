import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Legacy hook for Recent Updates that works with email from localStorage
 * This is a temporary solution for backward compatibility
 * TODO: Migrate to full Supabase Auth system
 */
export const useRecentUpdatesLegacy = () => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentUpdates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get email from localStorage (legacy approach)
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.log('⚠️ No userEmail in localStorage');
        setRecentUpdates([]);
        setLoading(false);
        return;
      }

      console.log('📢 [Legacy] Fetching recent updates for email:', userEmail);

      // First, get the student record by email
      // Note: In your schema, students.id IS the auth user id (references auth.users.id)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, email')
        .eq('email', userEmail)
        .single();

      if (studentError) {
        console.error('❌ Error fetching student:', studentError);
        throw studentError;
      }

      if (!studentData) {
        console.log('📝 No student found for email:', userEmail);
        setRecentUpdates([]);
        return;
      }

      console.log('👤 Found student with ID:', studentData.id);

      // Fetch recent updates by student_id
      // In your schema: recent_updates.student_id references students.id (which is the auth user id)
      console.log('🔍 Fetching recent updates for student_id:', studentData.id);
      const { data: updatesData, error: updatesError } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('student_id', studentData.id)
        .single();

      if (updatesError && updatesError.code !== 'PGRST116') {
        console.error('❌ Error fetching recent updates:', updatesError);
        throw updatesError;
      }

      if (updatesData) {
        console.log('✅ Found updates by student_id:', updatesData);
        parseAndSetUpdates(updatesData);
      } else {
        console.log('📝 No recent updates found');
        setRecentUpdates([]);
      }

    } catch (err) {
      console.error('❌ Error in useRecentUpdatesLegacy:', err);
      setError(err.message);
      setRecentUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const parseAndSetUpdates = (updatesData) => {
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
  };

  useEffect(() => {
    fetchRecentUpdates();
  }, []);

  const refreshRecentUpdates = () => {
    console.log('🔄 Manual refresh triggered');
    fetchRecentUpdates();
  };

  return {
    recentUpdates,
    loading,
    error,
    refreshRecentUpdates
  };
};
