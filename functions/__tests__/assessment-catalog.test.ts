import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../lib/auth', () => ({ withAuth: (handler: any) => handler }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ rpc: mocks.rpc, from: mocks.from }) }));
import { onRequestGet } from '../api/assessment-catalog';
const owner = '10000000-0000-4000-8000-000000000001'; const attempt = '20000000-0000-4000-8000-000000000001'; const section = '30000000-0000-4000-8000-000000000001';
const context = (query: string, sub = owner) => ({ request: new Request(`https://fixture.invalid/api/assessment-catalog?${query}`), data: { user: { sub } }, env: {} }) as any;
beforeEach(() => { vi.clearAllMocks(); });
describe('immutable owned catalog question delivery', () => {
  it('binds the verified subject and strips nested keys before HTTP delivery', async () => {
    mocks.rpc.mockResolvedValue({ data: { bound: true, questions: [{ id: 'q', question_text: 'Question', correct_answer: 'A', metadata: { explanation: 'Secret' }, options: [{ value: 'A', is_correct: true }] }] } });
    const response = await onRequestGet(context(`attemptId=${attempt}&sectionId=${section}`));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('snapshot_owned_assessment_catalog', { p_owner: owner, p_attempt: attempt, p_section: section });
    expect(await response.json()).toEqual({ questions: [{ id: 'q', question_text: 'Question', metadata: {}, options: [{ value: 'A' }] }] });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('never delivers a fallback question set when ownership/binding fails', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null });
    expect((await onRequestGet(context(`attemptId=${attempt}&sectionId=${section}`))).status).toBe(404);
    mocks.rpc.mockResolvedValueOnce({ error: { code: 'P0001' } });
    expect((await onRequestGet(context(`attemptId=${attempt}&sectionId=${section}`))).status).toBe(409);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([`attemptId=bad&sectionId=${section}`, `sectionId=${section}&owner=${owner}`, `sectionId=${section}&sectionId=${section}`])('rejects invalid delivery query %s', async query => {
    expect((await onRequestGet(context(query))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('requires a verified subject before catalog access', async () => {
    expect((await onRequestGet(context(`sectionId=${section}`, ''))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
  });
});
