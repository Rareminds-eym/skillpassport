/**
 * Password Reset Request API (SkillPassport Proxy)
 * POST /api/auth/forgot-password
 * 
 * Calls SSO Worker via service binding, then sends beautiful email template
 */

import { z } from 'zod';
import type { Env } from '../../lib/types';
import { jsonResponse } from '../../lib/response';
import { apiLogger } from '../../lib/logger';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'email is required' })
    .trim()
    .min(1, 'email is required')
    .email('Invalid email format'),
  redirect_url: z.string().trim().optional(),
});

type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ForgotPasswordRequest;
    try {
      const parsed = await request.json();
      const result = forgotPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in forgot password request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
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
      let errorText = 'Unknown error';
      try {
        errorText = await ssoResponse.text();
      } catch (e) {
        apiLogger.error('Failed to read error response', e as Error);
      }
      apiLogger.error('SSO Worker forgot password failed', new Error(errorText));
      
      return jsonResponse({
        success: false,
        error: 'Failed to process password reset request'
      }, ssoResponse.status);
    }

    const ssoData = await ssoResponse.json();
    if (typeof ssoData !== 'object' || ssoData === null) {
      throw new Error('Invalid SSO response');
    }

    apiLogger.info('Password reset request processed successfully', {
      email: body.email
    });

    return jsonResponse({
      success: true,
      message: (ssoData && typeof ssoData === 'object' && 'message' in ssoData && typeof ssoData.message === 'string') 
        ? ssoData.message 
        : 'If an account exists, a reset email has been sent.'
    });

  } catch (error) {
    apiLogger.error('Error processing forgot password request', error as Error);
    
    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
