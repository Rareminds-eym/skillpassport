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

import { withAuth, withAuthAllowUnverified } from '../../lib/auth';
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

  // POST handlers include signup flow actions (createLocalOrganization,
  // createOrganizationRecruitmentSettings) that must work immediately after SSO
  // signup when the JWT still has is_email_verified: false. Use
  // withAuthAllowUnverified so these succeed — the user is redirected to
  // /verify-email immediately after signup completes.
  if (method === 'POST') {
    return handlePostRequest(context as AuthenticatedContext);
  }

  // GET handlers are read-only data access — require full auth (email verified)
  if (method === 'GET') {
    // Public: invitation token validation — the token itself is the authorization
    // (random unguessable string). Returned data is non-sensitive (email, org name, role).
    // Only the accept endpoint (POST) requires authentication.
    const action = url.searchParams.get('action');
    if (action === 'getInvitationByToken') {
      return handleOrganizationGet(context);
    }
    return handleGetRequest(context as AuthenticatedContext);
  }

  return apiMethodNotAllowed(context.request);
}

const handlePostRequest = withAuthAllowUnverified(async (context: AuthenticatedContext) => {
  return handleOrganizationPost(context);
});

const handleGetRequest = withAuth(async (context: AuthenticatedContext) => {
  return handleOrganizationGet(context);
});
