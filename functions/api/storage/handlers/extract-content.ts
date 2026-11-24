import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { buildCourseContext } from '../../ai-tutor/utils/course-context';
import { enrichCourseResources, canAnalyzeCourseResources } from '../../ai-tutor/utils/course-resource-analysis';

interface Context { request: Request; env: PagesEnv; user?: { id: string; roles?: string[] }; supabaseAdmin: SupabaseClient }
const input = z.object({ resourceId: z.string().uuid().optional(), resourceIds: z.array(z.string().uuid()).min(1).max(3).optional(), lessonId: z.string().uuid().optional() })
  .refine(body => !!(body.resourceId || body.resourceIds || body.lessonId));
/** Authenticated resource processing; no caller-supplied URL can be fetched. */
export async function handleExtractContent({ request, env, user, supabaseAdmin: db }: Context) {
  if (request.method !== 'POST') return apiError(405, 'ERROR', 'Method not allowed', request);
  if (!user) return apiError(401, 'UNAUTHORIZED', 'Authentication required', request);
  try {
    const body = input.parse(await request.json());
    let query = db.from('lesson_resources').select('resource_id,lesson_id,name');
    if (body.resourceId) query = query.eq('resource_id', body.resourceId);
    else if (body.resourceIds) query = query.in('resource_id', body.resourceIds);
    else query = query.eq('lesson_id', body.lessonId!);
    const { data: rows, error } = await query.limit(4);
    if (error) throw error;
    if (!rows?.length) return apiError(404, 'NOT_FOUND', 'Resources not found', request);
    if (rows.length > 3) return apiError(400, 'VALIDATION_ERROR', 'Process at most three resource IDs per request.', request);
    const results = [];
    for (const row of rows) {
      const { data: lesson, error: lessonError } = await db.from('lessons').select('module_id').eq('lesson_id', row.lesson_id).maybeSingle();
      if (lessonError || !lesson) throw new Error('Lesson not found');
      const { data: module, error: moduleError } = await db.from('course_modules').select('course_id').eq('module_id', lesson.module_id).maybeSingle();
      if (moduleError || !module) throw new Error('Course not found');
      const educator = user.roles?.some(role => role.includes('educator')) ?? false;
      if (!await canAnalyzeCourseResources(db, module.course_id, user.id, educator)) return apiError(403, 'FORBIDDEN', 'Course resource access required', request);
      const context = await buildCourseContext(db, module.course_id, row.lesson_id, user.id);
      context.availableResources = context.availableResources.filter(resource => resource.resourceId === row.resource_id);
      await enrichCourseResources(context, db, env, module.course_id, user.id, educator, request.signal);
      const resource = context.availableResources[0];
      results.push({ resourceId: row.resource_id, name: row.name, status: resource?.content ? 'success' : 'error', contentLength: resource?.content?.length ?? 0, ...(resource?.analysisError ? { error: resource.analysisError } : {}) });
    }
    return apiSuccess({ processed: results.length, results }, request);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return apiError(400, 'VALIDATION_ERROR', 'Provide resourceId, up to three resourceIds, or lessonId.', request);
    return apiError(500, 'INTERNAL_ERROR', 'Resource processing failed. Please retry.', request);
  }
}
