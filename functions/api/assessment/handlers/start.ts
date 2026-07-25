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

/**
 * Infer UG/PG/diploma from any available text signal: program name, code, course name,
 * branch, or grade. College learners often have grade=null and no linked program row, so
 * the program/course NAME ("Bachelor of Computer Applications") is the most reliable source.
 */
function deriveDegreeLevel(...signals: Array<string | null | undefined>): string | null {
  const text = signals.filter(Boolean).join(' ').toLowerCase();
  if (!text) return null;
  if (/(\bpg\b|postgraduate|post[-\s]?graduate|\bmaster|m\.?tech|mtech|mca|mba|m\.?sc|msc|m\.?com|mcom|\bma\b|\bm\.?a\b)/.test(text)) return 'postgraduate';
  if (/(\bug\b|undergraduate|under[-\s]?graduate|\bbachelor|b\.?tech|btech|bca|b\.?sc|bsc|b\.?com|bcom|bba|\bba\b|\bb\.?a\b)/.test(text)) return 'undergraduate';
  if (text.includes('diploma')) return 'diploma';
  return null;
}

function buildLearnerContext(
  learner: any,
  streamId: string | null
): Record<string, unknown> | null {
  const programs = learner?.programs;
  const programName =
    programs?.name || programs?.code || learner?.course_name || learner?.branch_field || null;
  const programCode = programs?.code || null;
  const degreeLevel =
    programs?.degree_level ||
    deriveDegreeLevel(
      programs?.name,
      programs?.code,
      learner?.course_name,
      learner?.branch_field,
      learner?.grade
    );

  if (!programName && !streamId && !learner?.grade) return null;

  return {
    rawGrade: learner?.grade || null,
    programName: programName || null,
    programCode,
    degreeLevel,
    selectedStream: streamId || null,
  };
}

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
      .select(`
        id,
        grade,
        course_name,
        branch_field,
        program_id,
        programs ( name, code, degree_level )
      `)
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

    // Resolve the requested stream to a real personal_assessment_streams row. The frontend
    // normalizes a program name to a stream id (e.g. hospitality "Hotel Management" → 'bhm')
    // that may have no table row, which would violate the stream_id FK. Any unknown stream
    // falls back to the generic 'college' stream. RAG steering is unaffected — career
    // recommendations use learner_context.programName, not stream_id.
    let effectiveStreamId: string | null = streamId || null;
    if (effectiveStreamId) {
      const { data: streamRow } = await supabase
        .from('personal_assessment_streams')
        .select('id')
        .eq('id', effectiveStreamId)
        .maybeSingle();
      if (!streamRow) {
        logger.warn('Unknown stream_id — falling back to college', { requestedStreamId: effectiveStreamId });
        effectiveStreamId = 'college';
      }
    }

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
      const sameStream = existingAttempt.stream_id === effectiveStreamId || (effectiveStreamId === null && existingAttempt.stream_id === null);

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
          stream_id: effectiveStreamId,
          learner_context: buildLearnerContext(learnerData, effectiveStreamId),
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
      sections = await loadSectionsWithQuestions(supabase, gradeLevel, effectiveStreamId, env);
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