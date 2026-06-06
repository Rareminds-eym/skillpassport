/**
 * Get Learner Type Handler
 * 
 * Fetches the learner_type from the learners table to determine
 * if a user should be treated as a teacher/educator or regular learner.
 * 
 * This is the source of truth for role detection in the course player.
 * 
 * Logic:
 * - If learner_type === "teacher", user should be treated as educator
 * - Otherwise, user is treated as regular learner
 * 
 * GET /api/ai-tutor/learner-type?userId=<id>
 * 
 * Query parameters:
 * - userId: string (optional) - User ID to fetch learner_type for
 *   If not provided, uses authenticated user's ID
 * 
 * Response:
 * - userId: string
 * - learnerType: string | null - The learner_type value from database
 * - isTeacher: boolean - True if learner_type === "teacher"
 * - hasLearnerRecord: boolean - True if learner record exists
 * 
 * Used by:
 * - Frontend: useLearnerType hook (src/features/ai-tutor/model/useLearnerType.ts)
 * - Admin tools: For checking other users' learner types
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('get-learner-type');

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type TypedContext = AuthenticatedContext<PagesEnv> & { env: RequiredEnv };

export const onRequestGet = async (context: TypedContext) => {
  const { request, env } = context;
  try {
    const authenticatedUser = getContextUser(context);
    // strict: no-any verified
    const supabase = getServiceClient(env);

    // Parse query parameters
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');
    
    // Use requested userId or fall back to authenticated user
    const userId = requestedUserId || authenticatedUser.id;

    if (!userId) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing userId parameter', request);
    }

    // Security check: Only allow users to fetch their own learner_type
    // unless they have admin privileges
    const isAdmin = authenticatedUser.roles?.some((role: string) => 
      ['admin', 'company_admin', 'owner', 'school_admin', 'college_admin', 'university_admin'].includes(role)
    );

    if (requestedUserId && requestedUserId !== authenticatedUser.id && !isAdmin) {
      return apiError(403, 'FORBIDDEN', 'Forbidden: You can only fetch your own learner type', request);
    }

    // Fetch learner_type from learners table
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('learner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch learner_type', fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch learner type', request);
    }

    // Extract learner_type (null if no record found)
    const learnerType = learner?.learner_type || null;
    const hasLearnerRecord = !!learner;
    const isTeacher = learnerType === 'teacher';

    return apiSuccess({
      userId,
      learnerType,
      isTeacher,
      hasLearnerRecord,
    }, request);
  } catch (error: unknown) {
    logger.error('Get learner type error', error instanceof Error ? error : new Error(String(error)));
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};
