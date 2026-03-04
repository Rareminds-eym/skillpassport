/**
 * Media Proxy Handler (Authenticated)
 * 
 * Securely proxies media files from R2 storage with short-lived tokens.
 * Tokens expire after 5 minutes and are validated on each request.
 * 
 * GET /api/storage/media-proxy?token={authToken}
 */

import { validateFileKey } from '../utils/course-authorization';
import { validateMediaToken } from '../utils/token-crypto';
import { R2Client } from '../utils/r2-client';
import { validateDeviceFingerprint, validateReferer } from '../utils/fingerprint-validator';
import { generateDeviceMismatchPage, generateTokenExpiredPage, generateUnauthorizedPage } from '../utils/error-pages';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

/**
 * Proxy authenticated media from R2 storage using HttpOnly cookies
 */
export const handleMediaProxy: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token
    const signingSecret = env.SIGNING_SECRET;
    if (!signingSecret) {
      console.error('[MediaProxy] SIGNING_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validation = await validateMediaToken(token, signingSecret);
    if (!validation.valid || !validation.payload) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid or expired session' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { userId, courseId, lessonId, fileKey, fingerprint, userAgent: tokenUserAgent, sessionId: tokenSessionId } = validation.payload;

    // Fingerprint and User-Agent validation
    const requestFingerprint = url.searchParams.get('fp');
    const requestUserAgent = request.headers.get('User-Agent') || '';

    if (!fingerprint || !tokenUserAgent) {
      console.error('[MediaProxy] Token missing security data');
      return new Response(
        JSON.stringify({ error: 'Invalid token - security validation required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!requestFingerprint) {
      console.error('[MediaProxy] Request missing fingerprint');
      return new Response(
        JSON.stringify({ error: 'Device verification required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const deviceValidation = validateDeviceFingerprint(
      fingerprint,
      requestFingerprint,
      tokenUserAgent,
      requestUserAgent
    );

    if (!deviceValidation.valid) {
      console.error('[MediaProxy] Device validation failed:', deviceValidation.reason);
      return new Response(generateDeviceMismatchPage(deviceValidation.reason || 'Unknown error'), {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Validate Referer header
    const referer = request.headers.get('Referer');
    const requestUrl = new URL(request.url);
    const allowedDomains = [requestUrl.hostname, 'localhost', '127.0.0.1'];
    
    const refererValidation = validateReferer(referer, allowedDomains);
    if (!refererValidation.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request origin',
          details: refererValidation.reason 
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validateFileKey(fileKey, courseId, lessonId)) {
      return new Response(JSON.stringify({ error: 'Invalid file access' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const r2Client = new R2Client(env);
    
    // Handle range requests for video streaming
    const range = request.headers.get('Range');
    const r2Response = await r2Client.getObject(fileKey, range || undefined);

    if (!r2Response.ok) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract filename and headers
    const filename = fileKey.split('/').pop() || 'media';
    const contentType = r2Response.headers.get('Content-Type') || 'application/octet-stream';
    const contentLength = r2Response.headers.get('Content-Length');
    const contentRange = r2Response.headers.get('Content-Range');
    const etag = r2Response.headers.get('ETag') || '';

    // If range request, return 206
    if (range && contentRange) {
      return new Response(r2Response.body, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': contentRange,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength || '',
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          'Content-Disposition': `inline; filename="${filename}"`,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'ETag': etag,
        },
      });
    }

    // Return full file
    return new Response(r2Response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'ETag': etag,
      },
    });
  } catch (error) {
    console.error('[MediaProxy] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy media',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
