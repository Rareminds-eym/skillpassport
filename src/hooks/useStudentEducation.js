import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentEducation = (studentId, enabled = true) => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEducation = async () => {
    if (!studentId || !enabled) {
      console.log('⚠️ useStudentEducation: Skipping fetch', { studentId, enabled });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useStudentEducation: Fetching education for student:', studentId);

      const { data, error: fetchError } = await supabase
        .from('education')
        .select('*')
        .eq('student_id', studentId)
        // Fetch ALL education records (including hidden and pending) - filtering happens in display components
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ useStudentEducation: Fetched education:', {
        count: data?.length || 0,
        education: data
      });

      // Transform data to match UI expectations
      // Include versioning fields for proper display logic
      const transformedData = data.map(item => ({
        id: item.id,
        degree: item.degree,
        department: item.department,
        university: item.university,
        institution: item.university, // Alias for compatibility
        yearOfPassing: item.year_of_passing,
        year_of_passing: item.year_of_passing,
        cgpa: item.cgpa,
        level: item.level,
        status: item.status,
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

      setEducation(transformedData);
    } catch (err) {
      console.error('Error fetching education:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchEducation();
  };

  return {
    education,
    loading,
    error,
    refresh
  };
};
