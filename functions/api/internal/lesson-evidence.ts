import type { SupabaseClient } from '@supabase/supabase-js';
import { ContextBundleSchema, type ContextBundle } from '@rareminds-eym/ai-protocol';
import { EvidenceAuthError } from './evidence-auth';

/** Shared canonical learner/enrollment authorization. Never accepts a learner id. */
export async function loadEnrolledCourse(db: SupabaseClient, actorId: string, courseId: string) {
  const learner = await db.from('learners').select('id').eq('user_id', actorId).maybeSingle();
  if (learner.error) throw new Error('Course evidence store is unavailable');
  if (!learner.data) return null;
  const enrollment = await db.from('course_enrollments').select('id, status').eq('learner_id', learner.data.id).eq('course_id', courseId).maybeSingle();
  if (enrollment.error) throw new Error('Course evidence store is unavailable');
  if (!enrollment.data || !['active', 'in_progress', 'completed'].includes(enrollment.data.status)) return null;
  const course = await db.from('courses').select('course_id, title, description, code').eq('course_id', courseId).eq('status', 'Active').is('deleted_at', null).maybeSingle();
  if (course.error) throw new Error('Course evidence store is unavailable');
  return course.data;
}

/** Membership only: callers must first authorize the course enrollment. */
export async function resolveCourseLesson(db: SupabaseClient, courseId: string, lessonId: string) {
  const link = await db.from('lessons').select('lesson_id, module_id').eq('lesson_id', lessonId).maybeSingle();
  if (link.error) throw new Error('Lesson evidence store is unavailable');
  if (!link.data) return null;
  const module = await db.from('course_modules').select('module_id, title').eq('module_id', link.data.module_id).eq('course_id', courseId).maybeSingle();
  if (module.error) throw new Error('Lesson evidence store is unavailable');
  return module.data;
}

/** Learner lesson projection only. This does not grant educator/admin access. */
export async function buildLessonEvidence(db: SupabaseClient, input: {
  actorId: string; kinds: string[]; resources: Array<{ kind: string; id: string }>;
}, nowMs: number): Promise<{ bundle: ContextBundle; forbiddenResources: string[] }> {
  const courses = input.resources.filter(item => item.kind === 'course');
  const lessons = input.resources.filter(item => item.kind === 'lesson');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (courses.length !== 1 || lessons.length !== 1 || input.resources.length !== 2 ||
    !uuid.test(courses[0]!.id) || !uuid.test(lessons[0]!.id) || input.kinds.length !== 1 || input.kinds[0] !== 'course.lesson') {
    throw new EvidenceAuthError('Exactly one course and lesson must be requested', 'FORBIDDEN', 403);
  }
  const courseId = courses[0]!.id;
  const lessonId = lessons[0]!.id;
  const now = new Date(nowMs).toISOString();
  const unavailable = () => new Error('Lesson evidence store is unavailable');
  const forbidden = () => ({ forbiddenResources: input.resources.map(item => `${item.kind}:${item.id}`),
    bundle: ContextBundleSchema.parse({ evidence: [], sources: [], missing: ['course.lesson'], absent: [], stale: [], invalid: [], gatheredAt: now }) });

  // Canonical learner id comes from the authenticated actor, never request prose.
  if (!await loadEnrolledCourse(db, input.actorId, courseId)) return forbidden();

  // Read no lesson content until course enrollment and module membership pass.
  const module = await resolveCourseLesson(db, courseId, lessonId);
  if (!module) return forbidden();
  const lesson = await db.from('lessons').select('lesson_id, title, content').eq('lesson_id', lessonId).eq('module_id', module.module_id).maybeSingle();
  if (lesson.error) throw unavailable();
  if (!lesson.data) return forbidden();
  const text = JSON.stringify({ lessonTitle: lesson.data.title, moduleTitle: module.title, content: typeof lesson.data.content === 'string' ? lesson.data.content.slice(0, 2400) : '' }).slice(0, 4000);
  const revision = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), byte => byte.toString(16).padStart(2, '0')).join('');
  return { forbiddenResources: [], bundle: ContextBundleSchema.parse({ evidence: [{
    kind: 'course.lesson', reference: `lesson:${lessonId}`, text, source: 'skillpassport:lessons', revision, gatheredAt: now,
  }], sources: ['skillpassport:lessons'], missing: [], absent: [], stale: [], invalid: [], gatheredAt: now }) };
}
