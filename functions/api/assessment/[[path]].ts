import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost as handleAssessmentActions } from './handlers/actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/assessment', '');

  try {
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'assessment-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'POST /actions - Assessment data CRUD',
        ],
      }, request);
    }

    if (path === '/actions' && request.method === 'POST') {
      return handleAssessmentActions(context);
    }

    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('[assessment-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
