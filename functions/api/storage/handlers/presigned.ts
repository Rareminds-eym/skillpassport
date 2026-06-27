/**
 * Presigned URL Handlers
 * 
 * Handles presigned URL generation for client-side uploads:
 * - POST /presigned - Generate presigned URL for upload
 * - POST /confirm - Confirm upload completion and get public URL
 * - POST /get-url - Get public URL from file key
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

interface PresignedRequestBody {
  filename: string;
  contentType: string;
  fileSize?: number;
  courseId: string;
  lessonId: string;
}

interface ConfirmRequestBody {
  fileKey: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface GetUrlRequestBody {
  fileKey: string;
}

/**
 * Generate presigned URL for client-side upload
 */
export const handlePresigned: PagesFunction = async (context) => {
  const { request, env, user } = context;

  // Require authentication
  if (!user) {
    return createAuthenticationError('/presigned', 'missing_token');
  }

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = await request.json() as PresignedRequestBody;
    const { filename, contentType, courseId, lessonId } = body;

    // Validate required fields
    if (!filename || !contentType || !courseId || !lessonId) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', request);
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate unique file key with user ID
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const extension = filename.substring(filename.lastIndexOf('.'));
    const fileKey = `courses/${courseId}/lessons/${lessonId}/${user.id}/${timestamp}-${randomString}${extension}`;

    // Generate presigned URL with proper parameters
    const presignedData = await r2Client.generatePresignedUrl(fileKey, contentType);

    return apiSuccess({
      uploadUrl: presignedData.url,
      fileKey,
      headers: presignedData.headers,
    }, request);
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
 * Get presigned URL from file key for downloading/viewing
 * Returns a temporary signed URL valid for 7 days
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

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate presigned URL for GET request (7 days expiry for course content)
    const presignedUrl = await r2Client.generatePresignedGetUrl(fileKey, 604800); // 7 days in seconds

    return apiSuccess({ url: presignedUrl }, request);
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
const PROFILE_MEDIA_TTL_SECONDS = 300; // 5 minutes


export const handleProfileMediaUrl: PagesFunction = async (context) => {
  const { request, env, user } = context;

  if (!user) {
    return createAuthenticationError('/profile-media-url', 'missing_token');
  }

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const body = await request.json() as { fileKey?: string; url?: string };
    const { fileKey: providedKey, url } = body;

    // Accept either a raw file key or a stored URL (extract the key from it).
    let fileKey = providedKey ?? undefined;
    if (!fileKey && url) {
      fileKey = R2Client.extractKeyFromUrl(url) ?? undefined;
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Ownership check: user id must be a path segment of the key
    // (keys are `uploads/{userId}/...`). Segment match avoids substring matches.
    const isOwner = fileKey.split('/').includes(user.id);
    if (!isOwner) {
      return apiError(403, 'FORBIDDEN', 'You do not have access to this file', request);
    }

    const r2Client = new R2Client(env);
    const signedUrl = await r2Client.generatePresignedGetUrl(fileKey, PROFILE_MEDIA_TTL_SECONDS);

    return apiSuccess({
      url: signedUrl,
      expiresIn: PROFILE_MEDIA_TTL_SECONDS,
      expiresAt: new Date(Date.now() + PROFILE_MEDIA_TTL_SECONDS * 1000).toISOString(),
    }, request);
  } catch (error) {
    logErrorSafely('ProfileMediaUrl', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
