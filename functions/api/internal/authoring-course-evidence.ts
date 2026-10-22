import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCourseEvidence } from './course-evidence';
import { loadEnrolledCourse } from './lesson-evidence';

/** Authoring uses explicit course ownership/co-ownership or an enrolled teacher learner.
 * A broad role name alone never grants access to another author's course. */
export async function loadAuthoringCourse(db: SupabaseClient, actorId: string, courseId: string) {
  const owner = await db.from('courses').select('course_id, educator_id')
    .eq('course_id', courseId).is('deleted_at', null).maybeSingle();
  if (owner.error) throw new Error('Authoring course store is unavailable');
  if (!owner.data) return null;
  let authorized = owner.data.educator_id === actorId;
  if (!authorized) {
    const coauthor = await db.from('course_co_educators').select('co_educator_id')
      .eq('course_id', courseId).eq('educator_id', actorId).maybeSingle();
    if (coauthor.error) throw new Error('Authoring course store is unavailable');
    authorized = Boolean(coauthor.data);
  }
  if (!authorized) {
    const learner = await db.from('learners').select('id, learner_type').eq('user_id', actorId).maybeSingle();
    if (learner.error) throw new Error('Authoring course store is unavailable');
    if (learner.data?.learner_type !== 'teacher') return null;
    return loadEnrolledCourse(db, actorId, courseId);
  }
  const course = await db.from('courses').select('course_id, title, description, code')
    .eq('course_id', courseId).is('deleted_at', null).maybeSingle();
  if (course.error) throw new Error('Authoring course store is unavailable');
  return course.data;
}

export const buildAuthoringCourseEvidence: typeof buildCourseEvidence = (db, input, nowMs) =>
  buildCourseEvidence(db, input, nowMs, loadAuthoringCourse);
