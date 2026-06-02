import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost as handlePlacementActions } from './actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/placement', '');

  try {
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok', service: 'placement-api', version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: ['GET /health', 'POST /actions'],
      }, request);
    }

    if (path === '/actions' && request.method === 'POST') {
      return handlePlacementActions(context);
    }

    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('[placement-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
