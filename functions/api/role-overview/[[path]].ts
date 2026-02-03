/**
 * Role Overview API - Cloudflare Pages Function
 * 
 * Generates comprehensive career role overview data including:
 * - Job responsibilities
 * - Industry demand
 * - Career progression
 * - Learning roadmap
 * - Recommended courses
 * - Free resources
 * - Action items
 * 
 * Endpoints:
 * - GET /health - Health check
 * - POST /role-overview - Generate role overview data
 * - POST /match-courses - AI-powered course matching for a role
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { handleRoleOverview } from './handlers/role-overview';
import { handleCourseMatching } from './handlers/course-matching';

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
  const path = url.pathname.replace('/api/role-overview', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'role-overview-api',
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'POST /role-overview - Generate role overview data',
          'POST /match-courses - AI-powered course matching for a role',
        ],
      });
    }

    // Generate role overview
    if (path === '/role-overview' && request.method === 'POST') {
      return handleRoleOverview(context);
    }

    // Match courses for role
    if (path === '/match-courses' && request.method === 'POST') {
      return handleCourseMatching(context);
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Unknown endpoint',
        availableEndpoints: [
          'GET /health - Health check',
          'POST /role-overview - Generate role overview data',
          'POST /match-courses - AI-powered course matching for a role',
        ],
      },
      404
    );
  } catch (error: any) {
    console.error('❌ Error in role-overview-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
