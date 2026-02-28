/**
 * Document Access Handler (Legacy - Unauthenticated)
 * 
 * DEPRECATED: Use media-proxy for authenticated access
 * This endpoint is kept for backward compatibility but should not be used for sensitive content.
 * 
 * GET /document-access?key={fileKey}&mode={inline|download}
 * GET /document-access?url={fileUrl}&mode={inline|download}
 */

import { R2Client } from '../utils/r2-client';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

/**
 * Proxy document from R2 storage (LEGACY - NO AUTH)
 * WARNING: This endpoint does not validate authentication
 */
export const handleDocumentAccess: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(
        JSON.stringify({ error: 'File key or URL is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
        'Cache-Control': 'private, max-age=3600',
        'ETag': etag,
      },
    });
  } catch (error) {
    console.error('[DocumentAccess] Error proxying document:', error);
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
