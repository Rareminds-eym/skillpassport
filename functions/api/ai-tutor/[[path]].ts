/**
 * AI Tutor API - Cloudflare Pages Function
 * 
 * Handles all AI tutor functionality:
 * - AI tutor suggestions
 * - AI tutor chat (with streaming)
 * - AI tutor feedback
 * - AI tutor progress tracking
 * - Learner type detection
 * - Generation usage tracking
 * 
 * All endpoints require authentication via withAuth middleware.
 * 
 * Endpoints:
 * - GET /health - Health check (public)
 * - GET /learner-type - Get learner type for role detection (authenticated)
 * - GET /generation-usage - Get worksheet/lesson plan generation usage (authenticated)
 * - POST /suggestions - Generate suggested questions (authenticated)
 * - POST /chat - AI tutor chat with streaming responses (authenticated)
 * - POST /feedback - Submit feedback on AI responses (authenticated)
 * - GET /progress - Get learner progress (authenticated)
 * - POST /progress - Update lesson progress (authenticated)
 */

import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { withAuth } from '../../lib/auth';
import { handleAiTutorSuggestions } from './handlers/ai-tutor-suggestions';
import { handleAiTutorChat } from './handlers/ai-tutor-chat';
import { onRequestPost as handleAiTutorFeedback } from './handlers/ai-tutor-feedback';
import { onRequestGet as handleAiTutorProgressGet, onRequestPost as handleAiTutorProgressPost } from './handlers/ai-tutor-progress';
import { onRequestGet as handleGetLearnerType } from './handlers/get-learner-type';
import { onRequestGet as handleGetGenerationUsage } from './handlers/get-generation-usage';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/ai-tutor', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'ai-tutor-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'GET /learner-type - Get learner type for role detection',
          'GET /generation-usage - Get worksheet/lesson plan generation usage',
          'POST /suggestions - Generate suggested questions',
          'POST /chat - AI tutor chat (streaming)',
          'POST /feedback - Submit feedback',
          'GET /progress - Get progress',
          'POST /progress - Update progress',
        ],
      }, request);
    }

    // Get Learner Type (authenticated)
    if (path === '/learner-type' && request.method === 'GET') {
      return withAuth(handleGetLearnerType as any)(context);
    }

    // Get Generation Usage (authenticated)
    if (path === '/generation-usage' && request.method === 'GET') {
      return withAuth(handleGetGenerationUsage as any)(context);
    }

    // AI Tutor Suggestions (authenticated)
    if (path === '/suggestions' && request.method === 'POST') {
      return withAuth(handleAiTutorSuggestions as any)(context);
    }

    // AI Tutor Chat (authenticated)
    if (path === '/chat' && request.method === 'POST') {
      return withAuth(handleAiTutorChat as any)(context);
    }

    // AI Tutor Feedback (authenticated)
    if (path === '/feedback' && request.method === 'POST') {
      return withAuth(handleAiTutorFeedback as any)(context);
    }

    // AI Tutor Progress (authenticated)
    if (path === '/progress' && request.method === 'GET') {
      return withAuth(handleAiTutorProgressGet as any)(context);
    }

    if (path === '/progress' && request.method === 'POST') {
      return withAuth(handleAiTutorProgressPost as any)(context);
    }

    // 404 for unknown routes
    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('❌ Error in ai-tutor-api:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
