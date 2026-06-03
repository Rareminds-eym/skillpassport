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
} from '../services/assessment-repository';

/**
 * GET /api/assessment/questions/saved
 * Retrieves cached questions for a learner
 */
export async function handleGetSavedQuestions(request: Request, ctx: RequestContext) {
  const url = new URL(request.url);
  const learnerId = url.searchParams.get('learnerId');
  const streamId = url.searchParams.get('streamId');
  const questionType = url.searchParams.get('questionType') as 'aptitude' | 'knowledge';

  if (!learnerId || !streamId || !questionType) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required parameters: learnerId, streamId, questionType',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const questions = await getSavedQuestionsForLearner(ctx.env, learnerId, streamId, questionType);

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

    if (!learnerId || !streamId || !questionType || !questions) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: learnerId, streamId, questionType, questions',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let success = false;

    if (questionType === 'aptitude') {
      success = await saveAptitudeQuestions(ctx.env, learnerId, streamId, attemptId, questions, gradeLevel);
    } else if (questionType === 'knowledge') {
      success = await saveKnowledgeQuestions(ctx.env, learnerId, streamId, attemptId, questions, gradeLevel);
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
