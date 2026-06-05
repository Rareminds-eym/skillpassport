import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';

export const useLearnerEducation = (learnerId, enabled = true) => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEducation = async () => {
    if (!learnerId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-education', learnerId,
      });
      const data = result?.data || [];

      const transformedData = data.map(item => ({
        id: item.id,
        degree: item.degree,
        department: item.department,
        university: item.university,
        institution: item.university,
        yearOfPassing: item.year_of_passing,
        year_of_passing: item.year_of_passing,
        cgpa: item.cgpa,
        level: item.level,
        status: item.status,
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

      setEducation(transformedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [learnerId, enabled]);

  return { education, loading, error, refresh: fetchEducation };
};
