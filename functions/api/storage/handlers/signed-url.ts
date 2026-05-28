/**
 * Signed URL Handlers
 *
 * Generates signed URLs that proxy through the document-access endpoint:
 * - POST /signed-url - Generate signed URL for single document
 * - POST /signed-urls - Batch generate signed URLs for multiple documents
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { R2Client } from '../utils/r2-client';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

interface SignedUrlRequestBody {
  url?: string;
  fileKey?: string;
  expiresIn?: number;
}

interface SignedUrlsRequestBody {
  urls: string[];
  expiresIn?: number;
}

/**
 * Generate signed URL for single document
 * Returns a proxy URL through /document-access endpoint
 */
export const handleSignedUrl: PagesFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = (await request.json()) as SignedUrlRequestBody;
    const { url: fileUrl, fileKey: providedKey, expiresIn = 3600 } = body;

    let fileKey = providedKey ?? undefined;

    // Extract file key from URL if not provided directly
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl) ?? undefined;
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Generate a signed URL that proxies through our document access endpoint
    const baseUrl = new URL(request.url).origin;
    const signedUrl = `${baseUrl}/api/storage/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;

    return apiSuccess({
      signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }, request);
  } catch (error) {
    console.error('[SignedUrl] Error generating signed URL:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};

/**
 * Batch generate signed URLs for multiple documents
 * Returns proxy URLs through /document-access endpoint
 */
export const handleSignedUrls: PagesFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = (await request.json()) as SignedUrlsRequestBody;
    const { urls, expiresIn = 3600 } = body;

    // Validate URLs array
    if (!urls || !Array.isArray(urls)) {
      return apiError(400, 'VALIDATION_ERROR', 'URLs array is required', request);
    }

    if (urls.length === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'URLs array cannot be empty', request);
    }

    const signedUrls: Record<string, string> = {};
    const baseUrl = new URL(request.url).origin;

    for (const fileUrl of urls) {
      // Extract file key from URL
      const fileKey = R2Client.extractKeyFromUrl(fileUrl);

      if (fileKey) {
        const signedUrl = `${baseUrl}/api/storage/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;
        signedUrls[fileUrl] = signedUrl;
      } else {
        // Fallback to original URL if we can't extract the key
        signedUrls[fileUrl] = fileUrl;
      }
    }

    return apiSuccess({
      signedUrls,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }, request);
  } catch (error) {
    console.error('[SignedUrls] Error generating signed URLs:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
