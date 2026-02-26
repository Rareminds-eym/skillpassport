/**
 * Document Access Handler
 * 
 * Proxies documents from R2 storage with proper headers for viewing or downloading.
 * Supports multiple URL formats and modes (inline/download).
 * 
 * GET /document-access?key={fileKey}&mode={inline|download}
 * GET /document-access?url={fileUrl}&mode={inline|download}
 */

import { R2Client } from '../utils/r2-client';
import type { AuthenticatedContext } from '../[[path]]';
import {
  extractUserIdFromPath,
  validatePaymentReceiptOwnership,
  validateUploadOwnership,
  type OwnershipValidationResult,
} from '../utils/ownership';
import {
  createAuthenticationError,
  createAuthorizationError,
  logErrorSafely,
} from '../utils/error-handling';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

/**
 * Check if a document is public based on its path
 * 
 * Public documents:
 * - Course certificates (certificates/...)
 * - Course materials (courses/...)
 * 
 * Private documents:
 * - Payment receipts (payment_pdf/...)
 * - User uploads (uploads/...)
 * 
 * @param fileKey - The file key/path in R2 storage
 * @returns True if the document is public, false if private
 */
function checkIfPublicDocument(fileKey: string): boolean {
  if (!fileKey) return false;

  // Course certificates are public
  if (fileKey.startsWith('certificates/')) {
    return true;
  }

  // Course materials are public
  if (fileKey.startsWith('courses/')) {
    return true;
  }

  // Everything else is private by default
  return false;
}

/**
 * Validate document ownership for private documents
 * 
 * @param fileKey - The file key/path in R2 storage
 * @param userId - The authenticated user's ID
 * @returns Validation result with ownership status and reason
 */
function validateDocumentOwnership(
  fileKey: string,
  userId: string
): OwnershipValidationResult {
  // Check payment receipts
  if (fileKey.startsWith('payment_pdf/')) {
    return validatePaymentReceiptOwnership(fileKey, userId);
  }

  // Check user uploads
  if (fileKey.startsWith('uploads/')) {
    return validateUploadOwnership(fileKey, userId);
  }

  // For other private documents, check if user ID is in path
  const extractedUserId = extractUserIdFromPath(fileKey);
  if (extractedUserId && extractedUserId === userId) {
    return { isOwner: true };
  }

  return {
    isOwner: false,
    reason: 'User does not have permission to access this document',
  };
}

/**
 * Proxy document from R2 storage
 */
export const handleDocumentAccess: PagesFunction = async (context) => {
  const { request, env } = context;
  const authenticatedContext = context as AuthenticatedContext;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    let fileKey = url.searchParams.get('key');
    const mode = url.searchParams.get('mode') || 'inline'; // 'inline' for viewing, 'download' for downloading

    // Also support extracting key from full URL
    const fileUrl = url.searchParams.get('url');
    if (!fileKey && fileUrl) {
      // Extract key from various URL formats
      fileKey = R2Client.extractKeyFromUrl(fileUrl);
    }

    if (!fileKey) {
      return new Response(
        JSON.stringify({ error: 'File key or URL is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if document is public
    const isPublic = checkIfPublicDocument(fileKey);

    if (!isPublic) {
      // Private document - require authentication
      if (!authenticatedContext.user) {
        return createAuthenticationError('/document-access', 'missing_token');
      }

      // Validate ownership
      const ownership = validateDocumentOwnership(fileKey, authenticatedContext.user.id);
      if (!ownership.isOwner) {
        return createAuthorizationError(
          authenticatedContext.user.id,
          fileKey,
          'ownership_mismatch',
          ownership.reason || 'You do not have permission to access this document'
        );
      }
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Get object from R2
    const response = await r2Client.getObject(fileKey);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'File not found or access denied' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'ETag': etag,
      },
    });
  } catch (error) {
    logErrorSafely('DocumentAccess', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to access document',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
