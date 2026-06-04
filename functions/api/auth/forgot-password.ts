/**
 * Password Reset Request API (SkillPassport Proxy)
 * POST /api/auth/forgot-password
 * 
 * Calls SSO Worker via service binding, then sends beautiful email template
 */

import type { Env } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { apiLogger } from '../../lib/logger';

interface ForgotPasswordRequest {
  email: string;
  redirect_url?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body
    let body: ForgotPasswordRequest;
    try {
      body = await request.json() as ForgotPasswordRequest;
    } catch (error) {
      apiLogger.error('Invalid JSON in forgot password request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
      }, 400);
    }

    // Validate required fields
    if (!body.email) {
      return jsonResponse({
        success: false,
        error: 'email is required'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return jsonResponse({
        success: false,
        error: 'Invalid email format'
      }, 400);
    }

    apiLogger.info('Processing forgot password request via service binding', {
      email: body.email
    });

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Call SSO Worker via service binding
    // SSO Worker will handle token generation and call back to SkillPassport for email template
    const ssoResponse = await env.SSO_SERVICE.fetch(
      new Request('https://internal/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email,
          redirect_url: body.redirect_url
        }),
      })
    );

    if (!ssoResponse.ok) {
      const errorText = await ssoResponse.text().catch(() => 'Unknown error');
      apiLogger.error('SSO Worker forgot password failed', new Error(errorText));
      
      return jsonResponse({
        success: false,
        error: 'Failed to process password reset request'
      }, ssoResponse.status);
    }

    const ssoData = await ssoResponse.json() as { message: string };

    apiLogger.info('Password reset request processed successfully', {
      email: body.email
    });

    return jsonResponse({
      success: true,
      message: ssoData.message || 'If an account exists, a reset email has been sent.'
    });

  } catch (error) {
    apiLogger.error('Error processing forgot password request', error as Error);
    
    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
