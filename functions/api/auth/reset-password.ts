/**
 * Password Reset Completion API (SkillPassport Proxy)
 * POST /api/auth/reset-password
 * 
 * Calls SSO Worker via service binding to complete password reset
 */

import type { Env } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { apiLogger } from '../../lib/logger';

interface ResetPasswordRequest {
  token: string;
  password: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body
    let body: ResetPasswordRequest;
    try {
      body = await request.json() as ResetPasswordRequest;
    } catch (error) {
      apiLogger.error('Invalid JSON in reset password request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
      }, 400);
    }

    // Validate required fields
    if (!body.token) {
      return jsonResponse({
        success: false,
        error: 'token is required'
      }, 400);
    }

    if (!body.password) {
      return jsonResponse({
        success: false,
        error: 'password is required'
      }, 400);
    }

    apiLogger.info('Processing reset password request via service binding');

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Call SSO Worker via service binding
    const ssoResponse = await env.SSO_SERVICE.fetch(
      new Request('https://internal/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: body.token,
          password: body.password
        }),
      })
    );

    if (!ssoResponse.ok) {
      const errorText = await ssoResponse.text().catch(() => 'Unknown error');
      apiLogger.error('SSO Worker reset password failed', new Error(errorText));
      
      // Parse error message from SSO Worker
      let errorMessage = 'Failed to reset password';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message
      }
      
      return jsonResponse({
        success: false,
        error: errorMessage
      }, ssoResponse.status);
    }

    const ssoData = await ssoResponse.json() as { reset: boolean };

    apiLogger.info('Password reset completed successfully');

    return jsonResponse({
      success: true,
      reset: ssoData.reset || true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    apiLogger.error('Error processing reset password request', error as Error);
    
    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
