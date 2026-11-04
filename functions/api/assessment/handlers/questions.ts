/**
 * Question Cache API Handlers
 * Handles assessment question caching operations
 * 
 * @module assessment/handlers/questions
 */

import type { RequestContext } from '../types';
import {
  getSavedQuestionsForLearner,
  clearSavedQuestionsForLearner,
} from '../services/core/assessment-repository';
import { getServiceClient } from '../../../lib/supabase';
import { ownQuestionLearner } from '../../../lib/assessment-question-owner';
import { sanitizeLearnerQuestions } from '../../../lib/assessment-question-safety';

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

  try { await ownQuestionLearner(ctx, learnerId); }
  catch { return Response.json({ success: false, error: 'Question cache access denied' }, { status: 403 }); }

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
        questions: sanitizeLearnerQuestions(questions || []),
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
export async function handleSaveQuestions(_request: Request, _ctx: RequestContext) {
  return Response.json({ success: false, error: 'Question keys must be created by the server generation endpoint' }, { status: 409 });
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

    let ownedLearner: string;
    try { ownedLearner = await ownQuestionLearner(ctx, learnerId); }
    catch { return Response.json({ success: false, error: 'Question cache access denied' }, { status: 403 }); }
    await clearSavedQuestionsForLearner(ctx.env, ownedLearner, streamId);

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
