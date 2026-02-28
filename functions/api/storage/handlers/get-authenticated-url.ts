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

import { authenticateUser } from '../../shared/auth';
import { checkCourseEnrollment, checkRateLimit } from '../utils/course-authorization';
import { extractFileKey, generateMediaToken } from '../utils/token-crypto';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

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
export const handleGetAuthenticatedUrl: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Authenticate user
    const authResult = await authenticateUser(request, env);
    if (!authResult) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { user, supabase } = authResult;

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, 100, 3600);
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
      return new Response(
        JSON.stringify({ error: 'Course ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let fileKey: string | undefined = providedKey;
    if (!fileKey && fileUrl) {
      const extracted = extractFileKey(fileUrl);
      fileKey = extracted || undefined;
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

    // Check course enrollment
    const authCheck = await checkCourseEnrollment(supabase, user.id, courseId);
    if (!authCheck.authorized) {
      return new Response(
        JSON.stringify({ error: authCheck.error || 'Access denied' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate authenticated token with fingerprint
    const signingSecret = env.SIGNING_SECRET;
    if (!signingSecret) {
      console.error('[GetAuthUrl] SIGNING_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userAgent = request.headers.get('User-Agent') || '';
    
    const token = await generateMediaToken(
      user.id,
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
    return new Response(
      JSON.stringify({
        error: 'Failed to generate authenticated URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
