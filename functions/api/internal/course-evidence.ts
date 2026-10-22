import type { SupabaseClient } from '@supabase/supabase-js';
import { ContextBundleSchema, type ContextBundle } from '@rareminds-eym/ai-protocol';
import { EvidenceAuthError } from './evidence-auth';
import { resolveCourseLesson, loadEnrolledCourse } from './lesson-evidence';

/** Bounded learner course grounding, with optional lesson membership verification. */
export async function buildCourseEvidence(db: SupabaseClient, input: {
  actorId: string; kinds: string[]; resources: Array<{ kind: string; id: string }>;
}, nowMs: number): Promise<{ bundle: ContextBundle; forbiddenResources: string[] }> {
  const courses = input.resources.filter(item => item.kind === 'course');
  const lessons = input.resources.filter(item => item.kind === 'lesson');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (courses.length !== 1 || lessons.length > 1 || input.resources.length !== courses.length + lessons.length ||
    input.resources.some(item => !uuid.test(item.id)) || input.kinds.length !== 1 || input.kinds[0] !== 'course.summary') {
    throw new EvidenceAuthError('Exactly one course and at most one lesson are required', 'FORBIDDEN', 403);
  }
  const now = new Date(nowMs).toISOString();
  const forbidden = () => ({ forbiddenResources: input.resources.map(item => `${item.kind}:${item.id}`), bundle: ContextBundleSchema.parse({ evidence: [], sources: [], missing: ['course.summary'], absent: [], stale: [], invalid: [], gatheredAt: now }) });
  const courseId = courses[0]!.id;
  const course = await loadEnrolledCourse(db, input.actorId, courseId);
  if (!course) return forbidden();
  const evidence: ContextBundle['evidence'] = [];
  if (lessons.length) {
    if (!await resolveCourseLesson(db, courseId, lessons[0]!.id)) return forbidden();
  }
  const text = JSON.stringify({ title: typeof course.title === 'string' ? course.title.slice(0, 256) : '', description: typeof course.description === 'string' ? course.description.slice(0, 2000) : '', code: typeof course.code === 'string' ? course.code.slice(0, 64) : '' }).slice(0, 4000);
  const revision = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), byte => byte.toString(16).padStart(2, '0')).join('');
  evidence.unshift({ kind: 'course.summary', reference: `course:${courseId}`, text, source: 'skillpassport:courses', revision, gatheredAt: now });
  return { forbiddenResources: [], bundle: ContextBundleSchema.parse({ evidence, sources: [...new Set(evidence.map(item => item.source))], missing: [], absent: [], stale: [], invalid: [], gatheredAt: now }) };
}
