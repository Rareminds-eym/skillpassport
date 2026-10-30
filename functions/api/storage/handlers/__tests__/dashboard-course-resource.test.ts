import { describe, expect, it, vi } from 'vitest';
import { handleGetAuthenticatedUrl } from '../get-authenticated-url';
import { validateMediaToken } from '../../utils/token-crypto';

vi.mock('../../utils/course-authorization', () => ({
  checkCourseEnrollment: vi.fn(async () => ({ authorized: true })),
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetAt: 1 })),
}));

const fileKey = 'courses/resources/2026/10/slides.ppt';
const storedUrl = `/api/courses/assets?key=${encodeURIComponent(fileKey)}`;
function database(lessonExists: boolean, urls: string[]) {
  return { from: (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: lessonExists ? { lesson_id: 'lesson' } : null, error: null }),
      then: (resolve: (value: unknown) => void) => resolve({ data: urls.map(url => ({ url })), error: null }),
    };
    if (!['lessons', 'lesson_resources'].includes(table)) throw new Error('Unexpected table');
    return query;
  } };
}
function context(db: ReturnType<typeof database>) {
  return {
    request: new Request('https://app.example/api/storage/get-authenticated-url', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'test-browser' }, body: JSON.stringify({ fileUrl: storedUrl, courseId: 'course', lessonId: 'lesson', fingerprint: 'fp' }) }),
    env: { SIGNING_SECRET: 'test-secret' }, user: { id: 'learner' }, supabase: db, supabaseAdmin: db,
  };
}

describe('dashboard course asset authorization', () => {
  it('issues a signed token only for a resource in the requested lesson', async () => {
    const response = await handleGetAuthenticatedUrl(context(database(true, [storedUrl])));
    expect(response.status).toBe(200);
    const token = new URL((await response.json()).url).searchParams.get('token')!;
    const result = await validateMediaToken(token, 'test-secret');
    expect(result.valid).toBe(true);
    expect(result.payload).toMatchObject({ fileKey, courseId: 'course', lessonId: 'lesson', sharedCourseResource: true });
  });
  it('rejects a missing lesson or a resource from another lesson', async () => {
    expect((await handleGetAuthenticatedUrl(context(database(false, [storedUrl])))).status).toBe(403);
    expect((await handleGetAuthenticatedUrl(context(database(true, ['/api/courses/assets?key=other'])))).status).toBe(403);
  });
});
