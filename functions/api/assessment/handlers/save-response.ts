/**
 * Save Response Handler
 *
 * Handles POST /api/assessment/save-response
 * Records a user's answer to a question
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SaveResponseOptions, SuccessResponse } from '../types';
import { validateSaveResponseRequest } from '../utils/validation';

export async function saveResponseHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as SaveResponseOptions;

    const validation = validateSaveResponseRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const { attemptId, questionId, answer } = body;

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

    const { data: existing, count } = await supabase
      .from('personal_assessment_responses')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId);

    let error;

    if (count === 0) {
      const { error: insertError } = await supabase
        .from('personal_assessment_responses')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          response_value: answer
        });

      error = insertError;
    } else {
      const { error: updateError } = await supabase
        .from('personal_assessment_responses')
        .update({
          response_value: answer
        })
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId);

      error = updateError;
    }

    if (error) {
      return Response.json({ error: 'Failed to save response', message: error.message }, { status: 500 });
    }

    const result: SuccessResponse = {
      success: true
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to save response',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
