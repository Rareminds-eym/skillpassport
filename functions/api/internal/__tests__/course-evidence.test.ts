import { describe, expect, it } from 'vitest';
import { buildCourseEvidence } from '../course-evidence';

const courseId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
const input = { actorId: 'actor', kinds: ['course.summary'], resources: [{ kind: 'course', id: courseId }] };
function fixture() {
  const rows: Record<string, any> = {
    learners: { id: 'canonical-learner', user_id: 'actor' },
    course_enrollments: { id: 'enrollment', learner_id: 'canonical-learner', course_id: courseId, status: 'active' },
    courses: { course_id: courseId, status: 'Active', deleted_at: null, title: 'Biology', description: 'Cells', code: 'BIO' },
    lessons: { lesson_id: lessonId, module_id: 'module' },
    course_modules: { module_id: 'module', course_id: courseId, title: 'Cells' },
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
        if (table === failed) return { data: null, error: { message: 'private error' } };
        const row = rows[table];
        return { data: row && Object.entries(filters).every(([key, value]) => row[key] === value) ? row : null, error: null };
      },
    }; return chain;
  } };
  return { db: db as never, rows, reads, fail: (table: string) => { failed = table; } };
}
describe('course evidence projection', () => {
  it('returns only bounded authorized course facts without requiring a lesson', async () => {
    const f = fixture();
    const result = await buildCourseEvidence(f.db, input, 1000);
    expect(result.forbiddenResources).toEqual([]);
    expect(result.bundle.evidence[0]).toMatchObject({ kind: 'course.summary', reference: `course:${courseId}`, source: 'skillpassport:courses' });
    expect(result.bundle.evidence[0]?.text).toContain('Biology');
    expect(f.reads.some(read => read.startsWith('lessons:'))).toBe(false);
  });
  it('verifies an optional lesson belongs to that course without reading lesson content', async () => {
    const f = fixture();
    const scoped = { ...input, resources: [...input.resources, { kind: 'lesson', id: lessonId }] };
    expect((await buildCourseEvidence(f.db, scoped, 1000)).forbiddenResources).toEqual([]);
    expect(f.reads.some(read => read.includes('content'))).toBe(false);
    f.rows.course_modules.course_id = 'different-course';
    expect((await buildCourseEvidence(f.db, scoped, 1000)).forbiddenResources).toHaveLength(2);
  });
  it('denies other actors, revoked enrollment and unpublished courses', async () => {
    for (const mode of ['actor', 'enrollment', 'course']) {
      const f = fixture();
      if (mode === 'enrollment') f.rows.course_enrollments.status = 'revoked';
      if (mode === 'course') f.rows.courses.status = 'Draft';
      const result = await buildCourseEvidence(f.db, mode === 'actor' ? { ...input, actorId: 'other' } : input, 1000);
      expect(result.forbiddenResources).toHaveLength(1);
      expect(result.bundle.evidence).toEqual([]);
    }
  });
  it('fails on unavailable stores and rejects malformed or excess resources', async () => {
    const f = fixture(); f.fail('course_enrollments');
    await expect(buildCourseEvidence(f.db, input, 1000)).rejects.toThrow('unavailable');
    for (const resources of [[], [...input.resources, ...input.resources], [{ kind: 'course', id: 'invalid' }]]) {
      await expect(buildCourseEvidence(f.db, { ...input, resources }, 1000)).rejects.toMatchObject({ status: 403 });
    }
  });
});
