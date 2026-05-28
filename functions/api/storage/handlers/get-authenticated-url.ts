/**
 * Get Authenticated URL Handler
 * 
 * Generates short-lived (5 min) authenticated URLs for course media.
 * URLs expire quickly to limit sharing window.
 * 
 * POST /api/storage/get-authenticated-url
 * Body: { fileUrl: string, courseId: string, lessonId?: string }
 * Headers: Authorization: Bearer <jwt>
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { checkCourseEnrollment, checkRateLimit } from '../utils/course-authorization';
import { extractFileKey, generateMediaToken } from '../utils/token-crypto';

interface StorageHandlerContext {
  request: Request;
  env: any;
  user?: { id: string };
  supabase?: any;
}

interface RequestBody {
  fileUrl?: string;
  fileKey?: string;
  courseId: string;
  lessonId?: string;
  fingerprint?: string;
  sessionId?: string;
}

/**
 * Generate authenticated URL with session cookie for media access
 */
export const handleGetAuthenticatedUrl = async (context: StorageHandlerContext) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const user = context.user!;
    const supabase = context.supabase;
    const userId = user.id;

    // Rate limiting
    const rateLimit = checkRateLimit(userId, 100, 3600);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = (await request.json()) as RequestBody;
    const { fileUrl, fileKey: providedKey, courseId, lessonId, fingerprint, sessionId } = body;

    if (!courseId) {
      return apiError(400, 'VALIDATION_ERROR', 'Course ID is required', request);
    }

    let fileKey: string | undefined = providedKey;
    if (!fileKey && fileUrl) {
      const extracted = extractFileKey(fileUrl);
      fileKey = extracted || undefined;
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Check course enrollment
    const authCheck = await checkCourseEnrollment(supabase, userId, courseId);
    if (!authCheck.authorized) {
      return apiError(403, 'FORBIDDEN', authCheck.error || 'Access denied', request);
    }

    // Generate authenticated token with fingerprint
    const signingSecret = env.SIGNING_SECRET;
    if (!signingSecret) {
      console.error('[GetAuthUrl] SIGNING_SECRET not configured');
      return apiError(500, 'INTERNAL_ERROR', 'Server configuration error', request);
    }

    const userAgent = request.headers.get('User-Agent') || '';
    
    const token = await generateMediaToken(
      userId,
      courseId,
      fileKey,
      signingSecret,
      300,
      lessonId,
      fingerprint,
      userAgent,
      sessionId
    );

    const baseUrl = new URL(request.url).origin;
    const authenticatedUrl = `${baseUrl}/api/storage/media-proxy?token=${encodeURIComponent(token)}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: authenticatedUrl,
        expiresIn: 300,
        expiresAt: new Date(Date.now() + 300 * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error('[GetAuthUrl] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
  }
};
