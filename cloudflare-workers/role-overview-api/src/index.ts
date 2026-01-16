/**
 * Role Overview API - Cloudflare Worker
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
 * - GET  /health          - Health check
 * - POST /role-overview   - Generate role overview data
 * - POST /match-courses   - AI-powered course matching for a role
 * 
 * Fallback Chain: OpenRouter → Gemini → Static Fallback
 */

import { Env } from './types';
import { handleCors, jsonResponse } from './utils/cors';
import { handleRoleOverview } from './handlers/roleOverviewHandler';
import { handleCourseMatching } from './handlers/courseMatchingHandler';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    // Route handling
    switch (path) {
      case '/':
      case '/health':
        return jsonResponse({
          status: 'ok',
          service: 'role-overview-api',
          version: '1.1.0',
          endpoints: [
            'GET  /health - Health check',
            'POST /role-overview - Generate role overview data',
            'POST /match-courses - AI-powered course matching for a role',
          ],
        });

      case '/role-overview':
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Method not allowed' }, 405);
        }
        return handleRoleOverview(request, env);

      case '/match-courses':
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Method not allowed' }, 405);
        }
        return handleCourseMatching(request, env);

      default:
        return jsonResponse({ error: 'Not found' }, 404);
    }
  },
};
