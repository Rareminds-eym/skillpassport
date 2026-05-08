import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

export const useLearnerSkills = (learnerId, skillType, enabled = true) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSkills = async () => {
    if (!learnerId || !enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('type', skillType)
        // Fetch ALL skills including those from trainings
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [learnerId, skillType, enabled]);

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
export const useLearnerTechnicalSkills = (learnerId, enabled = true) => {
  return useLearnerSkills(learnerId, 'technical', enabled);
};

export const useLearnerSoftSkills = (learnerId, enabled = true) => {
  return useLearnerSkills(learnerId, 'soft', enabled);
};
