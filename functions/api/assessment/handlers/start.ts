/**
 * Start Assessment Handler
 *
 * Handles POST /api/assessment/start
 * Starts a new assessment attempt and loads sections/questions
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { StartAssessmentOptions, StartAssessmentResult } from '../types';
import { validateStartAssessmentRequest, validateLearnerData, validateAttemptData } from '../utils/validation';
import { dbAttemptToAssessmentAttempt } from '../utils/converters';
import { loadSectionsWithQuestions } from '../utils/question-loader';

export async function startHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as StartAssessmentOptions;

    const validation = validateStartAssessmentRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const { gradeLevel, streamId } = body;

    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError) {
      return Response.json({ error: 'Learner lookup failed', message: learnerError.message }, { status: 400 });
    }

    const learnerValidation = validateLearnerData(learnerData);
    if (!learnerValidation.isValid) {
      return Response.json({ error: learnerValidation.message }, { status: 400 });
    }

    const learnerId = learnerData!.id;

    let sections;
    try {
      const loadStart = Date.now();
      sections = await loadSectionsWithQuestions(supabase, gradeLevel, streamId);
      const loadTime = Date.now() - loadStart;
      console.log(`[StartHandler] Loaded sections in ${loadTime}ms`);
    } catch (loadError) {
      console.error('[StartHandler] Error loading sections:', loadError);
      return Response.json(
        { error: 'Failed to load assessment sections', message: loadError instanceof Error ? loadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!sections || sections.length === 0) {
      return Response.json({ error: 'No assessment sections available for this grade level' }, { status: 404 });
    }

    const { data: attempt, error: insertError } = await supabase
      .from('personal_assessment_attempts')
      .insert({
        learner_id: learnerId,
        grade_level: gradeLevel,
        stream_id: streamId || null,
        status: 'in_progress',
        all_responses: {},
        timer_remaining: null,
        elapsed_time: 0,
        current_section_index: 0,
        current_question_index: 0
      })
      .select('*')
      .single();

    if (insertError || !attempt) {
      return Response.json({ error: 'Failed to create assessment attempt', message: insertError?.message }, { status: 500 });
    }

    const attemptValidation = validateAttemptData(attempt);
    if (!attemptValidation.isValid) {
      return Response.json({ error: attemptValidation.message }, { status: 400 });
    }

    const result: StartAssessmentResult = {
      success: true,
      attemptId: attempt.id,
      attempt: dbAttemptToAssessmentAttempt(attempt),
      sections
    };

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error('[StartHandler] Error starting assessment:', error);
    return Response.json(
      {
        error: 'Failed to start assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
