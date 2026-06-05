/**
 * Analyze Assessment API - Cloudflare Pages Function
 * 
 * Comprehensive AI-powered career assessment analysis
 * Migrated from cloudflare-workers/analyze-assessment-api
 */

import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { withAuth, getContextUser } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleAnalyzeAssessment } from './handlers/analyze';
import { handleGenerateProgramCareerPaths } from './handlers/program-career-paths';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  let { request, env }: { request: Request; env: Record<string, string> } = context as any;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/analyze-assessment', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'analyze-assessment-api',
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
          hasSupabaseKey: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
          hasOpenRouter: !!(env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY),
          hasClaude: !!(env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY)
        }
      }, request);
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      env = authContext.env as Record<string, string>;
      request = authContext.request;
      const userId = getContextUser(authContext).id;

    // Main analyze endpoint
    if ((path === '' || path === '/' || path === '/analyze') && request.method === 'POST') {
      return await handleAnalyzeAssessment(request, env as unknown as PagesEnv, userId);
    }

    // Program career paths endpoint
    if (path === '/generate-program-career-paths' && request.method === 'POST') {
      return await handleGenerateProgramCareerPaths(request, env as unknown as PagesEnv);
    }

    // 404 for unknown routes
    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  })(context);
  } catch (error: any) {
    console.error('❌ Error in analyze-assessment-api:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Internal server error', request);
  }
};
