import { describe, expect, it } from 'vitest';
import { readOrchestratorResult } from '../lib/orchestrator-result';

const result = { type: 'result', result: { kind: 'keywords', data: { keywords: ['Physics'] } } };
const complete = { type: 'completed', executionId: 'exec-1', outcome: 'answered' };
function stream(events: unknown[]) {
  const bytes = new TextEncoder().encode(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''));
  let offset = 0;
  return new Response(new ReadableStream<Uint8Array>({ pull(controller) {
    if (offset === bytes.length) { controller.close(); return; }
    controller.enqueue(bytes.slice(offset, offset + 7)); offset = Math.min(offset + 7, bytes.length);
  } }), { headers: { 'content-type': 'text/event-stream' } });
}
describe('bounded orchestrator adapter', () => {
  it('cancels a stalled result at the whole-response deadline', async () => {
    let cancelled = false;
    const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'content-type': 'text/event-stream' } });
    await expect(readOrchestratorResult(response, 5)).rejects.toThrow('DOWNSTREAM_TIMEOUT');
    expect(cancelled).toBe(true);
  });
  it('decodes split UTF-8 frames and returns only a completed typed result', async () => {
    expect(await readOrchestratorResult(stream([result, complete]))).toEqual(result.result);
  });
  it('rejects incomplete, duplicate and streaming-answer results', async () => {
    for (const events of [[result], [result, result, complete], [{ type: 'delta', sequence: 0, text: 'answer' }, complete], [complete]]) {
      await expect(readOrchestratorResult(stream(events))).rejects.toThrow();
    }
  });
  it('preserves typed worker failures and duplicate pointers without another request', async () => {
    await expect(readOrchestratorResult(stream([{ type: 'failed', error: { code: 'AI_CREDITS_PENDING', message: 'pending', requestId: 'r', retryable: false } }]))).rejects.toThrow('AI_CREDITS_PENDING: pending');
    await expect(readOrchestratorResult(Response.json({ error: { code: 'UNAUTHORIZED', message: 'denied' } }, { status: 401 }))).rejects.toThrow('UNAUTHORIZED: denied');
    await expect(readOrchestratorResult(Response.json({ data: { duplicate: true, executionId: 'exec-1' } }))).rejects.toThrow('AI_REQUEST_IN_PROGRESS');
  });
  it('rejects oversized streams', async () => {
    await expect(readOrchestratorResult(stream([{ type: 'delta', sequence: 0, text: 'x'.repeat(128001) }]))).rejects.toThrow();
  });
});
