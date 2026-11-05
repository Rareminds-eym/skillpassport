import { apiError } from '../../../lib/response';
import { checkCourseEnrollment } from '../utils/course-authorization';

/** Serve a dashboard lesson resource after checking the caller's enrollment. */
export async function handleCourseResource(context: any): Promise<Response> {
  const { request, env, user, supabaseAdmin } = context;
  if (request.method !== 'GET') return apiError(405, 'ERROR', 'Method not allowed', request);
  const params = new URL(request.url).searchParams;
  const key = params.get('key') || '';
  const courseId = params.get('courseId') || '';
  const lessonId = params.get('lessonId') || '';
  if (!courseId || !lessonId || !key.startsWith('courses/resources/') || key.includes('..') || key.includes('\\')) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid course resource', request);
  }
  const enrollment = await checkCourseEnrollment(supabaseAdmin, user.id, courseId);
  if (!enrollment.authorized) return apiError(403, 'FORBIDDEN', 'Access denied', request);
  const { data: lesson, error: lessonError } = await supabaseAdmin.from('lessons')
    .select('lesson_id, course_modules!inner(course_id)').eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId).maybeSingle();
  if (lessonError || !lesson) return apiError(403, 'FORBIDDEN', 'Lesson not found in this course', request);
  const { data: resources, error } = await supabaseAdmin.from('lesson_resources').select('url').eq('lesson_id', lessonId);
  const found = !error && resources?.some((resource: { url?: string }) => {
    try {
      const stored = new URL(resource.url || '', 'https://local.invalid');
      return stored.pathname === '/api/courses/assets' && stored.searchParams.get('key') === key;
    } catch { return false; }
  });
  if (!found) return apiError(403, 'FORBIDDEN', 'Resource not found in this lesson', request);
  const object = await env.R2_BUCKET?.get(key);
  if (!object) return apiError(404, 'NOT_FOUND', 'File not found', request);
  return new Response(object.body, { headers: {
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
