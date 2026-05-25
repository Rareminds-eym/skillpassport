/**
 * Abandon Assessment Handler
 *
 * Handles POST /api/assessment/abandon
 * Abandons an in-progress assessment
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { AbandonAttemptOptions, SuccessResponse } from '../types';
import { validateAbandonAttemptRequest } from '../utils/validation';

export async function abandonHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as AbandonAttemptOptions;

    const validation = validateAbandonAttemptRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const { attemptId } = body;

    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return Response.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', attempt.learner_id)
      .maybeSingle();

    if (learner?.user_id !== user.sub) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('personal_assessment_attempts')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) {
      return Response.json({ error: 'Failed to abandon attempt', message: updateError.message }, { status: 500 });
    }

    const result: SuccessResponse = {
      success: true
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to abandon attempt',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
