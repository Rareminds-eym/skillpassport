/**
 * Analyze Assessment API - Cloudflare Pages Function
 * 
 * Comprehensive AI-powered career assessment analysis
 * Migrated from cloudflare-workers/analyze-assessment-api
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { handleAnalyzeAssessment } from './handlers/analyze';
import { handleGenerateProgramCareerPaths } from './handlers/program-career-paths';

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
  const path = url.pathname.replace('/api/analyze-assessment', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'analyze-assessment-api',
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
          hasSupabaseKey: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
          hasOpenRouter: !!(env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY),
          hasClaude: !!(env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY)
        }
      });
    }

    // Main analyze endpoint
    if ((path === '' || path === '/' || path === '/analyze') && request.method === 'POST') {
      return await handleAnalyzeAssessment(request, env);
    }

    // Program career paths endpoint
    if (path === '/generate-program-career-paths' && request.method === 'POST') {
      return await handleGenerateProgramCareerPaths(request, env);
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Use POST /analyze-assessment to analyze assessment data',
        availableEndpoints: [
          'POST /analyze-assessment - Analyze student assessment',
          'POST /analyze-assessment/analyze - Analyze student assessment (alias)',
          'POST /analyze-assessment/generate-program-career-paths - Generate career paths for program',
          'GET /analyze-assessment/health - Health check'
        ],
      },
      404
    );
  } catch (error: any) {
    console.error('❌ Error in analyze-assessment-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
