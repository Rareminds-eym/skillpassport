/**
 * Course API - Cloudflare Pages Function
 * 
 * Handles all course-related AI functionality:
 * - AI tutor suggestions
 * - AI tutor chat (with streaming)
 * - AI tutor feedback
 * - AI tutor progress tracking
 * - AI video summarizer
 * - Learner type detection
 * 
 * All endpoints require authentication via withAuth middleware.
 * 
 * Endpoints:
 * - GET /health - Health check (public)
 * - GET /learner-type - Get learner type for role detection (authenticated)
 * - POST /ai-tutor-suggestions - Generate suggested questions (authenticated)
 * - POST /ai-tutor-chat - AI tutor chat with streaming responses (authenticated)
 * - POST /ai-tutor-feedback - Submit feedback on AI responses (authenticated)
 * - GET /ai-tutor-progress - Get learner progress (authenticated)
 * - POST /ai-tutor-progress - Update lesson progress (authenticated)
 * - POST /ai-video-summarizer - Transcribe and summarize videos (authenticated)
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { withAuth } from '../../lib/auth';
import { handleAiTutorSuggestions } from './handlers/ai-tutor-suggestions';
import { handleAiTutorChat } from './handlers/ai-tutor-chat';
import { onRequestPost as handleAiTutorFeedback } from './handlers/ai-tutor-feedback';
import { onRequestGet as handleAiTutorProgressGet, onRequestPost as handleAiTutorProgressPost } from './handlers/ai-tutor-progress';
import { onRequestPost as handleAiVideoSummarizer } from './handlers/ai-video-summarizer';
import { onRequestGet as handleGetLearnerType } from './handlers/get-learner-type';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/course', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'course-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'GET /learner-type - Get learner type for role detection',
          'POST /ai-tutor-suggestions - Generate suggested questions',
          'POST /ai-tutor-chat - AI tutor chat (streaming)',
          'POST /ai-tutor-feedback - Submit feedback',
          'GET /ai-tutor-progress - Get progress',
          'POST /ai-tutor-progress - Update progress',
          'POST /ai-video-summarizer - Video transcription and summary',
        ],
      });
    }

    // Get Learner Type (authenticated)
    if (path === '/learner-type' && request.method === 'GET') {
      return withAuth(handleGetLearnerType)(context);
    }

    // AI Tutor Suggestions (authenticated)
    if (path === '/ai-tutor-suggestions' && request.method === 'POST') {
      return withAuth(handleAiTutorSuggestions)(context);
    }

    // AI Tutor Chat (authenticated)
    if (path === '/ai-tutor-chat' && request.method === 'POST') {
      return withAuth(handleAiTutorChat)(context);
    }

    // AI Tutor Feedback (authenticated)
    if (path === '/ai-tutor-feedback' && request.method === 'POST') {
      return withAuth(handleAiTutorFeedback)(context);
    }

    // AI Tutor Progress (authenticated)
    if (path === '/ai-tutor-progress' && request.method === 'GET') {
      return withAuth(handleAiTutorProgressGet)(context);
    }

    if (path === '/ai-tutor-progress' && request.method === 'POST') {
      return withAuth(handleAiTutorProgressPost)(context);
    }

    // AI Video Summarizer (authenticated)
    if (path === '/ai-video-summarizer' && request.method === 'POST') {
      return withAuth(handleAiVideoSummarizer)(context);
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Unknown endpoint',
        availableEndpoints: [
          'GET /health - Health check',
          'GET /learner-type - Get learner type for role detection',
          'POST /ai-tutor-suggestions - Generate suggested questions',
          'POST /ai-tutor-chat - AI tutor chat (streaming)',
          'POST /ai-tutor-feedback - Submit feedback',
          'GET /ai-tutor-progress - Get progress',
          'POST /ai-tutor-progress - Update progress',
          'POST /ai-video-summarizer - Video transcription and summary',
        ],
      },
      404
    );
  } catch (error: any) {
    console.error('❌ Error in course-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
