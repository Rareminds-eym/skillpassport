/**
 * Educator API - Cloudflare Pages Function
 * 
 * Endpoints:
 * - /api/educator/chat - Educator AI chat with streaming
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders } from '../../../src/functions-lib/cors';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getAPIKeys } from '../shared/ai-config';
import { handleEducatorChat } from './handlers/chat';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const pathSegments = context.params.path as string[] | undefined;
  const path = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : '');

  // Validate environment
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  try {
    // Route requests
    if (path === '/chat' || path === '/') {
      const { openRouter } = getAPIKeys(env as any);
      if (!openRouter) {
        return jsonResponse({ error: 'AI service not configured' }, 500);
      }
      return await handleEducatorChat(request, env as any);
    }

    // Health check
    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'educator-api',
        version: '1.0-pages-function',
        endpoints: ['/chat'],
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ 
      error: 'Not found', 
      availableEndpoints: ['/chat'] 
    }, 404);

  } catch (error) {
    console.error('[ERROR] educator-api:', error);
    return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
  }
};
