/**
 * Media Proxy Handler (Authenticated)
 * 
 * Securely proxies media files from R2 storage with short-lived tokens.
 * Tokens expire after 5 minutes and are validated on each request.
 * 
 * GET /api/storage/media-proxy?token={authToken}
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { validateFileKey } from '../utils/course-authorization';
import { validateMediaToken } from '../utils/token-crypto';
import { R2Client } from '../utils/r2-client';
import { validateDeviceFingerprint, validateReferer } from '../utils/fingerprint-validator';
import { generateDeviceMismatchPage } from '../utils/error-pages';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

/**
 * Proxy authenticated media from R2 storage using HttpOnly cookies
 */
export const handleMediaProxy: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return apiError(401, 'UNAUTHORIZED', 'Authentication token required', request);
    }

    // Validate token
    const signingSecret = env.SIGNING_SECRET;
    if (!signingSecret) {
      console.error('[MediaProxy] SIGNING_SECRET not configured');
      return apiError(500, 'INTERNAL_ERROR', 'Server configuration error', request);
    }

    const validation = await validateMediaToken(token, signingSecret);
    if (!validation.valid || !validation.payload) {
      return apiError(401, 'UNAUTHORIZED', validation.error || 'Invalid or expired session', request);
    }

    const { courseId, lessonId, fileKey, fingerprint, userAgent: tokenUserAgent } = validation.payload;

    // Fingerprint and User-Agent validation
    const requestFingerprint = url.searchParams.get('fp');
    const requestUserAgent = request.headers.get('User-Agent') || '';

    if (!fingerprint || !tokenUserAgent) {
      console.error('[MediaProxy] Token missing security data');
      return apiError(403, 'FORBIDDEN', 'Invalid token - security validation required', request);
    }

    if (!requestFingerprint) {
      console.error('[MediaProxy] Request missing fingerprint');
      return apiError(403, 'FORBIDDEN', 'Device verification required', request);
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
      return apiError(403, 'FORBIDDEN', 'Invalid request origin', request);
    }

    if (!validateFileKey(fileKey, courseId, lessonId)) {
      return apiError(403, 'FORBIDDEN', 'Invalid file access', request);
    }

    const r2Client = new R2Client(env);
    
    // Handle range requests for video streaming
    const range = request.headers.get('Range');
    const r2Response = await r2Client.getObject(fileKey, range || undefined);

    if (!r2Response.ok) {
      return apiError(404, 'NOT_FOUND', 'File not found', request);
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
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
