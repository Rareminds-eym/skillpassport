/**
 * Password Reset Completion API (SkillPassport Proxy)
 * POST /api/auth/reset-password
 * 
 * Calls SSO Worker via service binding to complete password reset
 */

import { z } from 'zod';
import type { Env } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { apiLogger } from '../../lib/logger';

const resetPasswordSchema = z.object({
  token: z.string({ message: 'token is required' })
    .trim()
    .min(1, 'token is required'),
  password: z.string({ message: 'password is required' })
    .trim()
    .min(1, 'password is required')
});

const ssoResponseSchema = z.object({
  reset: z.boolean().optional()
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ResetPasswordRequest;
    try {
      const parsed = await request.json();
      const result = resetPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in reset password request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
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
      let errorText = 'Unknown error';
      try {
        errorText = await ssoResponse.text();
      } catch (e) {
        apiLogger.error('Failed to read error response', e as Error);
      }
      apiLogger.error('SSO Worker reset password failed', new Error(errorText));
      
      // Parse error message from SSO Worker
      let errorMessage = 'Failed to reset password';
      try {
        const errorData: { error?: string } = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message
      }
      
      return jsonResponse({
        success: false,
        error: errorMessage
      }, ssoResponse.status);
    }

    const ssoData = await ssoResponse.json();
    
    // Validate SSO response using Zod
    let validatedData: z.infer<typeof ssoResponseSchema>;
    try {
      validatedData = ssoResponseSchema.parse(ssoData);
    } catch (parseError) {
      apiLogger.error('Invalid SSO response format', parseError as Error);
      throw new Error('Invalid SSO response');
    }

    apiLogger.info('Password reset completed successfully');

    return jsonResponse({
      success: true,
      reset: validatedData.reset ?? true,
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
