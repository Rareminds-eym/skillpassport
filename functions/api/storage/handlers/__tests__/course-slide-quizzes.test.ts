import { describe, expect, it, vi } from 'vitest';
import { handleCourseSlideQuizzes } from '../course-slide-quizzes';

vi.mock('../../utils/course-authorization', () => ({ checkCourseEnrollment: vi.fn(async (_db, user) => ({ authorized: user === 'enrolled' })) }));

const id = '11111111-1111-4111-8111-111111111111';

function fixture(user = 'enrolled', missing = '') {
  let progress: any = null;
  const db = {
    from(table: string) {
      const q: any = {
        select: () => q,
        eq: () => q,
        in: () => q,
        limit: () => q,
        maybeSingle: async () => {
          if (table === missing) return { data: null, error: null };
          if (table === 'learner_quiz_progress') return { data: progress, error: null };
          return { data: {}, error: null };
        },
        order: () => q,
        then: (resolve: (value: any) => unknown) => resolve(
          table === 'quizzes'
            ? { data: [{ quiz_id: id, slide_number: 4, questions: [{ question: 'Question?', options: ['A', 'B', 'C', 'D'], correct_option: 'A' }] }], error: null }
            : table === 'learner_quiz_progress'
              ? { data: progress ? [progress] : [], error: null }
              : { data: null, error: null },
        ),
        insert: async (value: any) => { progress = { ...value, id: 'progress-id' }; return { error: null }; },
        update: (value: any) => ({ eq: async () => { progress = { ...progress, ...value }; return { error: null }; } }),
      };
      return q;
    },
  };
  const request = (method = 'GET', body?: any) => ({
    request: new Request(`https://example.test/api/storage/course-slide-quizzes?courseId=${id}&lessonId=${id}&resourceId=${id}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) }),
    user: { id: user },
    supabaseAdmin: db,
  });
  return { request, getProgress: () => progress };
}

describe('slide quiz answers', () => {
  it('saves and reloads answers through learner_quiz_progress without returning the answer key', async () => {
    const f = fixture();
    const first = await (await handleCourseSlideQuizzes(f.request())).json() as any;
    expect(first.quizzes[0].questions[0].correct_option).toBeUndefined();
    const q = first.quizzes[0];
    const checked = await handleCourseSlideQuizzes(f.request('POST', { action: 'check-answer', questionIndex: 0, quizId: q.id, version: q.version, answers: { 0: 2 } }));
    expect(await checked.json()).toEqual({ correct: false });
    expect(f.getProgress()).toBeNull();
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: q.version, answers: { 0: 2 } }))).status).toBe(200);
    expect(f.getProgress()).toMatchObject({ learner_id: 'enrolled', quiz_id: q.id, answers: { 0: 2 }, total_questions: 1, current_question_index: 1, status: 'completed' });
    expect(f.getProgress()).toMatchObject({ correct_answers: 0, score_percentage: 0 });
    expect((await (await handleCourseSlideQuizzes(f.request())).json() as any).quizzes[0].answers).toEqual({ 0: 2 });
    const saved = await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: q.version, answers: { 0: 0 }, correctAnswers: 999 }));
    expect(await saved.json()).toEqual({ success: true });
    expect(f.getProgress()).toMatchObject({ correct_answers: 1, score_percentage: 100 });
    expect(f.getProgress().passed).toBeUndefined();
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: q.version, answers: { 0: 5 } }))).status).toBe(400);
    expect((await handleCourseSlideQuizzes(f.request('POST', { quizId: q.id, version: 'old', answers: {} }))).status).toBe(409);
  });

  it('rejects unenrolled learners and unrelated resources', async () => {
    for (const f of [fixture('other'), fixture('enrolled', 'lessons'), fixture('enrolled', 'lesson_resources')]) {
      expect((await handleCourseSlideQuizzes(f.request())).status).toBe(403);
    }
  });
});
