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
 * - GET /document-access - Proxy document access
 * - POST /signed-url - Generate signed URL for document
 * - POST /signed-urls - Batch generate signed URLs
 * - POST /upload-payment-receipt - Upload payment receipt PDF
 * - GET /payment-receipt - Get payment receipt
 * - GET /course-certificate - Get course certificate
 * - POST /extract-content - Extract text from PDF resources
 * - GET /files/:courseId/:lessonId - List files in lesson
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';

// Import all handlers
import { handleUpload } from './handlers/upload';
import { handleDelete } from './handlers/delete';
import { handlePresigned, handleConfirm, handleGetFileUrl } from './handlers/presigned';
import { handleDocumentAccess } from './handlers/document-access';
import { handleSignedUrl, handleSignedUrls } from './handlers/signed-url';
import { handleUploadPaymentReceipt, handleGetPaymentReceipt } from './handlers/payment-receipt';
import { handleCourseCertificate } from './handlers/certificate';
import { handleExtractContent } from './handlers/extract-content';
import { handleListFiles } from './handlers/list-files';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/storage', '');

  try {
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
            '/document-access',
            '/signed-url',
            '/signed-urls',
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
        ...context,
        params: { courseId, lessonId },
      });
    }

    // Route to handlers based on path
    switch (path) {
      case '/upload':
        return handleUpload(context);

      case '/delete':
        return handleDelete(context);

      case '/presigned':
        return handlePresigned(context);

      case '/confirm':
        return handleConfirm(context);

      case '/get-url':
      case '/get-file-url':
        return handleGetFileUrl(context);

      case '/document-access':
        return handleDocumentAccess(context);

      case '/signed-url':
        return handleSignedUrl(context);

      case '/signed-urls':
        return handleSignedUrls(context);

      case '/upload-payment-receipt':
        return handleUploadPaymentReceipt(context);

      case '/payment-receipt':
        return handleGetPaymentReceipt(context);

      case '/course-certificate':
        return handleCourseCertificate(context);

      case '/extract-content':
        return handleExtractContent(context);

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
              '/document-access',
              '/signed-url',
              '/signed-urls',
              '/upload-payment-receipt',
              '/payment-receipt',
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
