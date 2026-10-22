import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callVideoWorker } from '../ai-video-summarizer';
import { getAiWorker } from '../../../ai/lib/aiBinding';

vi.mock('../../../ai/lib/aiBinding', () => ({ getAiWorker: vi.fn() }));

const JOB = '11111111-1111-4111-8111-111111111111';
const env = { AI_ASSERT_SECRET: 'video-test-secret-at-least-32-characters' };
function resultResponse(data: unknown) {
  return new Response([
    { type: 'result', result: { kind: 'video-summary', data } },
    { type: 'completed', executionId: 'e', outcome: 'answered' },
  ].map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
}
const input = { transcript: 'Educational transcript', segments: [], enableQuiz: false, enableFlashcards: false };

describe('video worker identity and output boundary', () => {
  beforeEach(() => vi.mocked(getAiWorker).mockReset());
  it('reuses the persisted job identity and binds the authenticated actor', async () => {
    const requests: any[] = [];
    vi.mocked(getAiWorker).mockReturnValue({ orchestrator: async (request: any) => {
      requests.push(request);
      return resultResponse({ summary: 'Summary' });
    } } as never);
    for (let i = 0; i < 2; i++) expect((await callVideoWorker(env, 'authenticated-user', JOB, input)).ok).toBe(true);
    expect(requests.map(request => request.operationId)).toEqual([JOB, JOB]);
    expect(requests[0].requestId).not.toBe(requests[1].requestId);
    expect(requests[0].actor.actorId).toBe('authenticated-user');
    const claims = JSON.parse(Buffer.from(requests[0].executionAssertion.split('.')[1], 'base64url').toString('utf8'));
    expect(claims.userId).toBe('authenticated-user');
    expect(claims.action).toBe('orchestration.assist');
    expect(requests[0].input.task.action).toBe('seniorEducator.summarize-video');
    expect(requests[0].input.task.input.jobId).toBe(JOB);
    expect(requests[0].input.task.input.enableQuiz).toBe(false);
    expect(requests[0].input.task.input.enableFlashcards).toBe(false);
  });
  it('rejects missing identity before resolving the worker binding', async () => {
    await expect(callVideoWorker(env, 'unknown', JOB, input)).rejects.toThrow('INVALID_INPUT');
    await expect(callVideoWorker(env, 'actor', 'invalid-job', input)).rejects.toThrow('INVALID_INPUT');
    expect(getAiWorker).not.toHaveBeenCalled();
  });
  it.each([{ summary: 123 }, { summary: 'text', secret: 'unexpected' }])('rejects invalid worker output before persistence', async data => {
    vi.mocked(getAiWorker).mockReturnValue({ orchestrator: async () => resultResponse(data) } as never);
    expect(await callVideoWorker(env, 'actor', JOB, input)).toMatchObject({ ok: false, code: 'DEPENDENCY_UNAVAILABLE' });
  });
});
