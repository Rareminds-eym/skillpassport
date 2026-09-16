/**
 * Legacy URL Handlers
 * 
 * Handles URL helpers after moving to binding-only R2:
 * - POST /presigned - Deprecated; direct R2 presigned uploads are disabled
 * - POST /confirm - Confirm upload completion and get public URL
 * - POST /get-url - Get authenticated proxy URL from file key
 * - POST /get-file-url - Alias for get-url
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { R2Client } from '../utils/r2-client';
import type { AuthenticatedContext } from '../[[path]]';
import {
  createAuthenticationError,
  createAuthorizationError,
  logErrorSafely,
} from '../utils/error-handling';

type PagesFunction = (context: AuthenticatedContext) => Promise<Response> | Response;

interface ConfirmRequestBody {
  fileKey: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface GetUrlRequestBody {
  fileKey: string;
}

function createDocumentProxyUrl(request: Request, fileKey: string, mode: 'inline' | 'download' = 'inline'): string {
  const url = new URL(request.url);
  return new URL(
    `/api/storage/document-access?key=${encodeURIComponent(fileKey)}&mode=${mode}`,
    url.origin
  ).toString();
}

/**
 * Direct-to-R2 presigned uploads are not supported with binding-only R2.
 * Clients should upload through POST /api/storage/upload instead.
 */
export const handlePresigned: PagesFunction = async (context) => {
  const { request, user } = context;

  // Require authentication
  if (!user) {
    return createAuthenticationError('/presigned', 'missing_token');
  }

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    return apiError(
      410,
      'PRESIGNED_UPLOAD_DISABLED',
      'Direct R2 presigned uploads are disabled. Use POST /api/storage/upload.',
      request
    );
  } catch (error) {
    logErrorSafely('Presigned', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};

/**
 * Confirm upload completion and return public URL
 */
export const handleConfirm: PagesFunction = async (context) => {
  const { request, env, user } = context;

  // Require authentication
  if (!user) {
    return createAuthenticationError('/confirm', 'missing_token');
  }

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = await request.json() as ConfirmRequestBody;
    const { fileKey, fileName, fileSize, fileType } = body;

    // Validate required fields
    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing fileKey', request);
    }

    // Validate that fileKey contains authenticated user's ID
    if (!fileKey.includes(user.id)) {
      return createAuthorizationError(
        user.id,
        fileKey,
        'user_id_mismatch',
        'File key does not match authenticated user'
      );
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate public URL
    const fileUrl = r2Client.getPublicUrl(fileKey);

    return apiSuccess({
      key: fileKey,
      url: fileUrl,
      name: fileName,
      size: fileSize,
      type: fileType,
    }, request);
  } catch (error) {
    logErrorSafely('Confirm', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};

/**
 * Get an authenticated proxy URL from file key for downloading/viewing.
 */
export const handleGetUrl: PagesFunction = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = await request.json() as GetUrlRequestBody;
    const { fileKey } = body;

    // Validate required fields
    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'fileKey is required', request);
    }

    // Initialize R2 client so missing binding fails at this boundary.
    new R2Client(env);

    const proxyUrl = createDocumentProxyUrl(request, fileKey, 'inline');

    return apiSuccess({ url: proxyUrl, expiresAt: null }, request);
  } catch (error) {
    logErrorSafely('GetUrl', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};

/**
 * Alias for handleGetUrl
 */
export const handleGetFileUrl = handleGetUrl;

/** Signed URL lifetime for profile media — short window to limit sharing. */
export const handleProfileMediaUrl: PagesFunction = async (context) => {
  const { request, env, user } = context;

  if (!user) {
    return createAuthenticationError('/profile-media-url', 'missing_token');
  }

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    let body: { fileKey?: string; url?: string };
    try {
      body = await request.json() as { fileKey?: string; url?: string };
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON request body', request);
    }
    const { fileKey: providedKey, url } = body;

    // Accept either a raw file key or a stored URL (extract the key from it).
    let fileKey = providedKey ?? undefined;
    if (!fileKey && url) {
      const extracted = R2Client.extractKeyFromUrl(url);
      if (extracted) fileKey = extracted;
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Ownership check: keys are `uploads/{userId}/...`, so the user-id segment
    // must EXACTLY equal the authenticated user's id and sit in its expected
    // position. Exact segment comparison (not substring/`includes`) prevents a
    // value like `user123` from matching `123`.
    const segments = fileKey.split('/');
    const isOwner = segments[0] === 'uploads' && segments[1] === user.id;
    if (!isOwner) {
      return apiError(403, 'FORBIDDEN', 'You do not have access to this file', request);
    }

    // Initialize R2 client so missing binding fails at this boundary.
    new R2Client(env);
    const proxyUrl = createDocumentProxyUrl(request, fileKey, 'inline');

    return apiSuccess({
      url: proxyUrl,
      expiresAt: null,
    }, request);
  } catch (error) {
    logErrorSafely('ProfileMediaUrl', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
