/**
 * Get Generation Usage Handler
 * 
 * Fetches the current worksheet/lesson plan generation count for teacher-learner accounts.
 * 
 * GET /api/course/generation-usage?userId=<id>
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import { getGenerationUsage } from '../utils/generation-limit';
import { getLogger } from '../../../../src/shared/config/logging';

const logger = getLogger('get-generation-usage');

const ADMIN_ROLES = new Set([
  'admin',
  'school_admin',
  'college_admin',
  'university_admin',
  'owner',
]);

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type TypedContext = AuthenticatedContext<PagesEnv> & { env: RequiredEnv };

export const onRequestGet = async (context: TypedContext) => {
  try {
    const { request, env } = context;
    const authenticatedUser = getContextUser(context);
    const supabase = getServiceClient(env);

    // Parse query parameters
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');
    
    // Use requested userId or fall back to authenticated user
    const userId = requestedUserId || authenticatedUser.id;

    if (!userId) {
      return jsonResponse({ error: 'Missing userId parameter' }, 400);
    }

    // Security check: Only allow users to fetch their own generation usage unless admin
    const isAdmin =
      Array.isArray(authenticatedUser.roles) &&
      authenticatedUser.roles.some(
        (role: unknown) => typeof role === 'string' && ADMIN_ROLES.has(role)
      );

    if (requestedUserId && requestedUserId !== authenticatedUser.id && !isAdmin) {
      return jsonResponse({ 
        error: 'Forbidden: You can only fetch your own generation usage' 
      }, 403);
    }

    // Check if user is a teacher-learner
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('learner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.error('Failed to fetch learner_type', learnerError instanceof Error ? learnerError : new Error(String(learnerError)));
      return jsonResponse({ 
        error: 'Failed to fetch learner type',
      }, 500);
    }

    const isTeacher = learner?.learner_type === 'teacher';

    // If not a teacher-learner, return unlimited usage
    if (!isTeacher) {
      return jsonResponse({
        userId,
        limit: null,
        used: 0,
        remaining: null,
        isTeacher: false,
      });
    }

    // Get generation usage using centralized utility
    const usage = await getGenerationUsage(supabase, userId);

    return jsonResponse({
      userId,
      ...usage,
      isTeacher: true,
    });
  } catch (error: unknown) {
    logger.error('Get generation usage error', error instanceof Error ? error : new Error(String(error)));
    return jsonResponse(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
