/**
 * Signed URL Handlers
 *
 * Generates signed URLs that proxy through the document-access endpoint:
 * - POST /signed-url - Generate signed URL for single document
 * - POST /signed-urls - Batch generate signed URLs for multiple documents
 */

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
export const handleSignedUrl: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as SignedUrlRequestBody;
    const { url: fileUrl, fileKey: providedKey, expiresIn = 3600 } = body;

    let fileKey = providedKey;

    // Extract file key from URL if not provided directly
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl);
    }

    if (!fileKey) {
      return new Response(JSON.stringify({ error: 'File key or URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate a signed URL that proxies through our document access endpoint
    const baseUrl = new URL(request.url).origin;
    const signedUrl = `${baseUrl}/api/storage/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SignedUrl] Error generating signed URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate signed URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Batch generate signed URLs for multiple documents
 * Returns proxy URLs through /document-access endpoint
 */
export const handleSignedUrls: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as SignedUrlsRequestBody;
    const { urls, expiresIn = 3600 } = body;

    // Validate URLs array
    if (!urls || !Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: 'URLs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: 'URLs array cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(
      JSON.stringify({
        success: true,
        signedUrls,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SignedUrls] Error generating signed URLs:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate signed URLs',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
