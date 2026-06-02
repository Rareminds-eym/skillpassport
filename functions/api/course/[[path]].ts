/**
 * Course API - Cloudflare Pages Function
 * 
 * Handles course-related functionality:
 * - AI video summarizer
 * 
 * All endpoints require authentication via withAuth middleware.
 * 
 * Endpoints:
 * - GET /health - Health check (public)
 * - POST /ai-video-summarizer - Transcribe and summarize videos (authenticated)
 * 
 * Note: AI tutor endpoints have been moved to /api/ai-tutor
 */

import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { withAuth } from '../../lib/auth';
import { onRequestPost as handleAiVideoSummarizer } from './handlers/ai-video-summarizer';
import { onRequestPost as handleCourseActions } from './handlers/actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/course', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'course-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'POST /ai-video-summarizer - Video transcription and summary',
          'POST /actions - Course data CRUD (get-courses, enrollments, progress, modules)',
        ],
        note: 'AI tutor endpoints have been moved to /api/ai-tutor',
      }, request);
    }

    // AI Video Summarizer (authenticated)
    if (path === '/ai-video-summarizer' && request.method === 'POST') {
      return withAuth(handleAiVideoSummarizer)(context);
    }

    // Course actions dispatch
    if (path === '/actions' && request.method === 'POST') {
      return handleCourseActions(context);
    }

    // 404 for unknown routes
    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('❌ Error in course-api:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
