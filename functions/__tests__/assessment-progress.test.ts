// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({rpc: vi.fn()}));
vi.mock('../lib/auth', () => ({withAuth: (handler: any) => handler}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({rpc: mocks.rpc})}));
import {onRequestPost} from '../api/assessment-progress';
import {updateProgressHandler} from '../api/assessment/handlers/update-progress';
import {abandonHandler} from '../api/assessment/handlers/abandon';
const owner = '10000000-0000-4000-8000-000000000001';
const attempt = '20000000-0000-4000-8000-000000000001';
const session = '30000000-0000-4000-8000-000000000001';
function ctx(body: unknown, sub = owner) {
  return {request: new Request('https://fixture.invalid/api/assessment-progress', {
    method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  }), env: {}, data: {user: {sub}}} as any;
}
beforeEach(() => {vi.clearAllMocks(); mocks.rpc.mockResolvedValue({data: {id: attempt}, error: null});});
describe('authenticated assessment progress', () => {
  it('normalizes uppercase attempt and adaptive link UUIDs', async () => {
    const mixed='20000000-0000-4000-8000-0000000000AA';
    const link='30000000-0000-4000-8000-0000000000BB';
    mocks.rpc.mockResolvedValue({data:{id:mixed.toLowerCase()},error:null});
    expect((await onRequestPost(ctx({attemptId:mixed,adaptiveAptitudeSessionId:link}))).status).toBe(200);
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({p_attempt:mixed.toLowerCase(),p_patch:{adaptive_aptitude_session_id:link.toLowerCase()}});
  });
  it('forwards only the verified subject and normalized, allowed progress fields', async () => {
    const response = await onRequestPost(ctx({attemptId: attempt, sectionIndex: 0, questionIndex: 4,
      sectionTimings: {riasec: 30}, allResponses: {q: 2}, elapsedTime: 10,
      timerRemaining: null, aptitudeQuestionTimer: 0, adaptiveAptitudeSessionId: session}));
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.rpc).toHaveBeenCalledWith('patch_owned_assessment_progress', {p_owner: owner,
      p_attempt: attempt, p_action: 'progress', p_patch: {current_section_index: 0,
        current_question_index: 4, section_timings: {riasec: 30}, all_responses: {q: 2},
        elapsed_time: 10, timer_remaining: null, aptitude_question_timer: 0, adaptive_aptitude_session_id: session}});
  });
  it.each([null, [], '{', {attemptId: 'bad'}, {attemptId: attempt, owner: session},
    {attemptId: attempt, status: 'completed'}, {attemptId: attempt, aptitude_scores: {}},
    {attemptId: attempt, sectionIndex: -1}, {attemptId: attempt, sectionIndex: 1.2},
    {attemptId: attempt, elapsedTime: '2'}, {attemptId: attempt, allResponses: []},
    {attemptId: attempt, sectionTimings: {riasec: -1}}, {attemptId: attempt, sectionTimings: {riasec: '1'}},
    {attemptId: attempt, allResponses: {}, answers: {}}, {attemptId: attempt, adaptiveAptitudeSessionId: 'bad'},
    {attemptId: attempt, action: 'abandon', allResponses: {}}, {attemptId: attempt, action: 'complete'}])('rejects invalid request %j before storage', async input => {
    expect((await onRequestPost(ctx(input))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('bounds the request before parsing', async () => {
    expect((await onRequestPost(ctx(' '.repeat(262145)))).status).toBe(413); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not trust a missing verified subject', async () => {
    expect((await onRequestPost(ctx({attemptId: attempt}, ''))).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('preserves omitted fields rather than resetting position/timers on response-only saves', async () => {
    expect((await updateProgressHandler(ctx({attemptId: attempt, answers: {q: 1}}))).status).toBe(200);
    expect(mocks.rpc.mock.calls[0][1].p_patch).toEqual({all_responses: {q: 1}});
  });
  it('treats legacy optional nulls as omitted and keeps explicit timer resets', async () => {
    const response = await updateProgressHandler(ctx({attemptId: attempt, sectionIndex: 0, questionIndex: 1,
      sectionTimings: {}, timerRemaining: null, elapsedTime: null, allResponses: null, aptitudeQuestionTimer: null}));
    expect(response.status).toBe(200);
    expect(mocks.rpc.mock.calls[0][1].p_patch).toEqual({current_section_index: 0, current_question_index: 1,
      section_timings: {}, timer_remaining: null, aptitude_question_timer: null});
  });
  it('does not let a legacy null response map mask the answers alias', async () => {
    expect((await updateProgressHandler(ctx({attemptId: attempt, allResponses: null, answers: {q: 1}}))).status).toBe(200);
    expect(mocks.rpc.mock.calls[0][1].p_patch).toEqual({all_responses: {q: 1}});
  });
  it.each([{answers: null}, {sectionTimings: null}, {elapsedTime: '1'}, {allResponses: []}])('keeps malformed progress strict: %j', async patch => {
    expect((await onRequestPost(ctx({attemptId: attempt, ...patch}))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('routes legacy abandonment through the same guarded transaction', async () => {
    expect((await abandonHandler(ctx({attemptId: attempt}))).status).toBe(200);
    expect(mocks.rpc.mock.calls[0][1].p_action).toBe('abandon');
  });
  it('does not let a legacy progress route change its action', async () => {
    expect((await updateProgressHandler(ctx({attemptId: attempt, action: 'abandon'}))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('returns the same absence response for missing or foreign attempts', async () => {
    mocks.rpc.mockResolvedValueOnce({data: null, error: null});
    expect((await onRequestPost(ctx({attemptId: attempt}))).status).toBe(404);
  });
  it('does not acknowledge a different attempt returned by a broken RPC contract', async () => {
    mocks.rpc.mockResolvedValueOnce({data: {id: session}, error: null});
    expect((await onRequestPost(ctx({attemptId: attempt}))).status).toBe(503);
  });
  it.each([['42501', 403], ['P0001', 409], ['22023', 400], ['XX000', 503], ['PGRST202', 503]])('maps storage code %s without exposing internals', async (code, status) => {
    mocks.rpc.mockResolvedValueOnce({data: null, error: {code, message: 'internal detail'}});
    const response = await onRequestPost(ctx({attemptId: attempt})); expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('internal detail'); expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
