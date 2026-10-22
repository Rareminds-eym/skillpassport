import { describe, expect, it } from 'vitest';
import { buildAuthoringCourseEvidence, loadAuthoringCourse } from '../authoring-course-evidence';

const courseId = '11111111-1111-4111-8111-111111111111';
function fixture() {
  const rows: Record<string, any> = {
    courses: { course_id: courseId, educator_id: 'author', deleted_at: null, status: 'Active', title: 'Biology', description: 'Cells', code: 'BIO' },
    course_co_educators: null,
    learners: { id: 'learner', user_id: 'teacher', learner_type: 'teacher' },
    course_enrollments: { id: 'enrolled', learner_id: 'learner', course_id: courseId, status: 'active' },
  };
  const reads: string[] = [];
  let failed = '';
  const db = { from(table: string) {
    const filters: Record<string, unknown> = {};
    const chain = {
      select(columns: string) { reads.push(`${table}:${columns}`); return chain; },
      eq(key: string, value: unknown) { filters[key] = value; return chain; },
      is(key: string, value: unknown) { filters[key] = value; return chain; },
      async maybeSingle() {
        if (table === failed) return { data: null, error: { code: 'outage' } };
        const row = rows[table];
        return { data: row && Object.entries(filters).every(([key, value]) => row[key] === value) ? row : null, error: null };
      },
    }; return chain;
  } };
  return { db: db as never, rows, reads, fail: (table: string) => { failed = table; } };
}

describe('authoring course scope', () => {
  it.each(['author', 'coauthor', 'teacher'])('supports the recorded %s without broad role grants', async actorId => {
    const f = fixture();
    if (actorId === 'coauthor') f.rows.course_co_educators = { co_educator_id: 'link', course_id: courseId, educator_id: actorId };
    const result = await buildAuthoringCourseEvidence(f.db, { actorId, kinds: ['course.summary'], resources: [{ kind: 'course', id: courseId }] }, 1000);
    expect(result.forbiddenResources).toEqual([]);
    expect(result.bundle.evidence[0]?.reference).toBe(`course:${courseId}`);
  });
  it('does not read course facts for another author or an ordinary learner', async () => {
    for (const actor of ['other', 'teacher']) {
      const f = fixture(); f.rows.learners.learner_type = 'learner';
      expect(await loadAuthoringCourse(f.db, actor, courseId)).toBeNull();
      expect(f.reads).not.toContain('courses:course_id, title, description, code');
    }
  });
  it('rejects revoked teacher enrollment and deleted courses', async () => {
    const f = fixture(); f.rows.course_enrollments.status = 'revoked';
    expect(await loadAuthoringCourse(f.db, 'teacher', courseId)).toBeNull();
    f.rows.courses.deleted_at = '2026-10-22';
    expect(await loadAuthoringCourse(f.db, 'author', courseId)).toBeNull();
  });
  it.each(['courses', 'course_co_educators', 'learners', 'course_enrollments'])('fails closed on %s outage', async table => {
    const f = fixture(); f.fail(table);
    await expect(loadAuthoringCourse(f.db, 'teacher', courseId)).rejects.toThrow('unavailable');
  });
});
