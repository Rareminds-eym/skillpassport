import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), rpc: vi.fn(), analyze: vi.fn(), attempt: null as any }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from, rpc: mocks.rpc }) }));
vi.mock('../api/assessment/services/analyzers/analysis-middle-school', () => ({ analyzeMiddleSchool: mocks.analyze }));
vi.mock('../api/assessment/services/analyzers/analysis-highschool', () => ({ analyzeHighSchool: mocks.analyze }));
vi.mock('../api/assessment/services/analyzers/analysis-higher-secondary', () => ({ analyzeHigherSecondary: mocks.analyze }));
vi.mock('../api/assessment/services/analyzers/analysis-after10', () => ({ analyzeAfter10: mocks.analyze }));
vi.mock('../api/assessment/services/analyzers/analysis-after12', () => ({ analyzeAfter12: mocks.analyze }));
vi.mock('../api/assessment/services/analyzers/analysis-college', () => ({ analyzeCollege: mocks.analyze }));
import { analyzeHandler } from '../api/assessment/handlers/analyze';
const owner = '10000000-0000-4000-8000-000000000001'; const attempt = '20000000-0000-4000-8000-000000000001';
const context = (body: unknown) => ({ request: new Request('https://fixture.invalid/api/assessment/analyze', { method: 'POST', body: JSON.stringify(body) }), data: { user: { sub: owner } }, env: {} }) as any;
beforeEach(() => {
  vi.clearAllMocks(); mocks.attempt = { id: attempt, grade_level: 'after12' };
  mocks.from.mockImplementation((table: string) => {
    const chain: any = { select: () => chain, eq: (...args: unknown[]) => { mocks.eq(...args); return chain; },
      maybeSingle: async () => ({ data: table === 'learners' ? { id: 'learner', user_id: owner } : mocks.attempt }) };
    return chain;
  });
  mocks.analyze.mockResolvedValue(Response.json({ success: true })); mocks.rpc.mockResolvedValue({ data: { receiptId: 'receipt' } });
});
describe('assessment analysis owner and grading boundary', () => {
  it('checks the owned attempt even when a grade is supplied, then grades persisted answers', async () => {
    expect((await analyzeHandler(context({ attemptId: attempt, gradeLevel: 'after12' }))).status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith('learner_id', 'learner');
    expect(mocks.rpc).toHaveBeenCalledWith('grade_owned_assessment', { p_owner: owner, p_attempt: attempt });
  });
  it('does not analyze a missing/foreign attempt', async () => {
    mocks.attempt = null;
    expect((await analyzeHandler(context({ attemptId: attempt, gradeLevel: 'after12' }))).status).toBe(404);
    expect(mocks.analyze).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects caller grade overrides of the canonical owned attempt', async () => {
    expect((await analyzeHandler(context({ attemptId: attempt, gradeLevel: 'college' }))).status).toBe(400);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it('fails visibly when objective grading cannot be confirmed', async () => {
    mocks.rpc.mockResolvedValue({ error: { message: 'private database details' } });
    const response = await analyzeHandler(context({ attemptId: attempt }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private database');
  });
});
