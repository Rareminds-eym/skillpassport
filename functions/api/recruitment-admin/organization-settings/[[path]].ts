/**
 * Recruitment Admin - Organization Settings API
 * Cloudflare Pages Function
 *
 * Handles organization settings management for recruitment admins:
 * - GET /api/recruitment-admin/organization-settings/:id - Fetch all settings
 * - PUT /api/recruitment-admin/organization-settings/:id - Update all settings
 * - POST /api/recruitment-admin/organization-settings/:id/company-profile - Update profile
 * - POST /api/recruitment-admin/organization-settings/:id/contacts - Update contacts
 * - POST /api/recruitment-admin/organization-settings/:id/verification - Update verification
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { handleCorsPreflightRequest } from '../../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../../lib/types';
import { withAuth, getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleGetSettings } from './handlers/get-settings';
import { handleUpdateSettings } from './handlers/update-settings';
import { handleUpdateProfile } from './handlers/update-profile';
import { handleUpdateContacts } from './handlers/update-contacts';
import { handleUpdateVerification } from './handlers/update-verification';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  let { request, env }: { request: Request; env: Record<string, string> } = context as any;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/recruitment-admin/organization-settings', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return apiSuccess(
        {
          status: 'ok',
          service: 'recruitment-admin-organization-settings',
          timestamp: new Date().toISOString(),
        },
        request
      );
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      env = authContext.env as Record<string, string>;
      request = authContext.request;
      const userId = getContextUser(authContext).id;

      // Parse path: /:organizationId/:subPath
      const pathMatch = path.match(/^\/([a-f0-9-]+)(\/.*)?$/);
      if (!pathMatch) {
        return apiError(400, 'INVALID_PATH', 'Invalid organization path', request);
      }

      const organizationId = pathMatch[1];
      const subPath = pathMatch[2] || '';

      // Route requests to appropriate handler
      if (subPath === '' && request.method === 'GET') {
        return await handleGetSettings(organizationId, env as unknown as PagesEnv, userId, request);
      }

      if (subPath === '' && request.method === 'PUT') {
        return await handleUpdateSettings(request, organizationId, env as unknown as PagesEnv, userId);
      }

      if (subPath === '/company-profile' && request.method === 'POST') {
        return await handleUpdateProfile(request, organizationId, env as unknown as PagesEnv, userId);
      }

      if (subPath === '/contacts' && request.method === 'POST') {
        return await handleUpdateContacts(request, organizationId, env as unknown as PagesEnv, userId);
      }

      if (subPath === '/verification' && request.method === 'POST') {
        return await handleUpdateVerification(request, organizationId, env as unknown as PagesEnv, userId);
      }

      return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
    })(context);
  } catch (error: any) {
    console.error('❌ Error in recruitment-admin-organization-settings:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Internal server error', request);
  }
};
