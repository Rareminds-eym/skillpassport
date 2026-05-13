import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';
import { Learner } from '@/features/learner-profile/model';

const logger = getLogger('college-admin:useLearnerSearch');

export const useLearnerSearch = (collegeId: string | null, excludeIds: Set<string>) => {
  const [learners, setlearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch total learner count for the college
  useEffect(() => {
    const fetchCount = async () => {
      if (!collegeId) return;
      const { count } = await supabase
        .from("learners")
        .select("id", { count: "exact", head: true })
        .eq("college_id", collegeId);
      setTotalCount(count || 0);
    };
    fetchCount();
  }, [collegeId]);

  const searchlearners = useCallback((query: string) => {
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // If query is empty, clear results
    if (!query.trim()) {
      setlearners([]);
      setHasSearched(false);
      return;
    }

    // Debounce search by 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setHasSearched(true);

        let queryBuilder = supabase
          .from("learners")
          .select("id, name, email, college_id")
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(30);

        // Filter by college if available
        if (collegeId) {
          queryBuilder = queryBuilder.eq("college_id", collegeId);
        }

        const { data, error } = await queryBuilder;
        
        if (error) throw error;

        // Filter out already registered learners
        const filtered = (data || []).filter(s => !excludeIds.has(s.id));
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
