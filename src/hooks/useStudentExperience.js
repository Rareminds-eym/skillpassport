import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentExperience = (studentId, enabled = true) => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperience = async () => {
    if (!studentId || !enabled) {
      console.log('⚠️ useStudentExperience: Skipping fetch', { studentId, enabled });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useStudentExperience: Fetching experience for student:', studentId);

      const { data, error: fetchError } = await supabase
        .from('experience')
        .select('*')
        .eq('student_id', studentId)
        // Fetch ALL experience (including hidden and pending) - filtering happens in display components
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ useStudentExperience: Fetched experience:', {
        count: data?.length || 0,
        experience: data
      });

      // Transform data to match UI expectations
      // Include versioning fields for proper display logic
      const transformedData = data.map(item => ({
        id: item.id,
        organization: item.organization,
        role: item.role,
        startDate: item.start_date,
        endDate: item.end_date,
        start_date: item.start_date,
        end_date: item.end_date,
        duration: item.duration,
        description: item.description,
        // Status and metadata
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        verifiedAt: item.updated_at || item.created_at,
        // Versioning fields - IMPORTANT for pending approval display
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        // Add flag for easy checking in components
        _hasPendingEdit: item.has_pending_edit === true
      }));

      setExperience(transformedData);
    } catch (err) {
      console.error('Error fetching experience:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchExperience();
  };

  return {
    experience,
    loading,
    error,
    refresh
  };
};
