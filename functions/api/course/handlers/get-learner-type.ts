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
 * GET /api/course/learner-type?userId=<id>
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
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/auth';
import { jsonResponse } from '../../../../src/functions-lib/response';

export const onRequestGet = async (context: AuthenticatedContext) => {
  try {
    const { request, env, data } = context;
    const authenticatedUser = data.user;
    const supabase = getServiceClient(env as any);

    // Parse query parameters
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');
    
    // Use requested userId or fall back to authenticated user
    const userId = requestedUserId || authenticatedUser.sub;

    if (!userId) {
      return jsonResponse({ error: 'Missing userId parameter' }, 400);
    }

    // Security check: Only allow users to fetch their own learner_type
    // unless they have admin privileges
    const isAdmin = authenticatedUser.roles?.some((role: string) => 
      ['admin', 'school_admin', 'college_admin', 'university_admin', 'owner'].includes(role)
    );

    if (requestedUserId && requestedUserId !== authenticatedUser.sub && !isAdmin) {
      return jsonResponse({ 
        error: 'Forbidden: You can only fetch your own learner type' 
      }, 403);
    }

    // Fetch learner_type from learners table
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('learner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch learner_type:', fetchError);
      return jsonResponse({ 
        error: 'Failed to fetch learner type',
        details: fetchError.message 
      }, 500);
    }

    // Extract learner_type (null if no record found)
    const learnerType = learner?.learner_type || null;
    const hasLearnerRecord = !!learner;
    const isTeacher = learnerType === 'teacher';

    return jsonResponse({
      userId,
      learnerType,
      isTeacher,
      hasLearnerRecord,
    });
  } catch (error: any) {
    console.error('Get learner type error:', error);
    return jsonResponse(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      500
    );
  }
};
