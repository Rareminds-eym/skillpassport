/**
 * Video Portfolio Storage Handler
 * 
 * Handles video file storage for learner video portfolios in digital passport.
 * Follows the existing payment-receipt storage pattern with:
 * - R2 upload with folder-based organization
 * - Authenticated download/streaming with range support
 * - Proxy URL generation
 * - Ownership validation
 * 
 * Storage structure: video_portfolio/{name}_{userId}/{videoId}_{timestamp}.{ext}
 * Example: video_portfolio/john_doe_9a754938/vid_abc123_1726675200000.mp4
 */

import { jsonResponse } from '../../../lib/response';
import { getContextUser } from '../../../lib/auth';
import { R2Client } from '../utils/r2-client';
import type { PagesEnv } from '../../../lib/types';

// ============================================================================
// Constants
// ============================================================================

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm'] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize name for use in file paths
 */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 50);
}

/**
 * Generate unique video filename
 * Format: video_portfolio/{name}_{userIdPrefix}/{videoId}_{timestamp}.{ext}
 */
function generateVideoKey(
  videoId: string,
  userId: string,
  userName: string | undefined,
  filename: string
): string {
  const userIdPrefix = userId.substring(0, 8);
  const sanitizedName = userName ? sanitizeName(userName) : 'user';
  const timestamp = Date.now();

  // Extract extension
  const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';

  // Create folder name
  const folderName = `${sanitizedName}_${userIdPrefix}`;

  // Generate key
  return `video_portfolio/${folderName}/${videoId}_${timestamp}.${ext}`;
}

/**
 * Extract video ID from file key
 * Example: video_portfolio/john_doe_9a754938/vid_abc123_1726675200000.mp4 -> vid_abc123
 */
function extractVideoIdFromKey(fileKey: string): string | null {
  const parts = fileKey.split('/');
  if (parts.length !== 3 || parts[0] !== 'video_portfolio') {
    return null;
  }

  const filename = parts[2];
  const match = filename.match(/^(.+?)_\d+\./);
  return match ? match[1] : null;
}

/**
 * Validate file is a video
 */
function validateVideo(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
    };
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_VIDEO_EXTENSIONS.includes(ext as any)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Create video portfolio proxy URL
 */
function createVideoPortfolioProxyUrl(
  request: Request,
  fileKey: string,
  mode: 'inline' | 'download' = 'inline'
): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return `${baseUrl}/api/storage/video-portfolio?key=${encodeURIComponent(fileKey)}&mode=${mode}`;
}

// ============================================================================
// Upload Handler
// ============================================================================

/**
 * POST /api/storage/upload-video-portfolio
 * 
 * Uploads a video file to R2 for video portfolio.
 * 
 * Request body (multipart/form-data):
 * - file: Video file (max 100MB)
 * - videoId: UUID for the video entry
 * - userName?: Optional user name for folder naming
 * 
 * Returns:
 * - url: Proxy URL for streaming
 * - fileKey: R2 storage key
 * - filename: Generated filename
 * - fileSize: File size in bytes
 */
