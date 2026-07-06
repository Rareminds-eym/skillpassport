/**
 * useLearnerType Hook
 * 
 * Fetches and manages the learner_type from the learners table via backend API.
 * This is the source of truth for determining if a user should be treated
 * as a Teacher/Educator or a regular Learner.
 * 
 * Logic:
 * - If learner_type === "teacher", treat as educator/teacher
 * - Otherwise, treat as regular learner
 * 
 * This replaces route-based role detection for course player functionality.
 * 
 * Architecture: Uses backend API endpoint for consistency with other AI tutor features.
 * Frontend → /api/ai-tutor/learner-type → Supabase
 */

import { useEffect, useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-learner-type');

// API URL for learner type endpoint
const API_URL = getApiUrl('ai-tutor');

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
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLearnerType(null);
      setIsTeacher(false);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchLearnerType = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.info('Fetching learner_type for user via API', { userId });

        // Call backend API endpoint
        const response = await ssoClient.fetch(
          `${API_URL}/learner-type?userId=${encodeURIComponent(userId)}`,
          {
            method: 'GET',
          }
        );

        if (cancelled) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch learner type' })) as { error?: string };
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json() as { success?: boolean; data?: { learnerType?: string | null; isTeacher?: boolean }; learnerType?: string | null; isTeacher?: boolean };

        if (cancelled) return;

        // ponytail: API returns {success, data: {...}} structure, extract from data if present
        const responseData = data.success && data.data ? data.data : data;
        const type = responseData.learnerType || null;
        const isTeacherValue = responseData.isTeacher ?? false;
        
        logger.info('Fetched learner_type via API', { userId, learnerType: type, isTeacher: isTeacherValue });
        setLearnerType(type);
        setIsTeacher(isTeacherValue); // Set from backend response

      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Exception fetching learner_type via API', error, { userId });
        setError(error);
        setLearnerType(null);
        setIsTeacher(false);
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

  return {
    learnerType,
    isTeacher, // Return state value from backend
    loading,
    error,
  };
}
