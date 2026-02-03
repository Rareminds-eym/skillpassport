/**
 * Course Certificate Handler
 *
 * Handles course certificate file access:
 * - GET /course-certificate - Get course certificate file (typically PNG/image)
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { corsHeaders } from '../../../../src/functions-lib/cors';
import { R2Client } from '../utils/r2-client';

/**
 * Get course certificate file
 * Supports both key and URL parameters
 * Default mode is 'inline' for viewing in browser
 */
export const handleCourseCertificate: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const url = new URL(request.url);
    let fileKey = url.searchParams.get('key');
    const mode = url.searchParams.get('mode') || 'inline'; // 'inline' for viewing, 'download' for downloading

    // Also support extracting key from full URL
    const fileUrl = url.searchParams.get('url');
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl);

      // If extraction failed, try certificates specific pattern
      if (!fileKey) {
        const pathMatch = fileUrl.match(/\/certificates\/(.+)$/);
        if (pathMatch) {
          fileKey = `certificates/${pathMatch[1]}`;
        }
      }
    }

    if (!fileKey) {
      return jsonResponse({ error: 'File key or URL is required' }, 400);
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Get object from R2
    const response = await r2Client.getObject(fileKey);

    if (!response.ok) {
      return jsonResponse(
        { error: 'File not found or access denied', status: response.status },
        response.status
      );
    }

    // Get file content and content type
    const fileContent = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';

    // Extract filename from key
    const filename = fileKey.split('/').pop() || 'certificate.png';

    // Set Content-Disposition based on mode
    const contentDisposition =
      mode === 'download'
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`;

    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': fileContent.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[CourseCertificate] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to get certificate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
