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
import { withAuth } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

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

function routeRequest(context: any, path: string): Response | Promise<Response> {
  // Health check
  if (!path || path === '/') {
    if (context.request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'storage-api',
        endpoints: [
          '/upload', '/delete', '/presigned', '/confirm', '/get-url', '/get-file-url',
          '/document-access (LEGACY)', '/signed-url', '/signed-urls',
          '/get-authenticated-url (SECURE)', '/media-proxy (SECURE)',
          '/upload-payment-receipt', '/payment-receipt', '/course-certificate',
          '/extract-content', '/files/:courseId/:lessonId',
        ],
        timestamp: new Date().toISOString(),
      });
    }
  }

  const filesMatch = path.match(/^\/files\/([^\/]+)\/([^\/]+)$/);
  if (filesMatch) {
    const [, courseId, lessonId] = filesMatch;
    return handleListFiles({ ...context, params: { courseId, lessonId } });
  }

  switch (path) {
    case '/upload': return handleUpload(context);
    case '/delete': return handleDelete(context);
    case '/presigned': return handlePresigned(context);
    case '/confirm': return handleConfirm(context);
    case '/get-url': case '/get-file-url': return handleGetFileUrl(context);
    case '/document-access': return handleDocumentAccess(context);
    case '/signed-url': return handleSignedUrl(context);
    case '/signed-urls': return handleSignedUrls(context);
    case '/upload-payment-receipt': return handleUploadPaymentReceipt(context);
    case '/payment-receipt/presigned': return handleGetPaymentReceiptPresigned(context);
    case '/payment-receipt': return handleGetPaymentReceipt(context);
    case '/course-certificate': return handleCourseCertificate(context);
    case '/extract-content': return handleExtractContent(context);
    case '/get-authenticated-url': return handleGetAuthenticatedUrl(context);
    case '/media-proxy': return handleMediaProxy(context);
    default:
      return jsonResponse({ error: 'Not found', availableEndpoints: ['/upload', '/delete', '/presigned', '/confirm', '/get-url', '/get-file-url', '/document-access (LEGACY)', '/signed-url', '/signed-urls', '/get-authenticated-url (SECURE)', '/media-proxy (SECURE)', '/upload-payment-receipt', '/payment-receipt', '/payment-receipt/presigned', '/course-certificate', '/extract-content', '/files/:courseId/:lessonId'] }, 404);
  }
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/storage', '');

  const PUBLIC_ENDPOINTS = ['/', '/course-certificate', '/extract-content', '/media-proxy'];
  const isPublic = PUBLIC_ENDPOINTS.includes(path);

  try {
    if (isPublic) {
      return await routeRequest(context, path);
    }

    return withAuth(async (authContext: AuthenticatedContext) => {
      const storageContext = {
        ...context,
        data: authContext.data,
        user: authContext.data.user,
        supabase: getServiceClient(authContext.env),
        supabaseAdmin: getServiceClient(authContext.env),
      };
      return await routeRequest(storageContext, path);
    })(context);
  } catch (error) {
    console.error('Storage API Error:', error);
    return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
  }
};
