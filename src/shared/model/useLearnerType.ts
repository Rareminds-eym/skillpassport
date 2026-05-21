/**
 * useLearnerType Hook
 * 
 * Fetches and manages the learner_type from the learners table.
 * This is the source of truth for determining if a user should be treated
 * as a Teacher/Educator or a regular Learner.
 * 
 * Logic:
 * - If learner_type === "teacher", treat as educator/teacher
 * - Otherwise, treat as regular learner
 * 
 * This replaces route-based role detection for course player functionality.
 * 
 * Note: Uses direct Supabase access for simplicity. The backend API endpoint
 * exists for server-side operations but frontend can access this data directly
 * since it's user-specific and doesn't require special permissions.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-learner-type');

export interface LearnerTypeData {
  learnerType: string | null;
  isTeacher: boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch learner_type from the learners table
 * 
 * @param userId - The user ID to fetch learner_type for
 * @returns LearnerTypeData object with learnerType, isTeacher flag, loading state, and error
 */
export function useLearnerType(userId: string | undefined): LearnerTypeData {
  const [learnerType, setLearnerType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLearnerType(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchLearnerType = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.info('Fetching learner_type for user', { userId });

        // Fetch directly from Supabase
        const { data, error: fetchError } = await supabase
          .from('learners')
          .select('learner_type')
          .eq('user_id', userId)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) {
          if (fetchError && typeof fetchError === 'object' && fetchError !== null && 'code' in fetchError && fetchError.code === 'PGRST116') {
            // maybeSingle() returns PGRST116 when multiple rows match —
            // this means the unique constraint on learners.user_id is violated.
            logger.error(
              'Data integrity issue: multiple learner records found for user',
              fetchError instanceof Error ? fetchError : new Error(String(fetchError)),
              { userId }
            );
            setError(
              new Error(
                `Multiple learner records found for user ${userId}. ` +
                'This indicates a database constraint violation.'
              )
            );
          } else {
            logger.error('Error fetching learner_type', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), { userId });
            setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
          }
          setLearnerType(null);
        } else if (data) {
          const type = data.learner_type || null;
          logger.info('Fetched learner_type', { userId, learnerType: type });
          setLearnerType(type);
        } else {
          // No learner record found - this is okay, user might not be a learner
          logger.info('No learner record found for user', { userId });
          setLearnerType(null);
        }
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Exception fetching learner_type', error, { userId });
        setError(error);
        setLearnerType(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLearnerType();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Determine if user should be treated as teacher
  const isTeacher = learnerType === 'teacher';

  return {
    learnerType,
    isTeacher,
    loading,
    error,
  };
}

/**
 * Helper function to check if a learner_type value indicates a teacher
 * 
 * @param learnerType - The learner_type value from the database
 * @returns true if the user should be treated as a teacher
 */
export function isTeacherType(learnerType: string | null | undefined): boolean {
  return learnerType === 'teacher';
}
