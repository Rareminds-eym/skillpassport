import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';

export const useLearnerSkills = (learnerId, skillType, enabled = true) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSkills = async () => {
    if (!learnerId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-learner-skills', learnerId, skillType,
      });
      const data = result?.data || [];

      const transformedData = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        level: item.level,
        description: item.description,
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
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

  return { skills, loading, error, refresh: fetchSkills };
};

// Convenience hooks for specific skill types
export const useLearnerTechnicalSkills = (learnerId, enabled = true) => {
  return useLearnerSkills(learnerId, 'technical', enabled);
};

export const useLearnerSoftSkills = (learnerId, enabled = true) => {
  return useLearnerSkills(learnerId, 'soft', enabled);
};