export async function handleVideoPortfolioUpload(
  request: Request,
  env: PagesEnv,
  context: any
): Promise<Response> {
  try {
    // Get authenticated user
    const user = getContextUser(context);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const videoId = formData.get('videoId') as string;
    const userName = formData.get('userName') as string | undefined;

    // Validate inputs
    if (!file) {
      return createError(400, 'FILE_REQUIRED', 'No file provided');
    }

    if (!videoId) {
      return createError(400, 'VIDEO_ID_REQUIRED', 'Video ID is required');
    }

    // Validate video
    const validation = validateVideo(file);
    if (!validation.valid) {
      return createError(400, 'INVALID_VIDEO', validation.error!);
    }

    // Generate file key
    const fileKey = generateVideoKey(videoId, user.id, userName, file.name);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const r2Client = new R2Client(env);
    await r2Client.upload(fileKey, arrayBuffer, file.type, {
      'Content-Length': file.size.toString(),
    });

    // Generate proxy URL
    const proxyUrl = createVideoPortfolioProxyUrl(request, fileKey, 'inline');

    return new Response(
      JSON.stringify({
        url: proxyUrl,
        fileKey,
        filename: fileKey.split('/').pop()!,
        fileSize: file.size,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error uploading video portfolio:', error);
    return createError(500, 'UPLOAD_FAILED', error.message || 'Failed to upload video');
  }
}

// ============================================================================
// Download/Stream Handler
// ============================================================================

/**
 * GET /api/storage/video-portfolio?key={fileKey}&mode={mode}
 * 
 * Downloads or streams a video file from R2.
 * Validates ownership before allowing access.
 * Supports Range requests for video streaming.
 * 
 * Query params:
 * - key: R2 file key (required)
 * - mode: 'inline' (view) or 'download' (default: inline)
 * 
 * Authorization:
 * - Validates user ID prefix in folder name matches authenticated user
 */
export async function handleVideoPortfolioDownload(
  request: Request,
  env: PagesEnv,
  context: any
): Promise<Response> {
  try {
    // Get authenticated user
    const user = getContextUser(context);

    // Parse query params
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');
    const mode = (url.searchParams.get('mode') || 'inline') as 'inline' | 'download';

    if (!fileKey) {
      return createError(400, 'KEY_REQUIRED', 'File key is required');
    }

    // Validate file key format
    if (!fileKey.startsWith('video_portfolio/')) {
      return createError(400, 'INVALID_KEY', 'Invalid video portfolio key');
    }

    // Extract folder name and validate ownership
    const keyParts = fileKey.split('/');
    if (keyParts.length !== 3) {
      return createError(400, 'INVALID_KEY_FORMAT', 'Invalid key format');
    }

    const folderName = keyParts[1]; // john_doe_9a754938
    const userIdPrefix = user.id.substring(0, 8);

    if (!folderName.includes(userIdPrefix)) {
      return createError(
        403,
        'FORBIDDEN',
        'You do not have access to this video'
      );
    }

    // Extract video ID
    const videoId = extractVideoIdFromKey(fileKey);
    if (!videoId) {
      return createError(400, 'INVALID_KEY', 'Cannot extract video ID from key');
    }

    // Get file from R2
    const r2Client = new R2Client(env);

    // Check for Range header (video streaming)
    const rangeHeader = request.headers.get('Range');
    console.log('[VIDEO-DOWNLOAD] Range header:', rangeHeader);

    // R2Client.getObject returns a Response object
    const r2Response = await r2Client.getObject(fileKey, rangeHeader);
    console.log('[VIDEO-DOWNLOAD] R2 response retrieved:', {
      ok: r2Response.ok,
      status: r2Response.status,
      hasBody: !!r2Response.body,
      contentType: r2Response.headers.get('Content-Type'),
      contentLength: r2Response.headers.get('Content-Length')
    });

    if (!r2Response.ok) {
      return createError(404, 'NOT_FOUND', 'Video not found');
    }

    // Get filename
    const filename = keyParts[2];

    // Clone headers from R2 response and add additional headers
    const headers = new Headers(r2Response.headers);
    headers.set('Cache-Control', 'private, max-age=3600');

    // Set Content-Disposition
    const disposition = mode === 'download' ? 'attachment' : 'inline';
    headers.set('Content-Disposition', `${disposition}; filename="${filename}"`);

    console.log('[VIDEO-DOWNLOAD] Sending response with status:', r2Response.status);

    // Return the response with updated headers
    return new Response(r2Response.body, {
      status: r2Response.status,
      headers,
    });
  } catch (error: any) {
    console.error('Error downloading video portfolio:', error);
    return createError(
      500,
      'DOWNLOAD_FAILED',
      error.message || 'Failed to download video'
    );
  }
}

// ============================================================================
// Delete Handler
// ============================================================================

/**
 * DELETE /api/storage/video-portfolio?key={fileKey}
 * 
 * Deletes a video file from R2.
 * Validates ownership before allowing deletion.
 * 
 * Query params:
 * - key: R2 file key (required)
 */
export async function handleVideoPortfolioDelete(
  request: Request,
  env: PagesEnv,
  context: any
): Promise<Response> {
  try {
    // Get authenticated user
    const user = getContextUser(context);

    // Parse query params
    const url = new URL(request.url);
    const fileKey = url.searchParams.get('key');

    if (!fileKey) {
      return createError(400, 'KEY_REQUIRED', 'File key is required');
    }

    // Validate file key format
    if (!fileKey.startsWith('video_portfolio/')) {
      return createError(400, 'INVALID_KEY', 'Invalid video portfolio key');
    }

    // Extract folder name and validate ownership
    const keyParts = fileKey.split('/');
    if (keyParts.length !== 3) {
      return createError(400, 'INVALID_KEY_FORMAT', 'Invalid key format');
    }

    const folderName = keyParts[1];
    const userIdPrefix = user.id.substring(0, 8);

    if (!folderName.includes(userIdPrefix)) {
      return createError(
        403,
        'FORBIDDEN',
        'You do not have access to this video'
      );
    }

    // Delete from R2
    const r2Client = new R2Client(env);
    await r2Client.delete(fileKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting video portfolio:', error);
    return createError(
      500,
      'DELETE_FAILED',
      error.message || 'Failed to delete video'
    );
  }
}
