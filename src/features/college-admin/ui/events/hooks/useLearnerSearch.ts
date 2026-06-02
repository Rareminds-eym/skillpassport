import { useState, useCallback, useRef, useEffect } from "react";
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { Learner } from '@/features/learner-profile/model';

const logger = getLogger('college-admin:useLearnerSearch');

export const useLearnerSearch = (collegeId: string | null, excludeIds: Set<string>) => {
  const [learners, setlearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      if (!collegeId) return;
      try {
        const response = await apiPost('/college-admin/classes', {
          action: 'get-learner-count',
          college_id: collegeId,
        });
        setTotalCount(response.data || 0);
      } catch {
        setTotalCount(0);
      }
    };
    fetchCount();
  }, [collegeId]);

  const searchlearners = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setlearners([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setHasSearched(true);

        const response = await apiPost('/college-admin/classes', {
          action: 'search-learners',
          college_id: collegeId,
          query,
        });

        const filtered = (response.data || []).filter((s: any) => !excludeIds.has(s.id));
        setlearners(filtered);
      } catch (err) {
        logger.error('Search error', err as Error);
        setlearners([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [collegeId, excludeIds]);

  const clearSearch = useCallback(() => {
    setlearners([]);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { learners, loading, hasSearched, totalCount, searchlearners, clearSearch };
};
