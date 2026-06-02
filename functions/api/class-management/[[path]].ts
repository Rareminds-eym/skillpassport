import { handleCorsPreflightRequest } from '../../lib/cors';
import { apiSuccess, apiError } from '../../lib/response';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost as handleClassManagementActions } from './actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/class-management', '');

  try {
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok', service: 'class-management-api', version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: ['POST /actions - Class management actions'],
      }, request);
    }

    if (path === '/actions' && request.method === 'POST') {
      return handleClassManagementActions(context);
    }

    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  } catch (error: unknown) {
    console.error('[class-management-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(500, 'INTERNAL_ERROR', message, request);
  }
};
