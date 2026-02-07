/**
 * Adaptive Session API Router
 * 
 * Handles all adaptive aptitude test session management endpoints.
 * This API eliminates CORS issues by handling all Supabase operations server-side.
 * 
 * Endpoints:
 * - POST /initialize - Start new test session
 * - GET /next-question/:sessionId - Get next question
 * - POST /submit-answer - Submit answer and update session
 * - POST /complete/:sessionId - Complete test and calculate results
 * - GET /results/:sessionId - Get test results
 * - GET /results/student/:studentId - Get all results for student
 * - GET /resume/:sessionId - Resume in-progress test
 * - GET /find-in-progress/:studentId - Find in-progress session
 * - POST /abandon/:sessionId - Abandon session
 * - POST /link-to-attempt - Link adaptive session to assessment attempt
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib/response';
import { initializeHandler } from './handlers/initialize';
import { nextQuestionHandler } from './handlers/next-question';
import { submitAnswerHandler } from './handlers/submit-answer';
import { completeHandler } from './handlers/complete';
import { getResultsHandler, getStudentResultsHandler } from './handlers/results';
import { resumeHandler, findInProgressHandler } from './handlers/resume';
import { abandonHandler } from './handlers/abandon';
import { onRequestPost as linkToAttemptHandler } from './link-to-attempt';

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/adaptive-session', '');
  const method = request.method;

  try {
    // POST /initialize - Start new test session
    if (method === 'POST' && path === '/initialize') {
      return initializeHandler(context);
    }

    // GET /next-question/:sessionId - Get next question
    if (method === 'GET' && path.startsWith('/next-question/')) {
      return nextQuestionHandler(context);
    }

    // POST /submit-answer - Submit answer and update session
    if (method === 'POST' && path === '/submit-answer') {
      return submitAnswerHandler(context);
    }

    // POST /complete/:sessionId - Complete test and calculate results
    if (method === 'POST' && path.startsWith('/complete/')) {
      return completeHandler(context);
    }

    // GET /results/:sessionId - Get test results
    if (method === 'GET' && path.startsWith('/results/') && !path.startsWith('/results/student/')) {
      return getResultsHandler(context);
    }

    // GET /results/student/:studentId - Get all results for student
    if (method === 'GET' && path.startsWith('/results/student/')) {
      return getStudentResultsHandler(context);
    }

    // GET /resume/:sessionId - Resume in-progress test
    if (method === 'GET' && path.startsWith('/resume/')) {
      return resumeHandler(context);
    }

    // GET /find-in-progress/:studentId - Find in-progress session
    if (method === 'GET' && path.startsWith('/find-in-progress/')) {
      return findInProgressHandler(context);
    }

    // POST /abandon/:sessionId - Abandon session
    if (method === 'POST' && path.startsWith('/abandon/')) {
      return abandonHandler(context);
    }

    // POST /link-to-attempt - Link adaptive session to assessment attempt
    if (method === 'POST' && path === '/link-to-attempt') {
      return linkToAttemptHandler(context);
    }

    // 404 for unknown routes
    return jsonResponse(
      { error: 'Not found', path, method },
      404
    );
  } catch (error) {
    console.error('Adaptive Session API Error:', error);
    return jsonResponse(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
};
