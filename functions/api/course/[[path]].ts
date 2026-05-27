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

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { withAuth } from '../../lib/auth';
import { onRequestPost as handleAiVideoSummarizer } from './handlers/ai-video-summarizer';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

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
          'POST /ai-video-summarizer - Video transcription and summary',
        ],
        note: 'AI tutor endpoints have been moved to /api/ai-tutor',
      });
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
          'POST /ai-video-summarizer - Video transcription and summary',
        ],
        note: 'AI tutor endpoints have been moved to /api/ai-tutor',
      },
      404
    );
  } catch (error: unknown) {
    console.error('❌ Error in course-api:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
};
