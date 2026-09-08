/**
 * Question Cache API Handlers
 * Handles assessment question caching operations
 * 
 * @module assessment/handlers/questions
 */

import type { RequestContext } from '../types';
import {
  getSavedQuestionsForLearner,
  saveAptitudeQuestions,
  saveKnowledgeQuestions,
  clearSavedQuestionsForLearner,
} from '../services/core/assessment-repository';
import { getServiceClient } from '../../../lib/supabase';

// Matches personal_assessment_streams' grade_level CHECK constraint - the column can
// only ever contain one of these 6 values at the database level.
type GradeLevel = 'after10' | 'after12' | 'higher_secondary' | 'college' | 'middle' | 'highschool';

/**
 * Validate a client-supplied streamId against personal_assessment_streams before it is
 * used as part of the shared canonical question set identity. Never falls back to
 * 'college' - an unresolvable/inactive streamId is rejected outright.
 *
 * The stream's OWN registered grade_level is authoritative for the assessment content
 * tier and is returned as `effectiveGradeLevel` - the client-supplied gradeLevel is only
 * a UI/enrollment-category selection and is never independently trusted once a real
 * streamId is known (e.g. 'bca' is catalogued at 'after12' even though a college_student
 * learner legitimately selects 'college' in the UI). Callers must use the returned
 * effectiveGradeLevel, not the gradeLevel they passed in, for every downstream operation.
 */
async function validateStreamGrade(
  env: unknown,
  streamId: string
): Promise<{ valid: boolean; error?: string; effectiveGradeLevel?: GradeLevel }> {
  const supabase = getServiceClient(env as any);
  const { data: streamRow } = await supabase
    .from('personal_assessment_streams')
    .select('id, grade_level')
    .eq('id', streamId)
    .eq('is_active', true)
    .maybeSingle();

  if (!streamRow) {
    return { valid: false, error: 'Invalid streamId' };
  }
  return { valid: true, effectiveGradeLevel: streamRow.grade_level as GradeLevel };
}

/**
 * GET /api/assessment/questions/saved
 * Retrieves cached questions for a learner
 */
export async function handleGetSavedQuestions(request: Request, ctx: RequestContext) {
  const url = new URL(request.url);
  const learnerId = url.searchParams.get('learnerId');
  const streamId = url.searchParams.get('streamId');
  const questionType = url.searchParams.get('questionType') as 'aptitude' | 'knowledge';
  const gradeLevel = url.searchParams.get('gradeLevel');

  if (!learnerId || !streamId || !questionType || !gradeLevel) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required parameters: learnerId, streamId, questionType, gradeLevel',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const streamGradeCheck = await validateStreamGrade(ctx.env, streamId);
  if (!streamGradeCheck.valid) {
    return new Response(
      JSON.stringify({ success: false, error: streamGradeCheck.error }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const effectiveGradeLevel = streamGradeCheck.effectiveGradeLevel!;

  try {
    const questions = await getSavedQuestionsForLearner(ctx.env, learnerId, streamId, questionType, effectiveGradeLevel);

    return new Response(
      JSON.stringify({
        success: true,
        questions: questions || [],
        cached: questions !== null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[handleGetSavedQuestions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve questions',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/assessment/questions/save
 * Saves generated questions to cache
 */
export async function handleSaveQuestions(request: Request, ctx: RequestContext) {
  try {
    const body = await request.json();
    const { learnerId, streamId, questionType, attemptId, questions, gradeLevel } = body;

    if (!learnerId || !streamId || !questionType || !questions || !gradeLevel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: learnerId, streamId, questionType, questions, gradeLevel',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const streamGradeCheck = await validateStreamGrade(ctx.env, streamId);
    if (!streamGradeCheck.valid) {
      return new Response(
        JSON.stringify({ success: false, error: streamGradeCheck.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const effectiveGradeLevel = streamGradeCheck.effectiveGradeLevel!;

    let success = false;

    if (questionType === 'aptitude') {
      success = await saveAptitudeQuestions(ctx.env, learnerId, streamId, attemptId, questions, effectiveGradeLevel);
    } else if (questionType === 'knowledge') {
      success = await saveKnowledgeQuestions(ctx.env, learnerId, streamId, attemptId, questions, effectiveGradeLevel);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid questionType. Must be "aptitude" or "knowledge"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'Questions saved successfully' : 'Failed to save questions',
      }),
      {
        status: success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[handleSaveQuestions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save questions',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/assessment/questions/clear
 * Clears cached questions for a learner
 */
export async function handleClearQuestions(request: Request, ctx: RequestContext) {
  try {
    const body = await request.json();
    const { learnerId, streamId } = body;

    if (!learnerId || !streamId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: learnerId, streamId',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await clearSavedQuestionsForLearner(ctx.env, learnerId, streamId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Questions cleared successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[handleClearQuestions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear questions',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
