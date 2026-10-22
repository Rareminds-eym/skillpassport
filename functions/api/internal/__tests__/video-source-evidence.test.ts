import { describe, expect, it, vi } from 'vitest';
import { buildVideoSourceEvidence } from '../video-source-evidence';
import { loadEnrolledCourse, resolveCourseLesson } from '../lesson-evidence';
vi.mock('../lesson-evidence', () => ({ loadEnrolledCourse: vi.fn(), resolveCourseLesson: vi.fn() }));
vi.mock('../authoring-course-evidence', () => ({ loadAuthoringCourse: vi.fn(async () => null) }));

const id = '11111111-1111-4111-8111-111111111111';
const input = { actorId: 'owner', kinds: ['video.source'], resources: [{ kind: 'video-job', id }] };
function fixture(row: any, error: unknown = null, scope: any = { id, course_id: null, lesson_id: null }) {
  const filters: Record<string, unknown> = {};
  const chain = { select: vi.fn(() => chain), eq: vi.fn((key, value) => { filters[key] = value; return chain; }),
    maybeSingle: vi.fn(async () => ({ data: row && row.id === filters.id && row.actor_id === filters.actor_id ? row : null, error })) };
  const summaryChain = { select: vi.fn(() => summaryChain), eq: vi.fn(() => summaryChain), maybeSingle: async () => ({ data: scope, error }) };
  return { db: { from: vi.fn(table => table === 'video_summaries' ? summaryChain : chain) } as any, chain };
}
describe('immutable video source evidence', () => {
  it('returns only an owned frozen source hash and never the private source payload', async () => {
    const f = fixture({ id, actor_id: 'owner', source_hash: 'a'.repeat(64), source_input: { transcript: 'private' } });
    const result = await buildVideoSourceEvidence(f.db, input, 1000);
    expect(f.chain.select).toHaveBeenCalledWith('id, source_hash');
    expect(result.bundle.evidence[0]).toMatchObject({ reference: `video-job:${id}`, revision: 'a'.repeat(64) });
    expect(JSON.stringify(result)).not.toContain('private');
  });
  it('denies foreign, missing, unfrozen and corrupted source records', async () => {
    for (const row of [null, { id, actor_id: 'other', source_hash: 'a'.repeat(64) },
      { id, actor_id: 'owner', source_hash: null }, { id, actor_id: 'owner', source_hash: 'bad' }]) {
      const result = await buildVideoSourceEvidence(fixture(row).db, input, 1000);
      expect(result.forbiddenResources).toEqual([`video-job:${id}`]);
      expect(result.bundle.evidence).toEqual([]);
    }
  });
  it('rejects widened resource and evidence scopes before database access', async () => {
    const f = fixture(null);
    for (const invalid of [{ ...input, kinds: ['learner.profile'] }, { ...input, resources: [] },
      { ...input, resources: [...input.resources, ...input.resources] }, { ...input, resources: [{ kind: 'course', id }] }]) {
      await expect(buildVideoSourceEvidence(f.db, invalid, 1000)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
    expect(f.db.from).not.toHaveBeenCalled();
  });
  it('distinguishes storage outage from a denied resource', async () => {
    await expect(buildVideoSourceEvidence(fixture(null, { message: 'outage' }).db, input, 1000)).rejects.toThrow('unavailable');
  });
  it('rechecks current course authority and lesson membership before authorizing inference', async () => {
    const row = { id, actor_id: 'owner', source_hash: 'a'.repeat(64) };
    const scope = { id, course_id: 'course', lesson_id: 'lesson' };
    vi.mocked(loadEnrolledCourse).mockResolvedValue(null);
    expect((await buildVideoSourceEvidence(fixture(row, null, scope).db, input, 1000)).forbiddenResources).toHaveLength(1);
    vi.mocked(loadEnrolledCourse).mockResolvedValue({ course_id: 'course' } as never);
    vi.mocked(resolveCourseLesson).mockResolvedValue(null);
    expect((await buildVideoSourceEvidence(fixture(row, null, scope).db, input, 1000)).forbiddenResources).toHaveLength(1);
    vi.mocked(resolveCourseLesson).mockResolvedValue({ module_id: 'module' } as never);
    expect((await buildVideoSourceEvidence(fixture(row, null, scope).db, input, 1000)).forbiddenResources).toEqual([]);
  });
});
