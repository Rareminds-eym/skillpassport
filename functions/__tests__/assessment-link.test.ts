// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({rpc: vi.fn()}));
vi.mock('../lib/auth', () => ({withAuth: (handler: any) => handler}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({rpc: mocks.rpc})}));
import {onRequestPost} from '../api/adaptive-session/link-to-attempt';
const owner = '10000000-0000-4000-8000-000000000001';
const attemptId = '20000000-0000-4000-8000-000000000001';
const sessionId = '30000000-0000-4000-8000-000000000001';
const ctx = (body: unknown) => ({request: new Request('https://fixture.invalid/api/adaptive-session/link-to-attempt', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
}), env: {}, data: {user: {sub: owner}}}) as any;
beforeEach(() => {vi.clearAllMocks(); mocks.rpc.mockResolvedValue({data: {id: attemptId}, error: null});});
it('uses only the verified owner and one guarded transaction', async () => {
  const response = await onRequestPost(ctx({attemptId, sessionId}));
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('patch_owned_assessment_progress', {
    p_owner: owner, p_attempt: attemptId, p_action: 'progress', p_patch: {adaptive_aptitude_session_id: sessionId},
  });
});
it('does not expose completed-link metadata for a missing or foreign attempt', async () => {
  mocks.rpc.mockResolvedValue({data: null, error: null});
  const response = await onRequestPost(ctx({attemptId, sessionId}));
  expect(response.status).toBe(404); expect(await response.text()).not.toContain('SessionId');
});
it.each([['42501', 403], ['P0001', 409], ['PGRST202', 503]])('preserves ownership/state/unavailable error %s', async (code, status) => {
  mocks.rpc.mockResolvedValue({data: null, error: {code, message: 'private storage detail'}});
  const response = await onRequestPost(ctx({attemptId, sessionId}));
  expect(response.status).toBe(status); expect(await response.text()).not.toContain('private storage detail');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it.each([null, '{', {attemptId}, {attemptId, sessionId: 'bad'}, {attemptId: 'bad', sessionId},
  {attemptId, sessionId, owner}, {attemptId, sessionId, action: 'abandon'}, {attemptId, sessionId, answers: {q: 1}}])('rejects invalid link input %j', async body => {
  expect((await onRequestPost(ctx(body))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not acknowledge an incorrect attempt receipt', async () => {
  mocks.rpc.mockResolvedValue({data: {id: sessionId}, error: null});
  expect((await onRequestPost(ctx({attemptId, sessionId}))).status).toBe(503);
});
