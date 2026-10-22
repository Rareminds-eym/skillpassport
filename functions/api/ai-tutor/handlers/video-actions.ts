import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError, apiSuccess } from '../../../lib/response';
import { loadEnrolledCourse, resolveCourseLesson } from '../../internal/lesson-evidence';
import { loadAuthoringCourse } from '../../internal/authoring-course-evidence';

const ACTIONS = new Set(['get-video-summary', 'get-video-summary-by-lesson', 'get-video-summary-robust',
  'get-video-summary-by-url', 'check-processing-status', 'get-failed-record', 'delete-video-summary']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Never read transcript/result columns until current job or course authority passes. */
export async function handleVideoAction(db: SupabaseClient, actorId: string, action: string,
  params: Record<string, unknown>, request: Request, videoJobsEnabled = false): Promise<Response | undefined> {
  if (!ACTIONS.has(action)) return undefined;
  if (!actorId) return apiError(401, 'UNAUTHORIZED', 'Authentication required', request);
  if (action === 'delete-video-summary') {
    // Removing an accepted identity would permit a duplicate model execution.
    return apiError(409, 'CONFLICT', 'Accepted video executions cannot be deleted to retry generation.', request);
  }
  const byId = ['get-video-summary', 'check-processing-status', 'get-failed-record'].includes(action);
  const byLesson = !byId && typeof params.lesson_id === 'string' && Boolean(params.lesson_id);
  const key = byId ? 'id' : byLesson ? 'lesson_id' : 'video_url';
  const value = params[key];
  if (typeof value !== 'string' || (key !== 'video_url' ? !uuid.test(value) : !value || value.length > 4096)) {
    return apiError(400, 'VALIDATION_ERROR', 'A valid video resource is required', request);
  }
  let query = db.from('video_summaries').select('id, course_id, lesson_id, processing_status')
    .eq(key, value).order('created_at', { ascending: false }).limit(10);
  if (action === 'get-video-summary-by-lesson') query = query.eq('processing_status', 'completed');
  const metadata = await query;
  if (metadata.error) throw new Error('Video result store is unavailable');
  for (const record of metadata.data ?? []) {
    const job = videoJobsEnabled
      ? await db.from('ai_video_jobs').select('id, actor_id').eq('id', record.id).maybeSingle()
      : { data: null, error: null };
    if (job.error) throw new Error('Video ownership store is unavailable');
    let allowed = job.data?.actor_id === actorId;
    // A private standalone upload is never shared by URL. Course sharing requires
    // completed publication data plus current enrollment/authoring authority.
    if (!allowed && record.course_id && record.processing_status === 'completed') {
      allowed = Boolean(await loadEnrolledCourse(db, actorId, record.course_id) ?? await loadAuthoringCourse(db, actorId, record.course_id));
      if (allowed && record.lesson_id) allowed = Boolean(await resolveCourseLesson(db, record.course_id, record.lesson_id));
    }
    if (!allowed) continue;
    const result = await db.from('video_summaries').select('*').eq('id', record.id).maybeSingle();
    if (result.error) throw new Error('Video result store is unavailable');
    if (!result.data) continue;
    if (action === 'check-processing-status') return apiSuccess({ status: result.data.processing_status,
      ...(result.data.processing_status === 'completed' ? { summary: result.data } : {}) }, request);
    if (action === 'get-failed-record') return apiSuccess({ processing_status: result.data.processing_status,
      error_message: result.data.processing_status === 'failed' ? 'Video execution requires reconciliation.' : null }, request);
    return apiSuccess(result.data, request);
  }
  return apiSuccess(action === 'check-processing-status' ? { status: 'not_found' } : null, request);
}
