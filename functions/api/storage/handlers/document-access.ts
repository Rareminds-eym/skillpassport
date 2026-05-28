/**
 * Document Access Handler (Legacy - Unauthenticated)
 * 
 * DEPRECATED: Use media-proxy for authenticated access
 * This endpoint is kept for backward compatibility but should not be used for sensitive content.
 * 
 * GET /document-access?key={fileKey}&mode={inline|download}
 * GET /document-access?url={fileUrl}&mode={inline|download}
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { R2Client } from '../utils/r2-client';
import type { AuthenticatedContext } from '../[[path]]';

import {
  createAuthenticationError,
  createAuthorizationError,
  logErrorSafely,
} from '../utils/error-handling';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

/**
 * Proxy document from R2 storage (LEGACY - NO AUTH)
 * WARNING: This endpoint does not validate authentication
 */
export const handleDocumentAccess: PagesFunction = async (context) => {
  const { request, env } = context;
  const authenticatedContext = context as AuthenticatedContext;

  if (request.method !== 'GET') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const url = new URL(request.url);
    let fileKey = url.searchParams.get('key');
    const mode = url.searchParams.get('mode') || 'inline';

    // Also support extracting key from full URL
    const fileUrl = url.searchParams.get('url');
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl);
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Check if document is public
    const isPublic = fileKey.startsWith('public/') || fileKey.startsWith('uploads/public/');

    if (!isPublic) {
      // Private document - require authentication
      if (!authenticatedContext.user) {
        return createAuthenticationError('/document-access', 'missing_token');
      }

      // Validate ownership (check if file key contains user ID)
      const isOwner = fileKey.includes(authenticatedContext.user.id);
      if (!isOwner) {
        return createAuthorizationError(
          authenticatedContext.user.id,
          fileKey,
          'ownership_mismatch',
          'You do not have permission to access this document'
        );
      }
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Get object from R2
    const response = await r2Client.getObject(fileKey);

    if (!response.ok) {
      return apiError(404, 'NOT_FOUND', 'File not found or access denied', request);
    }

    // Extract filename from key
    const filename = fileKey.split('/').pop() || 'document';

    // Set Content-Disposition based on mode
    const contentDisposition =
      mode === 'download'
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`;

    // Get file content
    const fileContent = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const etag = response.headers.get('ETag') || '';

    // Return file content with proper headers
    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': fileContent.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'ETag': etag,
      },
    });
  } catch (error) {
    logErrorSafely('DocumentAccess', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
