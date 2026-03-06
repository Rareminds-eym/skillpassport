/**
 * Shared Email API Worker
 * Multi-tenant email sending service
 */

import { Router } from 'itty-router';
import type { Env } from './types';
import { EmailWorkerError, AuthenticationError, RateLimitError, ValidationError } from './types';
import { CORS_HEADERS, VERSION } from './constants';
import { authenticateRequest } from './middleware/auth';
import { checkRateLimit } from './middleware/rateLimit';
import { logRequest, logResponse, logError } from './middleware/logger';
import { handleSend } from './routes/send';
import { handleHealth } from './routes/health';

const router = Router();

// ==================== CORS PREFLIGHT ====================

router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
});

// ==================== PUBLIC ROUTES (NO AUTH) ====================

router.get('/health', async (request, env: Env) => {
  return await handleHealth(request, env);
});

router.get('/', () => {
  return Response.json({
    service: 'Shared Email API',
    version: VERSION,
    endpoints: {
      'POST /send': 'Send email with HTML content',
      'GET /health': 'Health check',
    },
    documentation: 'https://docs.example.com/email-api',
  });
});

// ==================== AUTHENTICATED ROUTES ====================

router.post('/send', async (request, env: Env) => {
  const startTime = Date.now();
  
  try {
    // Authenticate
    authenticateRequest(request, env);
    logRequest(request, null);
    
    // Rate limit
    await checkRateLimit(env);
    
    // Handle request
    const response = await handleSend(request, env);
    
    // Add CORS headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    logResponse(request, response, null, Date.now() - startTime);
    return response;
  } catch (error: any) {
    logError(error, { path: '/send' });
    return handleError(error);
  }
});



// ==================== 404 HANDLER ====================

router.all('*', () => {
  return Response.json({
    success: false,
    error: 'Route not found',
    errorCode: 'NOT_FOUND',
  }, { status: 404, headers: CORS_HEADERS });
});

// ==================== ERROR HANDLER ====================

function handleError(error: any): Response {
  if (error instanceof AuthenticationError) {
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
    }, { status: error.statusCode, headers: CORS_HEADERS });
  }
  
  if (error instanceof RateLimitError) {
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      retryAfter: error.retryAfter,
    }, { 
      status: error.statusCode,
      headers: {
        ...CORS_HEADERS,
        'Retry-After': error.retryAfter.toString(),
      },
    });
  }
  
  if (error instanceof ValidationError) {
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      details: error.details,
    }, { status: error.statusCode, headers: CORS_HEADERS });
  }
  
  if (error instanceof EmailWorkerError) {
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      details: error.details,
    }, { status: error.statusCode, headers: CORS_HEADERS });
  }
  
  // Unknown error
  console.error('Unhandled error:', error);
  return Response.json({
    success: false,
    error: 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
  }, { status: 500, headers: CORS_HEADERS });
}

// ==================== WORKER EXPORT ====================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
