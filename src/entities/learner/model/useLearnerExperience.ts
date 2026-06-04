import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';

export const useLearnerExperience = (learnerId, enabled = true) => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperience = async () => {
    if (!learnerId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-experience', learnerId,
      });
      const data = result?.data || [];

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
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        verifiedAt: item.updated_at || item.created_at,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        _hasPendingEdit: item.has_pending_edit === true
      }));

      setExperience(transformedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, [learnerId, enabled]);

  return { experience, loading, error, refresh: fetchExperience };
};
