/**
 * Get Generation Usage Handler
 * 
 * Fetches the current worksheet/lesson plan generation count for teacher-learner accounts.
 * 
 * GET /api/course/generation-usage?userId=<id>
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { getGenerationUsage } from '../utils/generation-limit';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('get-generation-usage');

const ADMIN_ROLES = new Set([
  'admin',
  'company_admin',
  'owner',
  'school_admin',
  'college_admin',
  'university_admin',
]);

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type TypedContext = AuthenticatedContext<PagesEnv> & { env: RequiredEnv };

export const onRequestGet = async (context: TypedContext) => {
  const { request, env } = context;
  try {
    const authenticatedUser = getContextUser(context);
    const supabase = getServiceClient(env);

    // Parse query parameters
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');
    
    // Use requested userId or fall back to authenticated user
    const userId = requestedUserId || authenticatedUser.id;

    if (!userId) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing userId parameter', request);
    }

    // Security check: Only allow users to fetch their own generation usage unless admin
    const isAdmin =
      Array.isArray(authenticatedUser.roles) &&
      authenticatedUser.roles.some(
        (role: unknown) => typeof role === 'string' && ADMIN_ROLES.has(role)
      );

    if (requestedUserId && requestedUserId !== authenticatedUser.id && !isAdmin) {
      return apiError(403, 'FORBIDDEN', 'Forbidden: You can only fetch your own generation usage', request);
    }

    // Check if user is a teacher-learner
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('learner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.error('Failed to fetch learner_type', learnerError instanceof Error ? learnerError : new Error(String(learnerError)));
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch learner type', request);
    }

    const isTeacher = learner?.learner_type === 'teacher';

    // If not a teacher-learner, return unlimited usage
    if (!isTeacher) {
      return apiSuccess({
        userId,
        limit: null,
        used: 0,
        remaining: null,
        isTeacher: false,
      }, request);
    }

    // Get generation usage using centralized utility
    const usage = await getGenerationUsage(supabase, userId);

    return apiSuccess({
      userId,
      ...usage,
      isTeacher: true,
    }, request);
  } catch (error: unknown) {
    logger.error('Get generation usage error', error instanceof Error ? error : new Error(String(error)));
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};
