import type { SupabaseClient } from '@supabase/supabase-js';
import { ContextBundleSchema } from '@rareminds-eym/ai-protocol';
import { EvidenceAuthError } from './evidence-auth';
import { loadEnrolledCourse, resolveCourseLesson } from './lesson-evidence';
import { loadAuthoringCourse } from './authoring-course-evidence';

/** Ownership proof for one immutable video input; no transcript or prompt is exposed. */
export async function buildVideoSourceEvidence(db: SupabaseClient, input: {
  actorId: string; kinds: string[]; resources: Array<{ kind: string; id: string }>;
}, nowMs: number) {
  const resource = input.resources[0];
  if (input.resources.length !== 1 || resource?.kind !== 'video-job' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resource.id) ||
      input.kinds.length !== 1 || input.kinds[0] !== 'video.source') {
    throw new EvidenceAuthError('One video job source is required', 'FORBIDDEN', 403);
  }
  const result = await db.from('ai_video_jobs').select('id, source_hash')
    .eq('id', resource.id).eq('actor_id', input.actorId).maybeSingle();
  if (result.error) throw new Error('Video evidence store is unavailable');
  let allowed = Boolean(result.data && typeof result.data.source_hash === 'string' && /^[a-f0-9]{64}$/.test(result.data.source_hash));
  if (allowed) {
    const scope = await db.from('video_summaries').select('id, course_id, lesson_id').eq('id', resource.id).maybeSingle();
    if (scope.error) throw new Error('Video evidence store is unavailable');
    allowed = Boolean(scope.data);
    if (scope.data?.course_id) {
      allowed = Boolean(await loadEnrolledCourse(db, input.actorId, scope.data.course_id) ?? await loadAuthoringCourse(db, input.actorId, scope.data.course_id));
      if (allowed && scope.data.lesson_id) allowed = Boolean(await resolveCourseLesson(db, scope.data.course_id, scope.data.lesson_id));
    }
  }
  const now = new Date(nowMs).toISOString();
  return {
    forbiddenResources: allowed ? [] : [`video-job:${resource.id}`],
    bundle: ContextBundleSchema.parse({ evidence: allowed ? [{ kind: 'video.source',
      reference: `video-job:${resource.id}`, text: 'Authorized immutable video source. This does not grant access to any other job.',
      source: 'skillpassport:ai_video_jobs', revision: result.data!.source_hash, gatheredAt: now,
    }] : [], sources: allowed ? ['skillpassport:ai_video_jobs'] : [], missing: [], absent: [], stale: [], invalid: [], gatheredAt: now }),
  };
}
