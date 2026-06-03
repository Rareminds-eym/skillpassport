/**
 * Storage API - Pages Function
 * Handles R2 storage operations with JWT authentication
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { corsHeaders } from '../../../src/functions-lib/cors';
import { authenticateUser, AuthResult } from '../shared/auth';
import { createAuthenticationError } from './utils/error-handling';
import { getLogger } from '../../../src/shared/config/logging';

const logger = getLogger('storage-api');

// Import all handlers
import { handleUpload } from './handlers/upload';
import { handleDelete } from './handlers/delete';
import { handlePresigned, handleConfirm, handleGetFileUrl } from './handlers/presigned';
import { handleDocumentAccess } from './handlers/document-access';
import { handleSignedUrl, handleSignedUrls } from './handlers/signed-url';
import { handleUploadPaymentReceipt, handleGetPaymentReceipt, handleGetPaymentReceiptPresigned } from './handlers/payment-receipt';
import { handleCourseCertificate } from './handlers/certificate';
import { handleExtractContent } from './handlers/extract-content';
import { handleListFiles } from './handlers/list-files';
import { handleGetAuthenticatedUrl } from './handlers/get-authenticated-url';
import { handleMediaProxy } from './handlers/media-proxy';

// Extended context type with authentication
export interface AuthenticatedContext {
  request: Request;
  env: any;
  params?: Record<string, string>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: () => Promise<Response>;
  data?: Record<string, any>;
  user?: AuthResult['user'];
  supabase?: AuthResult['supabase'];
  supabaseAdmin?: AuthResult['supabaseAdmin'];
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight - allow all origins, JWT auth via Authorization header
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
        // Storage API specific headers
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey, x-upload-context',
      }
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/storage', '');

  try {
    // Health check endpoint
    if (!path || path === '/') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'storage-api',
          version: '2.0',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Public endpoint: course certificates are shareable credentials
    if (path === '/course-certificate') {
      return handleCourseCertificate(context);
    }

    // Token-based auth endpoint: media proxy uses signed tokens
    if (path === '/media-proxy') {
      return handleMediaProxy(context);
    }

    // All other endpoints require JWT authentication
    const authResult = await authenticateUser(request, env as unknown as Record<string, string>);
    
    if (!authResult) {
      logger.warn('Authentication required', { path, method: request.method });
      return createAuthenticationError(path, 'missing_token');
    }

    // Create authenticated context with proper typing
    const authenticatedContext: AuthenticatedContext = {
      ...context,
      user: authResult.user,
      supabase: authResult.supabase,
      supabaseAdmin: authResult.supabaseAdmin,
    };

    // Check for /files/:courseId/:lessonId pattern
    const filesMatch = path.match(/^\/files\/([^\/]+)\/([^\/]+)$/);
    if (filesMatch) {
      const [, courseId, lessonId] = filesMatch;
      return handleListFiles({
        ...authenticatedContext,
        params: { courseId, lessonId },
      } as Parameters<typeof handleListFiles>[0]);
    }

    // Route to authenticated handlers
    switch (path) {
      case '/upload':
        return handleUpload(authenticatedContext as Parameters<typeof handleUpload>[0]);

      case '/delete':
        return handleDelete(authenticatedContext as Parameters<typeof handleDelete>[0]);

      case '/presigned':
        return handlePresigned(authenticatedContext as Parameters<typeof handlePresigned>[0]);

      case '/confirm':
        return handleConfirm(authenticatedContext as Parameters<typeof handleConfirm>[0]);

      case '/get-url':
      case '/get-file-url':
        return handleGetFileUrl(authenticatedContext as Parameters<typeof handleGetFileUrl>[0]);

      case '/document-access':
        return handleDocumentAccess(authenticatedContext as Parameters<typeof handleDocumentAccess>[0]);

      case '/signed-url':
        return handleSignedUrl(authenticatedContext as Parameters<typeof handleSignedUrl>[0]);

      case '/signed-urls':
        return handleSignedUrls(authenticatedContext as Parameters<typeof handleSignedUrls>[0]);

      case '/upload-payment-receipt':
        return handleUploadPaymentReceipt(authenticatedContext as Parameters<typeof handleUploadPaymentReceipt>[0]);

      case '/payment-receipt/presigned':
        return handleGetPaymentReceiptPresigned(authenticatedContext as Parameters<typeof handleGetPaymentReceiptPresigned>[0]);

      case '/payment-receipt':
        return handleGetPaymentReceipt(authenticatedContext as Parameters<typeof handleGetPaymentReceipt>[0]);

      case '/extract-content':
        return handleExtractContent(authenticatedContext as Parameters<typeof handleExtractContent>[0]);

      case '/get-authenticated-url':
        return handleGetAuthenticatedUrl(authenticatedContext as Parameters<typeof handleGetAuthenticatedUrl>[0]);

      default:
        return jsonResponse(
          {
            error: 'Endpoint not found',
            path,
          },
          404
        );
    }
  } catch (error) {
    logger.error('Storage API Error', error instanceof Error ? error : new Error(String(error)));
    return jsonResponse(
      {
        error: (error as Error).message || 'Internal server error',
      },
      500
    );
  }
};
