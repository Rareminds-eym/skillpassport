/**
 * Assessment API Router
 *
 * Main router for all assessment endpoints
 * Routes POST/GET requests to appropriate handlers
 *
 * Endpoints:
 * - POST /api/assessment/start - Start new assessment
 * - POST /api/assessment/save-response - Save answer to question
 * - POST /api/assessment/update-progress - Update position and timings
 * - POST /api/assessment/submit - Submit completed assessment
 * - POST /api/assessment/abandon - Abandon in-progress assessment
 * - GET /api/assessment/check-in-progress - Check for in-progress assessments
 */

import { withAuth } from '../../lib/auth';
import { apiNotFound, apiError } from '../../lib/response';
import { startHandler } from './handlers/start';
import { saveResponseHandler } from './handlers/save-response';
import { updateProgressHandler } from './handlers/update-progress';
import { submitHandler } from './handlers/submit';
import { abandonHandler } from './handlers/abandon';
// Legacy save path — used by the high school (Grades 9-10) flow, where the frontend
// submission hook posts the /api/analyze-assessment report here (bypasses RLS).
import { saveResultsHandler } from './handlers/save-results';
import { checkInProgressHandler } from './handlers/check-in-progress';
import { analyzeHandler } from './handlers/analyze';
import { resultHandler } from './handlers/result';
import { generateStrengthsGrowthPlanHandler } from './handlers/generate-strengths-growth-plan';
import {
  handleGetSavedQuestions,
  handleSaveQuestions,
  handleClearQuestions,
} from './handlers/questions';

/**
 * POST handler - Routes POST requests to appropriate handlers
 */
export const onRequestPost = withAuth(async (context: any) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/assessment', '');

  try {
    if (path === '/start') {
      return startHandler(context);
    } else if (path === '/save-response') {
      return saveResponseHandler(context);
    } else if (path === '/update-progress') {
      return updateProgressHandler(context);
    } else if (path === '/submit') {
      return submitHandler(context);
    } else if (path === '/abandon') {
      return abandonHandler(context);
    } else if (path === '/save-results') {
      // Restored for the legacy high school submission flow (see handlers/save-results.ts)
      return saveResultsHandler(context);
    } else if (path === '/analyze') {
      return analyzeHandler(context);
    } else if (path === '/generate-strengths-growth-plan') {
      return generateStrengthsGrowthPlanHandler(context);
    } else if (path === '/questions/save') {
      return handleSaveQuestions(context.request, context);
    } else if (path === '/questions/clear') {
      return handleClearQuestions(context.request, context);
    } else if (path === '/actions') {
      // Assessment actions endpoint - log actions taken on assessment results
      return new Response(
        JSON.stringify({ success: true, message: 'Action recorded' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return apiNotFound(`Assessment endpoint not found: ${path}`, context.request);
    }
  } catch (error) {
    return apiError(
      500,
      'INTERNAL_SERVER_ERROR',
      'An internal error occurred',
      context.request
    );
  }
});

/**
 * GET handler - Routes GET requests to appropriate handlers
 */
export const onRequestGet = withAuth(async (context: any) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/assessment', '');

  try {
    if (path === '/check-in-progress') {
      return checkInProgressHandler(context);
    } else if (path === '/result') {
      return resultHandler(context);
    } else if (path === '/questions/saved') {
      return handleGetSavedQuestions(context.request, context);
    } else {
      return apiNotFound(`Assessment endpoint not found: ${path}`, context.request);
    }
  } catch (error) {
    return apiError(
      500,
      'INTERNAL_SERVER_ERROR',
      'An internal error occurred',
      context.request
    );
  }
});

/**
 * Catch-all for unsupported methods
 */
const onRequest = (context: any) => {
  return apiError(
    405,
    'METHOD_NOT_ALLOWED',
    `${context.request.method} method not allowed`,
    context.request
  );
};

export default onRequest;