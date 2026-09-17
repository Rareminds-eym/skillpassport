/**
 * Handles POST /api/assessment/regenerate
 *
 * Deletes the existing result for an owned attempt, then runs the normal
 * analysis endpoint again so the report is rebuilt from the attempt data.
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { AnalyzeRequest } from '../types';
import { analyzeHandler } from './analyze';

export async function regenerateHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as AnalyzeRequest;
    const { attemptId, gradeLevel } = body;

    if (!attemptId) {
      return Response.json({ error: 'attemptId required' }, { status: 400 });
    }

    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, grade_level')
      .eq('id', attemptId)
      .eq('learner_id', learnerData.id)
      .maybeSingle();

    if (attemptError || !attempt?.id) {
      return Response.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('personal_assessment_results')
      .delete()
      .eq('attempt_id', attemptId)
      .eq('learner_id', learnerData.id);

    if (deleteError) {
      return Response.json(
        { error: 'Failed to delete existing result', message: deleteError.message },
        { status: 500 }
      );
    }

    const headers = new Headers(context.request.headers);
    headers.delete('content-length');

    const regenerateRequest = new Request(context.request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        attemptId,
        gradeLevel: gradeLevel || attempt.grade_level,
      }),
    });

    return analyzeHandler({
      ...context,
      request: regenerateRequest,
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Regeneration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
