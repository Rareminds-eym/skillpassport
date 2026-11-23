import { z } from 'zod';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { requireCourseAccess } from '../utils/course-index';

const input = z.object({ action: z.literal('status'), courseId: z.string().uuid() });
export async function handleCourseIndex(context: { request: Request; env: PagesEnv; data?: Parameters<typeof getContextUser>[0]['data'] }) {
  const { request } = context;
  const db = getServiceClient(context.env as unknown as PagesEnv);
  const user = getContextUser(context);
  try {
    const body = input.parse(await request.json());
    if (!await requireCourseAccess(db, user.id, body.courseId)) return apiError(403, 'FORBIDDEN', 'Course access denied', request);
    const rows = await db.from('course_resource_analysis').select('id,lesson_id,resource_id,status,is_current,version,error_message,updated_at').eq('course_id', body.courseId).order('version', { ascending: false }).limit(1000);
    if (rows.error) throw new Error('Index status unavailable');
    return apiSuccess(rows.data, request);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return apiError(400, 'VALIDATION_ERROR', 'Invalid course index request', request);
    return apiError(503, 'INDEX_UNAVAILABLE', 'Course indexing unavailable. Verify the migration and local course index import.', request);
  }
}
