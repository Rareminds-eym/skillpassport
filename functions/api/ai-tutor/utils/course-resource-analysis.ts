import type { SupabaseClient } from '@supabase/supabase-js';
import type { CourseContext } from './course-context';
import { analyzeResource, cachedAnalysis, type AnalysisEnv } from './resource-analysis';

export async function canAnalyzeCourseResources(db: SupabaseClient, courseId: string, userId: string, educator: boolean): Promise<boolean> {
  const { data: enrollment, error: enrollmentError } = await db.from('course_enrollments').select('id').eq('learner_id', userId).eq('course_id', courseId).maybeSingle();
  let allowed = !enrollmentError && !!enrollment;
  if (!allowed && educator) {
    const { data: course, error } = await db.from('courses').select('course_id').eq('course_id', courseId).eq('status', 'Active').maybeSingle();
    allowed = !error && !!course;
  }
  return allowed;
}
/** Analyze only server-resolved lesson resources; user text never supplies URLs. */
export async function enrichCourseResources(context: CourseContext, db: SupabaseClient, env: AnalysisEnv, courseId: string, userId: string, educator: boolean, signal?: AbortSignal): Promise<boolean> {
  const resources = context.availableResources ?? [];
  const allowed = await canAnalyzeCourseResources(db, courseId, userId, educator);
  if (!allowed) {
    for (const resource of resources) { resource.content = null; resource.analysisError = 'Resource analysis access could not be verified.'; }
    return false;
  }
  const deadline = AbortSignal.timeout(45000);
  const analysisSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  let calls = 0;
  for (const resource of resources) {
    const cached = cachedAnalysis(resource);
    if (cached) { resource.content = cached; continue; }
    if (resource.content && !resource.content.startsWith('[COURSE_RESOURCE_ANALYSIS_') && !resource.content.includes('Full PDF text extraction requires additional processing')) continue;
    if (calls >= 3 || deadline.aborted) { resource.content = null; resource.analysisError = 'Not yet analyzed: per-message analysis budget reached. Continue the conversation to process remaining resources.'; continue; }
    calls++;
    try {
      const result = await analyzeResource(resource, env, analysisSignal);
      const { error } = await db.from('lesson_resources').update({ content: result.storedContent }).eq('resource_id', resource.resourceId).eq('url', resource.url);
      resource.content = result.text;
      if (error) resource.analysisError = 'Analysis available for this response but could not be cached.';
    } catch (error) {
      if (signal?.aborted) throw error;
      resource.content = null;
      resource.analysisError = error instanceof Error ? error.message : 'Resource analysis failed.';
    }
  }
  return true;
}
