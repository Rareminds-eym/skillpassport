import { describe, expect, it, vi } from 'vitest';
import { handleCourseSlideQuizzes } from '../course-slide-quizzes';
vi.mock('../../utils/course-authorization', () => ({ checkCourseEnrollment: vi.fn(async (_db, user) => ({ authorized: user === 'enrolled' })) }));
const id = '11111111-1111-4111-8111-111111111111';
function fixture(user = 'enrolled', missing = '') {
  let saved: any = null;
  const db = { from(table: string) {
    const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: table === missing ? null : {}, error: null }), order: async () => ({ data: [{ quiz_id: id, slide_number: 4, questions: [{ question: 'Question?', options: ['A', 'B', 'C', 'D'], correct_option: 'A' }] }], error: null }), in: async () => ({ data: saved && saved.user_id === user ? [saved] : [], error: null }), upsert: async (value: any) => { saved = value; return { error: null }; } };
    return q;
  } };
  const request = (method = 'GET', body?: any) => ({ request: new Request(`https://example.test/api/storage/course-slide-quizzes?courseId=${id}&lessonId=${id}&resourceId=${id}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) }), user: { id: user }, supabaseAdmin: db });
  return { request };
}
describe('slide quiz answers', () => {
  it('saves and reloads answers without returning the answer key', async () => {
    const f = fixture();
    const first = await (await handleCourseSlideQuizzes(f.request())).json() as any;
    expect(first.quizzes[0].questions[0].correct_option).toBeUndefined();
    const q = first.quizzes[0];
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: q.version, answers: { 0: 2 } }))).status).toBe(200);
    expect((await (await handleCourseSlideQuizzes(f.request())).json() as any).quizzes[0].answers).toEqual({ 0: 2 });
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: q.version, answers: { 0: 5 } }))).status).toBe(400);
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: 'old', answers: {} }))).status).toBe(409);
  });
  it('rejects unenrolled learners and unrelated resources', async () => {
    for (const f of [fixture('other'), fixture('enrolled', 'lessons'), fixture('enrolled', 'lesson_resources')]) expect((await handleCourseSlideQuizzes(f.request())).status).toBe(403);
  });
});
