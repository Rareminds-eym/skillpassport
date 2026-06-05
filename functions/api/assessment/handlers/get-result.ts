/**
 * Get Assessment Result Handler
 *
 * Handles GET /api/assessment/result?attemptId=xxx
 * Fetches completed assessment result by attempt ID
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export async function getResultHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const url = new URL(context.request.url);
    const attemptId = url.searchParams.get('attemptId');

    if (!attemptId) {
      return Response.json(
        { error: 'Missing attemptId parameter' },
        { status: 400 }
      );
    }

    console.log('[get-result] Fetching result for attempt:', attemptId);
    console.log('[get-result] Auth user:', user.sub);

    // Fetch the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id, status, grade_level, stream_id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      console.error('[get-result] Attempt not found:', attemptError?.message);
      return Response.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Verify the learner belongs to the authenticated user
    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', attempt.learner_id)
      .maybeSingle();

    if (learner?.user_id !== user.sub) {
      console.error('[get-result] Unauthorized - learner does not belong to user');
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch the result
    const { data: result, error: resultError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (resultError) {
      console.error('[get-result] Error fetching result:', resultError);
      return Response.json(
        { error: 'Failed to fetch result', message: resultError.message },
        { status: 500 }
      );
    }

    if (!result) {
      console.warn('[get-result] No result found for attempt:', attemptId);
      return Response.json({ error: 'Result not found' }, { status: 404 });
    }

    console.log('[get-result] Result found:', result.id);

    return Response.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[get-result] Exception:', error);
    return Response.json(
      {
        error: 'Failed to fetch assessment result',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
