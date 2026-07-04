// @authenticated-endpoint: User can delete their own account
/**
 * Delete Account API (SkillPassport Proxy)
 * POST /api/auth/delete-account
 *
 * Calls SSO Worker via service binding to delete authenticated user's account
 */

import { apiLogger } from '../../lib/logger';
import { jsonResponse } from '../../lib/response';
import type { Env } from '../../lib/types';

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    apiLogger.info('Processing delete account request via service binding');

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Extract access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return jsonResponse({
        success: false,
        error: 'Access token required'
      }, 401);
    }

    // Call SSO Worker via service binding using True RPC
    try {
      const result = await env.SSO_SERVICE.deleteAccount({
        access_token: accessToken,
        ip: request.headers.get('CF-Connecting-IP') ?? undefined,
        ua: request.headers.get('User-Agent') ?? undefined,
      });

      apiLogger.info('Account deletion completed successfully');

      return jsonResponse({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (ssoError: any) {
      apiLogger.error('SSO Worker delete account failed', ssoError);

      return jsonResponse({
        success: false,
        error: ssoError.message || 'Failed to delete account'
      }, 400);
    }

  } catch (error) {
    apiLogger.error('Error processing delete account request', error as Error);

    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
