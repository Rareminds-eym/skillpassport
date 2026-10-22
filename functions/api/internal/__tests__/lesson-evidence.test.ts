import { describe, expect, it } from 'vitest';
import { buildLessonEvidence } from '../lesson-evidence';
import { assertEvidenceKindsAllowed, assertResourceKindsAllowed } from '../evidence-auth';

const courseId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
const input = { actorId: 'authenticated-user', kinds: ['course.lesson'], resources: [{ kind: 'course', id: courseId }, { kind: 'lesson', id: lessonId }] };
function fixture() {
  const rows: Record<string, Record<string, unknown>> = {
    learners: { id: 'canonical-learner', user_id: 'authenticated-user' },
    course_enrollments: { id: 'enrollment', learner_id: 'canonical-learner', course_id: courseId, status: 'active' },
    courses: { course_id: courseId, status: 'Active', deleted_at: null },
    course_modules: { module_id: 'module', course_id: courseId, title: 'Module title' },
    lessons: { lesson_id: lessonId, module_id: 'module', title: 'Lesson title', content: 'Authorized lesson facts' },
  };
  let contentReads = 0;
  let failTable = '';
  const queries: Array<{ table: string; filters: Record<string, unknown> }> = [];
  const db = { from(table: string) {
    let columns = '';
    const filters: Record<string, unknown> = {};
    queries.push({ table, filters });
    const chain = {
      select(value: string) { columns = value; return chain; },
      eq(key: string, value: unknown) { filters[key] = value; return chain; },
      is(key: string, value: unknown) { filters[key] = value; return chain; },
      async maybeSingle() {
        if (table === 'lessons' && columns.includes('content')) contentReads++;
        if (table === failTable) return { data: null, error: { message: 'private diagnostic' } };
        const row = rows[table];
        return { data: row && Object.entries(filters).every(([key, value]) => row[key] === value) ? row : null, error: null };
      },
    };
    return chain;
  } };
  return { rows, db: db as never, queries, contentReads: () => contentReads, fail: (table: string) => { failTable = table; } };
}

describe('authorized learner lesson evidence', () => {
  it('derives the learner from actor identity and returns bounded factual provenance', async () => {
    const f = fixture();
    const result = await buildLessonEvidence(f.db, input, 1000);
    expect(result.forbiddenResources).toEqual([]);
    expect(result.bundle.evidence[0]).toMatchObject({ kind: 'course.lesson', source: 'skillpassport:lessons', reference: `lesson:${lessonId}`, gatheredAt: new Date(1000).toISOString() });
    expect(result.bundle.evidence[0]?.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(result.bundle.evidence[0]?.text).toContain('Authorized lesson facts');
    expect(f.queries.find(query => query.table === 'learners')?.filters).toEqual({ user_id: input.actorId });
    expect(f.queries.find(query => query.table === 'course_enrollments')?.filters).toEqual({ learner_id: 'canonical-learner', course_id: courseId });
    expect(f.contentReads()).toBe(1);
  });
  it('does not read lesson content for another actor or course', async () => {
    for (const change of ['actor', 'course']) {
      const f = fixture();
      if (change === 'course') f.rows.course_modules!.course_id = 'other-course';
      const result = await buildLessonEvidence(f.db, change === 'actor' ? { ...input, actorId: 'other-user' } : input, 1000);
      expect(result.forbiddenResources).toHaveLength(2);
      expect(result.bundle.evidence).toEqual([]);
      expect(f.contentReads()).toBe(0);
    }
  });
  it('denies revoked, cancelled or unknown enrollment status before content reads', async () => {
    for (const status of ['revoked', 'cancelled', null, 'future-status']) {
      const f = fixture(); f.rows.course_enrollments!.status = status;
      expect((await buildLessonEvidence(f.db, input, 1000)).forbiddenResources).toHaveLength(2);
      expect(f.contentReads()).toBe(0);
    }
  });
  it('denies deleted or unpublished courses before lesson content reads', async () => {
    for (const mode of ['deleted', 'Draft', 'Archived']) {
      const f = fixture();
      if (mode === 'deleted') f.rows.courses!.deleted_at = '2026-10-21';
      else f.rows.courses!.status = mode;
      expect((await buildLessonEvidence(f.db, input, 1000)).forbiddenResources).toHaveLength(2);
      expect(f.contentReads()).toBe(0);
    }
  });
  it('keeps database failure distinct from an authorization denial', async () => {
    const f = fixture(); f.fail('course_enrollments');
    await expect(buildLessonEvidence(f.db, input, 1000)).rejects.toThrow('evidence store is unavailable');
    expect(f.contentReads()).toBe(0);
  });
  it('rejects missing, duplicate, malformed and cross-kind resource references', async () => {
    for (const resources of [[], [input.resources[0]!], [...input.resources, input.resources[0]!], [{ kind: 'course', id: 'not-a-uuid' }, input.resources[1]!], [{ kind: 'learner', id: courseId }, input.resources[1]!]]) {
      const f = fixture();
      await expect(buildLessonEvidence(f.db, { ...input, resources }, 1000)).rejects.toMatchObject({ status: 403 });
      expect(f.queries).toEqual([]);
    }
  });
  it('separates Career and tutor task evidence/resource permissions', () => {
    expect(() => assertEvidenceKindsAllowed('senior-educator.suggest', ['course.lesson'])).not.toThrow();
    expect(() => assertResourceKindsAllowed(input.resources, 'senior-educator.suggest')).not.toThrow();
    expect(() => assertEvidenceKindsAllowed('career-talent-strategist.chat', ['course.lesson'])).toThrow();
    expect(() => assertEvidenceKindsAllowed('senior-educator.suggest', ['learner.profile'])).toThrow();
    expect(() => assertResourceKindsAllowed(input.resources, 'career-talent-strategist.chat')).toThrow();
  });
});
