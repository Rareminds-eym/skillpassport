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
import { createLogger } from '../../../lib/logger';

const logger = createLogger('StartHandler');

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
    
    logger.info('Starting assessment', { 
      userId: user.sub, 
      gradeLevel, 
      streamId,
      hasEnv: !!env,
      hasQuestionGenUrl: !!env?.QUESTION_GENERATION_API_URL
    });

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

    // **CRITICAL: Check for existing in-progress attempt BEFORE creating new one**
    const { data: existingAttempts, error: existingError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, grade_level, stream_id, status, all_responses, current_section_index, current_question_index')
      .eq('learner_id', learnerId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1);

    let attempt = null;

    // If in-progress attempt exists for same grade/stream, reuse it
    if (existingAttempts && existingAttempts.length > 0) {
      const existingAttempt = existingAttempts[0];
      const sameGrade = existingAttempt.grade_level === gradeLevel;
      const sameStream = existingAttempt.stream_id === streamId || (streamId === null && existingAttempt.stream_id === null);

      if (sameGrade && sameStream) {
        attempt = existingAttempt;
      } else {
        return Response.json(
          {
            error: 'You have an in-progress assessment for a different grade/stream level. Please abandon it first or resume it.',
            existingAttemptId: existingAttempt.id,
            existingGradeLevel: existingAttempt.grade_level,
            existingStreamId: existingAttempt.stream_id
          },
          { status: 409 } // 409 Conflict
        );
      }
    }

    // Only create NEW attempt if no matching in-progress one exists
    if (!attempt) {
      const { data: newAttempt, error: insertError } = await supabase
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

      if (insertError || !newAttempt) {
        return Response.json({ error: 'Failed to create assessment attempt', message: insertError?.message }, { status: 500 });
      }

      attempt = newAttempt;
    }

    let sections;
    try {
      sections = await loadSectionsWithQuestions(supabase, gradeLevel, streamId, env);
      logger.info('Sections loaded successfully', { 
        sectionCount: sections?.length || 0,
        sectionNames: sections?.map((s: any) => s.name) || []
      });
    } catch (loadError) {
      logger.error('Failed to load sections', { error: loadError, gradeLevel, streamId });
      return Response.json(
        { error: 'Failed to load assessment sections', message: loadError instanceof Error ? loadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!sections || sections.length === 0) {
      logger.warn('No sections available', { gradeLevel, streamId });
      return Response.json({ error: 'No assessment sections available for this grade level' }, { status: 404 });
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

    logger.info('Assessment started successfully', { 
      attemptId: attempt.id, 
      sectionCount: sections.length,
      gradeLevel,
      streamId
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    logger.error('Failed to start assessment', { error });
    return Response.json(
      {
        error: 'Failed to start assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
