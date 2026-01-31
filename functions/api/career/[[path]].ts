/**
 * Career API - Cloudflare Pages Function
 * Migrated from cloudflare-workers/career-api
 * 
 * Endpoints:
 * - /api/career/chat - Career AI chat with streaming
 * - /api/career/recommend-opportunities - Get job recommendations
 * - /api/career/analyze-assessment - Analyze career assessment
 * - /api/career/generate-embedding - Generate embeddings for opportunities/students
 * - /api/career/generate-field-keywords - Generate domain keywords for fields
 * - /api/career/parse-resume - Parse resume text
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders } from '../../../src/functions-lib/cors';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getAPIKeys } from '../shared/ai-config';
import { handleCareerChat } from './handlers/chat';
import { handleRecommendOpportunities } from './handlers/recommend';
import { handleAnalyzeAssessment } from './handlers/analyze-assessment';
import { handleGenerateEmbedding } from './handlers/generate-embedding';
import { handleGenerateFieldKeywords } from './handlers/field-keywords';
import { handleParseResume } from './handlers/parse-resume';

// Helper to get OpenRouter API key (uses shared utility)
export const getOpenRouterKey = (env: any): string | undefined => {
  return getAPIKeys(env).openRouter;
};

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathSegments = context.params.path as string[] | undefined;
  const path = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : '');

  // Validate environment
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  try {
    // Route requests
    if (path === '/chat' || path === '/career-ai-chat' || path === '/') {
      if (!getOpenRouterKey(env)) {
        return jsonResponse({ error: 'AI service not configured' }, 500);
      }
      return await handleCareerChat(request, env as any);
    }

    if (path === '/recommend-opportunities' || path === '/recommend') {
      return await handleRecommendOpportunities(request, env as any);
    }

    if (path === '/analyze-assessment') {
      if (!getOpenRouterKey(env)) {
        return jsonResponse({ error: 'AI service not configured' }, 500);
      }
      return await handleAnalyzeAssessment(request, env as any);
    }

    if (path === '/generate-embedding') {
      return await handleGenerateEmbedding(request, env as any);
    }

    if (path === '/generate-field-keywords') {
      if (!getOpenRouterKey(env)) {
        return jsonResponse({ error: 'AI service not configured', useFallback: true }, 500);
      }
      return await handleGenerateFieldKeywords(request, env as any);
    }

    if (path === '/parse-resume') {
      if (!getOpenRouterKey(env)) {
        return jsonResponse({ error: 'AI service not configured' }, 500);
      }
      return await handleParseResume(request, env as any);
    }

    // Health check
    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'career-api',
        version: '2.0-pages-function',
        endpoints: ['/chat', '/recommend-opportunities', '/analyze-assessment', '/generate-embedding', '/generate-field-keywords', '/parse-resume'],
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ 
      error: 'Not found', 
      availableEndpoints: ['/chat', '/recommend-opportunities', '/analyze-assessment', '/generate-embedding', '/generate-field-keywords', '/parse-resume'] 
    }, 404);

  } catch (error) {
    console.error('[ERROR] career-api:', error);
    return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
  }
};
