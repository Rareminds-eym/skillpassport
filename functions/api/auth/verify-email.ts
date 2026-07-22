import { createLogger } from '../../lib/logger';
import { apiSuccess, apiError } from '../../lib/response';

/**
 * POST /api/auth/verify-email
 * 
 * Verifies email via sso-worker RPC
 */
export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  // Create structured logger
  const logger = createLogger('auth-verify-email', env.ENVIRONMENT || 'production');

  // Generate request ID for tracing
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  try {
    logger.info('verification_request_received', {
      requestId,
      path: new URL(request.url).pathname,
    });

    const body = await request.json() as any;
    const { token } = body;

    // Mask token in logs (show first 6 and last 4 chars)
    const maskedToken = token && token.length > 10
      ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}`
      : '[REDACTED]';

    logger.info('token_received', {
      requestId,
      token: maskedToken,
      hasToken: !!token,
    });

    if (!token) {
      logger.warn('validation_failed_missing_token', {
        requestId,
      });

      return apiError(400, 'VALIDATION_ERROR', 'token is required', request);
    }

    // Check if SSO_SERVICE binding exists
    if (!env.SSO_SERVICE) {
      logger.fatal('sso_service_binding_missing', undefined, {
        requestId,
        availableBindings: Object.keys(env).filter(k => k.includes('SSO') || k.includes('SERVICE')),
      });

      return apiError(500, 'INTERNAL_ERROR', 'SSO service not configured. Please contact support.', request);
    }

    logger.info('calling_sso_verify_email', {
      requestId,
      token: maskedToken,
    });

    // Call sso-worker RPC method for email verification
    const startTime = Date.now();
    const ssoService = env.SSO_SERVICE as any;
    const ssoResult = await ssoService.verifyEmail({
      token,
      ip: request.headers.get('CF-Connecting-IP') || undefined,
      ua: request.headers.get('User-Agent') || undefined,
    });
    const duration = Date.now() - startTime;

    logger.info('sso_verify_email_response', {
      requestId,
      success: ssoResult.success,
      duration,
    });

    if (!ssoResult.success) {
      logger.error('email_verification_failed', undefined, {
        requestId,
        error: ssoResult.error,
        token: maskedToken,
        duration,
      });

      // Generic message to client (no internal details exposed)
      return apiError(400, 'VERIFY_FAILED', 'Email verification failed. The link may be expired or invalid.', request);
    }

    logger.info('email_verified_successfully', {
      requestId,
      userId: ssoResult.user?.id,
      duration,
    });

    return apiSuccess({ verified: true, ...ssoResult }, request);

  } catch (error) {
    logger.error('verification_unexpected_error', error, {
      requestId,
    });

    // Generic message to client (no internal details exposed)
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.', request);
  }
}
