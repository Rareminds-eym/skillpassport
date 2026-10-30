import { describe, expect, it, vi } from 'vitest';
import { handleCourseResource } from '../course-resource';

vi.mock('../../utils/course-authorization', () => ({
  checkCourseEnrollment: vi.fn(async (_db, user) => ({ authorized: user === 'enrolled' })),
}));

const key = 'courses/resources/slides.pptx';
function context(user = 'enrolled', storedKey = key) {
  const bucket = { get: vi.fn(async () => ({ body: 'slides', httpMetadata: { contentType: 'application/octet-stream' } })) };
  const db = { from(table: string) {
    const query = {
      select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { lesson_id: 'lesson' }, error: null }),
      then: (resolve: (value: unknown) => void) => resolve({ data: [{ url: `/api/courses/assets?key=${encodeURIComponent(storedKey)}` }], error: null }),
    };
    if (!['lessons', 'lesson_resources'].includes(table)) throw new Error('Unexpected table');
    return query;
  } };
  return { request: new Request(`https://example.com/api/storage/course-resource?courseId=course&lessonId=lesson&key=${encodeURIComponent(key)}`), user: { id: user }, supabaseAdmin: db, env: { R2_BUCKET: bucket } };
}

describe('course resource access', () => {
  it('serves an enrolled learner without a signing secret', async () => {
    const ctx = context();
    const response = await handleCourseResource(ctx);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('slides');
    expect(ctx.env.R2_BUCKET.get).toHaveBeenCalledWith(key);
  });
  it('rejects unenrolled users and resources from a different lesson', async () => {
    for (const ctx of [context('other'), context('enrolled', 'courses/resources/other.pptx')]) {
      expect((await handleCourseResource(ctx)).status).toBe(403);
      expect(ctx.env.R2_BUCKET.get).not.toHaveBeenCalled();
    }
  });
});
