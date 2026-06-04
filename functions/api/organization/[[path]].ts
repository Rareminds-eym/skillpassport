/**
 * Organization API Route Dispatcher
 *
 * Handles organization data operations via the apiPost/apiGet pattern.
 * All routes require SSO authentication.
 *
 * Routes:
 * - POST /api/organization (JSON body with action field)
 * - GET  /api/organization?action=xxx&param1=value1
 * - GET  /api/organization/health
 */

import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiMethodNotAllowed, apiNotFound } from '../../lib/response';
import { handleOrganizationPost, handleOrganizationGet } from './handler';

export async function onRequest(context: { request: Request; env: Record<string, unknown>; data?: any }) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/organization', '').replace(/\/$/, '');
  const method = context.request.method;

  // Health check - no auth required
  if (path === '/health') {
    return apiSuccess({ status: 'ok', service: 'organization', timestamp: new Date().toISOString() }, context.request);
  }

  // All other endpoints require SSO authentication
  return handleAuthenticatedRequest(context as AuthenticatedContext);
}

const handleAuthenticatedRequest = withAuth(async (context: AuthenticatedContext) => {
  const method = context.request.method;

  if (method === 'POST') {
    return handleOrganizationPost(context);
  }

  if (method === 'GET') {
    return handleOrganizationGet(context);
  }

  return apiMethodNotAllowed(context.request);
});
