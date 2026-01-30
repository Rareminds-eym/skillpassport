/**
 * Analyze Assessment API - Cloudflare Worker
 * 
 * A modular, well-structured API for AI-powered career assessment analysis.
 * Supports multiple grade levels with appropriate prompts:
 * - Middle School (grades 6-8)
 * - High School (grades 9-12)
 * - College (after 12th)
 * - After 10th (stream selection)
 * 
 * @version 2.0.0
 */

import type { Env } from './types';
import { corsHeaders, jsonResponse, handleCorsPreFlight } from './utils/cors';
import { getOpenRouterKey } from './utils/auth';
import { handleAnalyzeAssessment } from './handlers/analyzeHandler';
import { handleHealthCheck } from './handlers/healthHandler';
import { handleGenerateProgramCareerPaths } from './handlers/generateProgramCareerPaths';

/**
 * Validate environment configuration
 */
function validateEnvironment(env: Env): string | null {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'Server configuration error: Missing Supabase credentials';
  }

  if (!getOpenRouterKey(env)) {
    return 'Server configuration error: Missing OpenRouter API key';
  }

  return null;
}

/**
 * Main request handler
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Route requests
  switch (path) {
    case '/':
    case '/analyze-assessment':
      return handleAnalyzeAssessment(request, env);

    case '/generate-program-career-paths':
      return handleGenerateProgramCareerPaths(request, env);

    case '/health':
      return handleHealthCheck();

    default:
      return jsonResponse({
        error: 'Not found',
        message: 'Use POST /analyze-assessment to analyze assessment data',
        availableEndpoints: [
          'POST /analyze-assessment - Analyze student assessment',
          'POST /generate-program-career-paths - Generate AI career paths for programs',
          'GET /health - Health check'
        ]
      }, 404);
  }
}

/**
 * Worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCorsPreFlight();
    }

    // Validate environment
    const envError = validateEnvironment(env);
    if (envError) {
      return jsonResponse({ error: envError }, 500);
    }

    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('[ERROR] Unhandled error:', error);
      return jsonResponse({
        error: 'Internal server error',
        details: (error as Error)?.message
      }, 500);
    }
  }
};
