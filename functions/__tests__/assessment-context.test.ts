import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/auth', () => ({ withAuth: (handler: any) => handler }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ rpc: mocks.rpc }) }));
import { onRequestPost } from '../api/assessment-context';
const owner = '10000000-0000-4000-8000-000000000001'; const attempt = '20000000-0000-4000-8000-000000000001';
const context = (body: unknown, sub = owner) => ({ request: new Request('https://fixture.invalid/api/assessment-context', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
}), data: { user: { sub } }, env: {} }) as any;
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ data: { attemptId: attempt } }); });
describe('self-described assessment context owner capability', () => {
  it('forwards only the verified subject and bounded self-described fields', async () => {
    const response = await onRequestPost(context({ attemptId: attempt, context: { rawGrade: 'College', selectedStream: 'bca' } }));
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.rpc).toHaveBeenCalledWith('patch_owned_assessment_context', { p_owner: owner, p_attempt: attempt,
      p_context: { rawGrade: 'College', selectedStream: 'bca' } });
  });
  it.each([null, [], '{', { attemptId: attempt, owner, context: { rawGrade: 'College' } },
    { attemptId: attempt, context: { rawGrade: 'College', aptitude_scores: 100 } },
    { attemptId: attempt, context: { rawGrade: 'College', selectedStream: [] } },
    { attemptId: attempt, context: { rawGrade: ' ' } }, { attemptId: attempt, context: { rawGrade: 'a'.repeat(301) } }])('rejects invalid context %j', async body => {
    expect((await onRequestPost(context(body))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects missing verified ownership and large requests before storage', async () => {
    expect((await onRequestPost(context({ attemptId: attempt, context: { rawGrade: 'College' } }, ''))).status).toBe(401);
    expect((await onRequestPost(context(' '.repeat(16385)))).status).toBe(413); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('keeps absent/foreign attempts indistinguishable and rejects terminal state changes', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null });
    expect((await onRequestPost(context({ attemptId: attempt, context: { rawGrade: 'College' } }))).status).toBe(404);
    mocks.rpc.mockResolvedValueOnce({ error: { code: 'P0001' } });
    expect((await onRequestPost(context({ attemptId: attempt, context: { rawGrade: 'College' } }))).status).toBe(409);
  });
});
