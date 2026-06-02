import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost as handleExplorerActions } from './actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/explorer', '');

  try {
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok', service: 'explorer-api', version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: ['GET /health - Health check', 'POST /actions - Table sample queries'],
      }, request);
    }

    if (path === '/actions' && request.method === 'POST') {
      return handleExplorerActions(context);
    }

    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('[explorer-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
