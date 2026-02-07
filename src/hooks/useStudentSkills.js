import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentSkills = (studentId, skillType, enabled = true) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSkills = async () => {
    if (!studentId || !enabled) {
      console.log(`⚠️ useStudentSkills (${skillType}): Skipping fetch`, { studentId, enabled });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 useStudentSkills (${skillType}): Fetching skills for student:`, studentId);

      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', skillType)
        .is('training_id', null)
        // Fetch ALL skills (including hidden and pending) - filtering happens in display components
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log(`✅ useStudentSkills (${skillType}): Fetched skills:`, {
        count: data?.length || 0,
        skills: data
      });

      // Transform data to match UI expectations
      // Include versioning fields for proper display logic
      const transformedData = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        level: item.level,
        description: item.description,
        // Status and metadata
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Versioning fields - IMPORTANT for pending approval display
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        // Add flag for easy checking in components
        _hasPendingEdit: item.has_pending_edit === true
      }));

      setSkills(transformedData);
    } catch (err) {
      console.error(`Error fetching ${skillType} skills:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [studentId, skillType, enabled]);

  const refresh = () => {
    fetchSkills();
  };

  return {
    skills,
    loading,
    error,
    refresh
  };
};

// Convenience hooks for specific skill types
export const useStudentTechnicalSkills = (studentId, enabled = true) => {
  return useStudentSkills(studentId, 'technical', enabled);
};

export const useStudentSoftSkills = (studentId, enabled = true) => {
  return useStudentSkills(studentId, 'soft', enabled);
};
