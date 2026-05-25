/**
 * Update Progress Handler
 *
 * Handles POST /api/assessment/update-progress
 * Updates section/question position and timings
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { UpdateProgressOptions, SuccessResponse } from '../types';
import { validateUpdateProgressRequest } from '../utils/validation';

export async function updateProgressHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as UpdateProgressOptions;

    const validation = validateUpdateProgressRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const {
      attemptId,
      sectionIndex = 0,
      questionIndex = 0,
      sectionTimings = {},
      timerRemaining = null,
      elapsedTime = 0,
      answers = {}
    } = body;

    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id, all_responses, section_timings')
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

    const mergedResponses = { ...attempt.all_responses, ...answers };
    const mergedTimings = { ...attempt.section_timings, ...sectionTimings };

    const { error: updateError } = await supabase
      .from('personal_assessment_attempts')
      .update({
        current_section_index: sectionIndex,
        current_question_index: questionIndex,
        section_timings: mergedTimings,
        timer_remaining: timerRemaining,
        elapsed_time: elapsedTime,
        all_responses: mergedResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) {
      return Response.json({ error: 'Failed to update progress', message: updateError.message }, { status: 500 });
    }

    const result: SuccessResponse = {
      success: true
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to update progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
