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

import { apiError } from '../../../lib/response';
import { checkCourseEnrollment, checkRateLimit } from '../utils/course-authorization';
import { extractFileKey, generateMediaToken } from '../utils/token-crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

interface StorageHandlerContext {
  request: Request;
  env: any;
  user?: { id: string };
  supabase?: any;
  supabaseAdmin?: SupabaseClient;
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
    // The default storage client uses the anonymous key and carries no user JWT.
    // The request is already authenticated; check this user's enrollment with
    // the server-side client rather than relying on anonymous RLS access.
    const authCheck = await checkCourseEnrollment(context.supabaseAdmin || supabase, userId, courseId);
    if (!authCheck.authorized) {
      return apiError(403, 'FORBIDDEN', authCheck.error || 'Access denied', request);
    }

    // Dashboard uploads have shared keys rather than course-specific paths.
    // Only issue a token after verifying the stored resource belongs to the lesson.
    const sharedCourseResource = fileKey.startsWith('courses/resources/');
    if (sharedCourseResource) {
      if (!lessonId || fileKey.includes('..') || fileKey.includes('\\')) {
        return apiError(403, 'FORBIDDEN', 'Invalid course resource', request);
      }
      const db = context.supabaseAdmin || supabase;
      const { data: lesson, error: lessonError } = await db.from('lessons')
        .select('lesson_id, course_modules!inner(course_id)')
        .eq('lesson_id', lessonId).eq('course_modules.course_id', courseId).maybeSingle();
      if (lessonError || !lesson) return apiError(403, 'FORBIDDEN', 'Lesson not found in this course', request);
      const { data: resources, error: resourceError } = await db.from('lesson_resources').select('url').eq('lesson_id', lessonId);
      const matches = !resourceError && resources?.some((resource: { url?: string }) => {
        if (!resource.url) return false;
        try {
          const stored = new URL(resource.url, 'https://local.invalid');
          return stored.pathname === '/api/courses/assets' && stored.searchParams.get('key') === fileKey;
        } catch { return false; }
      });
      if (!matches) return apiError(403, 'FORBIDDEN', 'Resource not found in this lesson', request);
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
      sessionId,
      sharedCourseResource
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
