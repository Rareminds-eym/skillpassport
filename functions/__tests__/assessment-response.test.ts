// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({rpc: vi.fn()}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({rpc: mocks.rpc})}));
import {saveResponseHandler} from '../api/assessment/handlers/save-response';
const owner = '10000000-0000-4000-8000-000000000001';
const attemptId = '20000000-0000-4000-8000-000000000001';
const questionId = '30000000-0000-4000-8000-000000000001';
const receipt = {id: '40000000-0000-4000-8000-000000000001', attempt_id: attemptId, question_id: questionId, is_correct: null};
const ctx = (body: unknown, sub = owner) => ({request: new Request('https://fixture.invalid/api/assessment/save-response', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
}), env: {}, data: {user: {sub}}}) as any;
beforeEach(() => {vi.clearAllMocks(); mocks.rpc.mockResolvedValue({data: receipt, error: null});});
it('accepts mixed-case UUIDs with PostgreSQL canonical receipts', async () => {
  const mixedAttempt='20000000-0000-4000-8000-0000000000AA';
  const mixedQuestion='30000000-0000-4000-8000-0000000000bB';
  mocks.rpc.mockResolvedValue({data:{...receipt,attempt_id:mixedAttempt.toLowerCase(),question_id:mixedQuestion.toLowerCase()},error:null});
  expect((await saveResponseHandler(ctx({attemptId:mixedAttempt,questionId:mixedQuestion,answer:1}))).status).toBe(200);
  expect(mocks.rpc.mock.calls[0][1]).toMatchObject({p_attempt:mixedAttempt.toLowerCase(),p_question:mixedQuestion.toLowerCase()});
});
it.each([0, false, '', [], {selected: 'A'}])('saves raw answer %j using only the verified owner', async answer => {
  const response = await saveResponseHandler(ctx({attemptId, questionId, answer}));
  expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('save_owned_assessment_response', {
    p_owner: owner, p_attempt: attemptId, p_question: questionId, p_answer: answer,
  });
});
it.each([null, [], '{', {attemptId, questionId}, {attemptId, questionId, answer: null},
  {attemptId: 'bad', questionId, answer: 1}, {attemptId, questionId: 'bad', answer: 1},
  {attemptId, questionId, answer: 1, isCorrect: true}, {attemptId, questionId, answer: 1, owner}])('rejects invalid/privileged request %j', async input => {
  expect((await saveResponseHandler(ctx(input))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
});
it('rejects oversized input before storage', async () => {
  expect((await saveResponseHandler(ctx(' '.repeat(262145)))).status).toBe(413); expect(mocks.rpc).not.toHaveBeenCalled();
});
it('requires a verified subject', async () => {
  expect((await saveResponseHandler(ctx({attemptId, questionId, answer: 1}, ''))).status).toBe(401);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not distinguish missing and foreign attempts', async () => {
  mocks.rpc.mockResolvedValue({data: null, error: null});
  expect((await saveResponseHandler(ctx({attemptId, questionId, answer: 1}))).status).toBe(404);
});
it.each([['22023', 400], ['42501', 403], ['P0001', 409], ['PGRST202', 503]])('propagates sanitized storage error %s', async (code, status) => {
  mocks.rpc.mockResolvedValue({data: null, error: {code, message: 'private detail'}});
  const response = await saveResponseHandler(ctx({attemptId, questionId, answer: 1}));
  expect(response.status).toBe(status); expect(await response.text()).not.toContain('private detail');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it.each([{...receipt, attempt_id: questionId}, {...receipt, question_id: attemptId}, {...receipt, is_correct: true}, {...receipt, id: 'bad'}])('rejects invalid receipts %j', async data => {
  mocks.rpc.mockResolvedValue({data, error: null});
  expect((await saveResponseHandler(ctx({attemptId, questionId, answer: 1}))).status).toBe(503);
});
