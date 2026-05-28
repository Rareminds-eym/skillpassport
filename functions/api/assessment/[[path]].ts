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
 * - POST /api/assessment/save-results - Save AI-analyzed results (bypasses RLS)
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
import { checkInProgressHandler } from './handlers/check-in-progress';
import { analyzeHandler } from './handlers/analyze';
import { saveResultsHandler } from './handlers/save-results';

/**
 * POST handler - Routes POST requests to appropriate handlers
 */
export const onRequestPost = withAuth(async (context: any) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/assessment', '');

  console.log('[ASSESSMENT-ROUTER] POST request received:', { path, fullUrl: url.pathname });

  try {
    if (path === '/start') {
      console.log('[ASSESSMENT-ROUTER] Routing to startHandler');
      return startHandler(context);
    } else if (path === '/save-response') {
      console.log('[ASSESSMENT-ROUTER] Routing to saveResponseHandler');
      return saveResponseHandler(context);
    } else if (path === '/update-progress') {
      console.log('[ASSESSMENT-ROUTER] Routing to updateProgressHandler');
      return updateProgressHandler(context);
    } else if (path === '/submit') {
      console.log('[ASSESSMENT-ROUTER] Routing to submitHandler');
      return submitHandler(context);
    } else if (path === '/save-results') {
      console.log('[ASSESSMENT-ROUTER] Routing to saveResultsHandler');
      return saveResultsHandler(context);
    } else if (path === '/abandon') {
      console.log('[ASSESSMENT-ROUTER] Routing to abandonHandler');
      return abandonHandler(context);
    } else if (path === '/analyze') {
      console.log('[ASSESSMENT-ROUTER] Routing to analyzeHandler');
      return analyzeHandler(context);
    } else {
      console.log('[ASSESSMENT-ROUTER] Path not found:', path);
      return apiNotFound(`Assessment endpoint not found: ${path}`, context.request);
    }
  } catch (error) {
    console.error('[ASSESSMENT-ROUTER] Error in router:', error);
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
