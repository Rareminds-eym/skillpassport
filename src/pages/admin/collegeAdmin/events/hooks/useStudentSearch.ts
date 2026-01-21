import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { Student } from '../types';

export const useStudentSearch = (collegeId: string | null, excludeIds: Set<string>) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch total student count for the college
  useEffect(() => {
    const fetchCount = async () => {
      if (!collegeId) return;
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('college_id', collegeId);
      setTotalCount(count || 0);
    };
    fetchCount();
  }, [collegeId]);

  const searchStudents = useCallback(
    (query: string) => {
      // Clear previous debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // If query is empty, clear results
      if (!query.trim()) {
        setStudents([]);
        setHasSearched(false);
        return;
      }

      // Debounce search by 300ms
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          setHasSearched(true);

          let queryBuilder = supabase
            .from('students')
            .select('id, name, email, college_id')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(30);

          // Filter by college if available
          if (collegeId) {
            queryBuilder = queryBuilder.eq('college_id', collegeId);
          }

          const { data, error } = await queryBuilder;

          if (error) throw error;

          // Filter out already registered students
          const filtered = (data || []).filter((s) => !excludeIds.has(s.id));
          setStudents(filtered);
        } catch (err) {
          console.error('Search error:', err);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [collegeId, excludeIds]
  );

  const clearSearch = useCallback(() => {
    setStudents([]);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { students, loading, hasSearched, totalCount, searchStudents, clearSearch };
};
