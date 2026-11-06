import { beforeEach, describe, expect, it, vi } from 'vitest';
const owner = '10000000-0000-4000-8000-000000000001'; const learner = '20000000-0000-4000-8000-000000000001'; const other = '20000000-0000-4000-8000-000000000002';
const mocks = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock('../lib/auth', () => ({ withAuth: (handler: any) => handler }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
import { onRequestGet, onRequestPost } from '../api/assessment-questions';
import { handleSaveQuestions, handleGetSavedQuestions, handleClearQuestions } from '../api/assessment/handlers/questions';
import { ownQuestionLearner } from '../lib/assessment-question-owner';
const context = (body?: unknown, reference = learner) => ({ request: new Request(`https://fixture.invalid/api/assessment-questions?learnerId=${reference}&streamId=bca&questionType=knowledge&gradeLevel=after12`, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), data: { user: { sub: owner } }, env: {} }) as any;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation((table: string) => {
    const chain: any = { select: () => chain, update: (value: unknown) => { mocks.update(value); return chain; },
      eq: (...args: unknown[]) => { mocks.eq(...args); return chain; }, maybeSingle: async () => ({ data: table === 'learners' ? { id: learner, user_id: owner } : { questions: [{ id: 'q', correctAnswer: 'A', options: ['A', 'B'] }] } }),
      then: (resolve: any) => resolve({ data: null, error: null }) };
    return chain;
  });
});
describe('assessment question cache ownership and answer-key authority', () => {
  it('does not read another learner cache through either route', async () => {
    expect((await onRequestGet(context(undefined, other))).status).toBe(403);
    const ctx = context(undefined, other);
    expect((await handleGetSavedQuestions(ctx.request, ctx)).status).toBe(403);
    expect(mocks.from.mock.calls.every(([table]) => table === 'learners')).toBe(true);
  });
  it('returns keyless questions for the authenticated owner', async () => {
    const response = await onRequestGet(context()); expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain('correctAnswer');
    expect(mocks.eq).toHaveBeenCalledWith('learner_id', learner);
  });
  it.each(['save-aptitude', 'save-knowledge'])('rejects caller-provided question keys for %s', async action => {
    expect((await onRequestPost(context({ action, learner_id: other, questions: [{ correctAnswer: 'spoof' }] }))).status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('blocks the compatibility key-upload route too', async () => {
    const ctx = context({ learnerId: learner, questions: [{ correctAnswer: 'spoof' }] });
    expect((await handleSaveQuestions(ctx.request, ctx)).status).toBe(409); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('refuses clearing a different learner cache through either route', async () => {
    expect((await onRequestPost(context({ action: 'clear-saved', learner_id: other, stream_id: 'bca' }))).status).toBe(403);
    const ctx = context({ learnerId: other, streamId: 'bca' });
    expect((await handleClearQuestions(ctx.request, ctx)).status).toBe(403); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('supports equivalent uppercase UUID references without widening ownership', async () => {
    expect(await ownQuestionLearner(context(), learner.toUpperCase())).toBe(learner);
  });
});
