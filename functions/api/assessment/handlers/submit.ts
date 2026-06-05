/**
 * Submit Assessment Handler
 *
 * Handles POST /api/assessment/submit
 * Marks assessment as completed
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SubmitAssessmentOptions, SuccessResponse } from '../types';
import { validateSubmitAssessmentRequest } from '../utils/validation';

export async function submitHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as SubmitAssessmentOptions;

    const validation = validateSubmitAssessmentRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const { attemptId, answers = {} } = body;

    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id, all_responses')
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

    const finalResponses = { ...attempt.all_responses, ...answers };

    const { error: updateError } = await supabase
      .from('personal_assessment_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        all_responses: finalResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) {
      return Response.json({ error: 'Failed to submit assessment', message: updateError.message }, { status: 500 });
    }

    const result: SuccessResponse = {
      success: true,
      message: 'Assessment submitted successfully'
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to submit assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
