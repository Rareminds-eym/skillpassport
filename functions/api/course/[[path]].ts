/**
 * Course API - Cloudflare Pages Function
 * Migrated from cloudflare-workers/course-api
 * 
 * Endpoints:
 * - /api/course/get-file-url - Generate presigned URLs for R2 files
 * - /api/course/ai-tutor-suggestions - Generate suggested questions for lessons
 * - /api/course/ai-tutor-chat - AI tutor chat with streaming
 * - /api/course/ai-tutor-feedback - Submit feedback on AI responses
 * - /api/course/ai-tutor-progress - Track student progress
 * - /api/course/ai-video-summarizer - Transcribe and summarize videos
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders } from '../../../src/functions-lib/cors';
import { jsonResponse } from '../../../src/functions-lib/response';
import { handleGetFileUrl } from './handlers/get-file-url';
import { handleAiTutorSuggestions } from './handlers/ai-tutor-suggestions';
import { handleAiTutorChat } from './handlers/ai-tutor-chat';
import { handleAiTutorFeedback } from './handlers/ai-tutor-feedback';
import { handleAiTutorProgress } from './handlers/ai-tutor-progress';
import { handleAiVideoSummarizer } from './handlers/ai-video-summarizer';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathSegments = context.params.path as string[] | undefined;
  const path = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : '');

  try {
    // Route requests
    if (path === '/get-file-url') {
      return await handleGetFileUrl(request, env as any);
    }

    if (path === '/ai-tutor-suggestions') {
      return await handleAiTutorSuggestions(request, env as any);
    }

    if (path === '/ai-tutor-chat') {
      return await handleAiTutorChat(request, env as any);
    }

    if (path === '/ai-tutor-feedback') {
      return await handleAiTutorFeedback(request, env as any);
    }

    if (path === '/ai-tutor-progress') {
      return await handleAiTutorProgress(request, env as any);
    }

    if (path === '/ai-video-summarizer') {
      return await handleAiVideoSummarizer(request, env as any, context.waitUntil);
    }

    // Health check
    if (path === '/health' || path === '/') {
      return jsonResponse({ 
        status: 'ok', 
        service: 'course-api',
        version: '2.0-pages-function',
        endpoints: ['/get-file-url', '/ai-tutor-suggestions', '/ai-tutor-chat', '/ai-tutor-feedback', '/ai-tutor-progress', '/ai-video-summarizer'],
        timestamp: new Date().toISOString() 
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);

  } catch (error) {
    console.error('[ERROR] course-api:', error);
    return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
  }
};
