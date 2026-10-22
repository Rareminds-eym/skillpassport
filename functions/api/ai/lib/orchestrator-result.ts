import { OrchestratorEventSchema, type OrchestratorBoundedResult } from '@rareminds-eym/ai-protocol';

/** Bounded server-side result adapter. Never retry a partially consumed execution. */
export async function readOrchestratorResult(response: Response, timeoutMs = 60000): Promise<OrchestratorBoundedResult> {
  if (response.headers.get('content-type')?.includes('application/json')) {
    const payload = await response.json() as { error?: { code?: string; message?: string } };
    if (!response.ok && typeof payload.error?.code === 'string') throw new Error(`${payload.error.code}: ${payload.error.message ?? 'AI request unavailable'}`);
    throw new Error('AI_REQUEST_IN_PROGRESS: No completed result is available for this execution');
  }
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
    throw new Error('AI_REQUEST_IN_PROGRESS: No completed result is available for this execution');
  }
  const reader = response.body.getReader();
  const deadline = Date.now() + timeoutMs;
  const decoder = new TextDecoder();
  let bytes = 0;
  let buffer = '';
  let result: OrchestratorBoundedResult | undefined;
  let completed = false;
  try {
    for (;;) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const chunk = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('DOWNSTREAM_TIMEOUT: Orchestrator result timed out')), Math.max(0, deadline - Date.now())); }),
      ]).finally(() => { if (timer !== undefined) clearTimeout(timer); });
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 128000) throw new Error('INVALID_MODEL_OUTPUT: Orchestrator result exceeds limit');
      buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r/g, '');
      let end: number;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (!frame.startsWith('data: ')) throw new Error('INVALID_MODEL_OUTPUT: Invalid orchestrator frame');
        const event = OrchestratorEventSchema.parse(JSON.parse(frame.slice(6)));
        if (completed) throw new Error('INVALID_MODEL_OUTPUT: Event after terminal result');
        if (event.type === 'failed' || event.type === 'partial') throw new Error(`${event.error.code}: ${event.error.message}`);
        if (event.type === 'clarification' || event.type === 'unsupported' || event.type === 'delta') throw new Error('INVALID_MODEL_OUTPUT: Expected a bounded task result');
        if (event.type === 'result') {
          if (result) throw new Error('INVALID_MODEL_OUTPUT: Duplicate task result');
          result = event.result;
        }
        if (event.type === 'completed') completed = event.outcome === 'answered';
      }
    }
    if (buffer.trim() || !completed || !result) throw new Error('INVALID_MODEL_OUTPUT: Orchestrator result did not complete');
    return result;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
