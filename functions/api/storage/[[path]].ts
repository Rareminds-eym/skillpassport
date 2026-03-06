/**
 * Storage API - Pages Function
 * Handles R2 storage operations
 *
 * Endpoints:
 * - POST /upload - Upload file to R2
 * - POST /delete - Delete file from R2
 * - POST /presigned - Generate presigned URL for upload
 * - POST /confirm - Confirm upload completion
 * - POST /get-url, /get-file-url - Get file URL from key
 * - GET /document-access - Proxy document access (LEGACY - NO AUTH)
 * - POST /signed-url - Generate signed URL for document
 * - POST /signed-urls - Batch generate signed URLs
 * - POST /get-authenticated-url - Generate authenticated URL (SECURE)
 * - GET /media-proxy - Proxy authenticated media (SECURE)
 * - POST /upload-payment-receipt - Upload payment receipt PDF
 * - GET /payment-receipt - Get payment receipt
 * - GET /course-certificate - Get course certificate
 * - POST /extract-content - Extract text from PDF resources
 * - GET /files/:courseId/:lessonId - List files in lesson
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';
import { authenticateUser, AuthResult } from '../shared/auth';
import { createAuthenticationError } from './utils/error-handling';

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

// Define public endpoints that don't require JWT authentication
// Note: /media-proxy uses token-based auth in URL params, not JWT
const PUBLIC_ENDPOINTS = ['/', '/course-certificate', '/extract-content', '/media-proxy'];

/**
 * Check if the given path is a public endpoint
 */
function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.includes(path);
}

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

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/storage', '');

  try {
    // Create authenticated context
    let authenticatedContext: AuthenticatedContext = { ...context };

    // Check if endpoint requires authentication
    if (!isPublicEndpoint(path)) {
      // Attempt authentication for protected endpoints
      const authResult = await authenticateUser(request, env as unknown as Record<string, string>);
      
      if (!authResult) {
        // Authentication failed - return 401 with standardized error
        return createAuthenticationError(path, 'missing_token');
      }

      // Attach user context to the request
      authenticatedContext = {
        ...context,
        user: authResult.user,
        supabase: authResult.supabase,
        supabaseAdmin: authResult.supabaseAdmin,
      };
    }

    // Health check
    if (!path || path === '/') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'storage-api',
          endpoints: [
            '/upload',
            '/delete',
            '/presigned',
            '/confirm',
            '/get-url',
            '/get-file-url',
            '/document-access (LEGACY)',
            '/signed-url',
            '/signed-urls',
            '/get-authenticated-url (SECURE)',
            '/media-proxy (SECURE)',
            '/upload-payment-receipt',
            '/payment-receipt',
            '/course-certificate',
            '/extract-content',
            '/files/:courseId/:lessonId',
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for /files/:courseId/:lessonId pattern
    const filesMatch = path.match(/^\/files\/([^\/]+)\/([^\/]+)$/);
    if (filesMatch) {
      const [, courseId, lessonId] = filesMatch;
      return handleListFiles({
        ...authenticatedContext,
        params: { courseId, lessonId },
      } as any);
    }

    // Route to handlers based on path
    switch (path) {
      case '/upload':
        return handleUpload(authenticatedContext as any);

      case '/delete':
        return handleDelete(authenticatedContext as any);

      case '/presigned':
        return handlePresigned(authenticatedContext as any);

      case '/confirm':
        return handleConfirm(authenticatedContext as any);

      case '/get-url':
      case '/get-file-url':
        return handleGetFileUrl(authenticatedContext as any);

      case '/document-access':
        return handleDocumentAccess(authenticatedContext as any);

      case '/signed-url':
        return handleSignedUrl(authenticatedContext as any);

      case '/signed-urls':
        return handleSignedUrls(authenticatedContext as any);

      case '/upload-payment-receipt':
        return handleUploadPaymentReceipt(authenticatedContext as any);

      case '/payment-receipt/presigned':
        return handleGetPaymentReceiptPresigned(authenticatedContext as any);

      case '/payment-receipt':
        return handleGetPaymentReceipt(authenticatedContext as any);

      case '/course-certificate':
        return handleCourseCertificate(authenticatedContext as any);

      case '/extract-content':
        return handleExtractContent(authenticatedContext as any);

      case '/get-authenticated-url':
        return handleGetAuthenticatedUrl(context);

      case '/media-proxy':
        return handleMediaProxy(context);

      default:
        return jsonResponse(
          {
            error: 'Not found',
            availableEndpoints: [
              '/upload',
              '/delete',
              '/presigned',
              '/confirm',
              '/get-url',
              '/get-file-url',
              '/document-access (LEGACY)',
              '/signed-url',
              '/signed-urls',
              '/get-authenticated-url (SECURE)',
              '/media-proxy (SECURE)',
              '/upload-payment-receipt',
              '/payment-receipt',
              '/payment-receipt/presigned',
              '/course-certificate',
              '/extract-content',
              '/files/:courseId/:lessonId',
            ],
          },
          404
        );
    }
  } catch (error) {
    console.error('Storage API Error:', error);
    return jsonResponse(
      {
        error: (error as Error).message || 'Internal server error',
      },
      500
    );
  }
};
