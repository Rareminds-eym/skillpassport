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
import { checkInProgressHandler } from './handlers/check-in-progress';

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
