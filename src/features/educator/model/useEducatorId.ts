import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';

interface EducatorIdData {
  educatorId: string | null;
  loading: boolean;
  error: string | null;
}

export function useEducatorId(): EducatorIdData {
  const user = useUser();
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducatorId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (user.educator_id) {
          setEducatorId(user.educator_id);
          setLoading(false);
          return;
        }

        const res = await apiPost('/educator/actions', {
          action: 'fetch-educator-id',
          userId: user.id,
          email: user.email,
        });

        if (res?.data) {
          setEducatorId(res.data);
        } else {
          setError('Educator record not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch educator ID');
        setEducatorId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorId();
  }, [user?.id, user?.email, user?.educator_id]);

  return { educatorId, loading, error };
}
