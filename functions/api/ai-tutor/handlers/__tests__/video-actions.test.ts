import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleVideoAction } from '../video-actions';
import { loadEnrolledCourse, resolveCourseLesson } from '../../../internal/lesson-evidence';
import { loadAuthoringCourse } from '../../../internal/authoring-course-evidence';
vi.mock('../../../internal/lesson-evidence', () => ({ loadEnrolledCourse: vi.fn(), resolveCourseLesson: vi.fn() }));
vi.mock('../../../internal/authoring-course-evidence', () => ({ loadAuthoringCourse: vi.fn() }));
const id = '11111111-1111-4111-8111-111111111111';
const request = new Request('https://pages.test/api/ai-tutor/actions');
function fixture(owner = 'owner', course: string | null = null, status = 'completed') {
  const reads: string[] = [];
  let error: unknown = null;
  const db = { from(table: string) {
    let columns = '';
    const chain: any = { select(value: string) { columns = value; reads.push(`${table}:${value}`); return chain; },
      eq: vi.fn(() => chain), order: () => chain, limit: () => chain,
      maybeSingle: async () => ({ data: table === 'ai_video_jobs' ? { id, actor_id: owner } : { id, processing_status: status, transcript: 'private content' }, error }),
      then(resolve: any) { return Promise.resolve({ data: [{ id, course_id: course, lesson_id: course ? 'lesson' : null, processing_status: status }], error }).then(resolve); } };
    return chain;
  } };
  return { db: db as any, reads, fail() { error = { message: 'database unavailable' }; } };
}
describe('authorized video polling and result reads', () => {
  beforeEach(() => vi.resetAllMocks());
  it('keeps authorized existing course reads working without the deferred video job table', async () => {
    const f = fixture('owner', 'course');
    vi.mocked(loadEnrolledCourse).mockResolvedValue({ course_id: 'course' } as never);
    vi.mocked(resolveCourseLesson).mockResolvedValue({ module_id: 'module' } as never);
    const response = await handleVideoAction(f.db, 'learner', 'get-video-summary', { id }, request);
    expect(JSON.stringify(await response!.json())).toContain('private content');
    expect(f.reads.some(read => read.startsWith('ai_video_jobs:'))).toBe(false);
  });
  it('lets the owner recover a standalone result by stable job id', async () => {
    const f = fixture();
    const response = await handleVideoAction(f.db, 'owner', 'check-processing-status', { id }, request, true);
    expect(await response!.json()).toMatchObject({ data: { status: 'completed', summary: { id, transcript: 'private content' } } });
  });
  it.each(['get-video-summary', 'check-processing-status', 'get-failed-record', 'get-video-summary-by-url'])('does not expose a foreign standalone source through %s', async action => {
    const f = fixture();
    const response = await handleVideoAction(f.db, 'other', action, { id, video_url: 'https://video.test/private' }, request, true);
    expect(JSON.stringify(await response!.json())).not.toContain('private content');
    expect(f.reads).not.toContain('video_summaries:*');
  });
  it('shares completed course output only after current enrollment and lesson membership pass', async () => {
    const f = fixture('owner', 'course');
    vi.mocked(loadEnrolledCourse).mockResolvedValue({ course_id: 'course' } as never);
    vi.mocked(resolveCourseLesson).mockResolvedValue({ module_id: 'module' } as never);
    const response = await handleVideoAction(f.db, 'learner', 'get-video-summary', { id }, request, true);
    expect(JSON.stringify(await response!.json())).toContain('private content');
    expect(resolveCourseLesson).toHaveBeenCalledWith(f.db, 'course', 'lesson');
  });
  it('denies revoked enrollment, wrong lesson membership and in-progress sharing', async () => {
    for (const status of ['completed', 'processing']) {
      const f = fixture('owner', 'course', status);
      await handleVideoAction(f.db, 'learner', 'get-video-summary', { id }, request, true);
      expect(f.reads).not.toContain('video_summaries:*');
    }
    const f = fixture('owner', 'course');
    vi.mocked(loadAuthoringCourse).mockResolvedValue({ course_id: 'course' } as never);
    vi.mocked(resolveCourseLesson).mockResolvedValue(null);
    await handleVideoAction(f.db, 'teacher', 'get-video-summary', { id }, request, true);
    expect(f.reads).not.toContain('video_summaries:*');
  });
  it('refuses deletion-based regeneration and malformed ids without database reads', async () => {
    const f = fixture();
    expect((await handleVideoAction(f.db, 'owner', 'delete-video-summary', { id }, request, true))!.status).toBe(409);
    expect((await handleVideoAction(f.db, 'owner', 'get-video-summary', { id: 'bad' }, request, true))!.status).toBe(400);
    expect(f.reads).toEqual([]);
  });
  it('fails closed on storage outage', async () => {
    const f = fixture(); f.fail();
    await expect(handleVideoAction(f.db, 'owner', 'get-video-summary', { id }, request, true)).rejects.toThrow('unavailable');
    expect(f.reads).not.toContain('video_summaries:*');
  });
});
