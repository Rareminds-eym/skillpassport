import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../ai-video-summarizer';
import { createSupabaseAdminClient } from '../../../../lib/supabase';
import { transcribeVideo } from '../../utils/transcription';
import { getAiWorker } from '../../../ai/lib/aiBinding';
import { buildVideoPrompts } from '../../prompts/video-summary';

vi.mock('../../../../lib/supabase', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('../../utils/transcription', () => ({ transcribeVideo: vi.fn() }));
vi.mock('../../../ai/lib/aiBinding', () => ({ getAiWorker: vi.fn() }));
const JOB = '11111111-1111-4111-8111-111111111111';
const request = () => new Request('https://pages.test/api/course/ai-video-summarizer', { method: 'POST', body: JSON.stringify({ videoUrl: 'https://example.test/video', enableQuiz: false, enableFlashcards: false }) });

describe('owned video job flow', () => {
  beforeEach(() => vi.resetAllMocks());
  it('keeps the deferred video flow disabled without database or model access', async () => {
    const response = await onRequestPost({ request: request(), env: {}, data: { user: { sub: 'actor' } }, waitUntil: vi.fn() } as never);
    expect(response.status).toBe(503);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(transcribeVideo).not.toHaveBeenCalled();
    expect(getAiWorker).not.toHaveBeenCalled();
  });
  it.each(['processing', 'completed', 'failed'])('does not restart an existing %s job', async processing_status => {
    const rpc = vi.fn(async (_name: string, _args: unknown) => ({ data: { created: false, id: JOB, summary: { id: JOB, processing_status } }, error: null }));
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) } as never);
    const waitUntil = vi.fn();
    const response = await onRequestPost({ request: request(), env: { VIDEO_JOBS_ENABLED: 'true',}, data: { user: { sub: 'verified-actor' } }, waitUntil } as never);
    expect(response.status).toBe(processing_status === 'completed' ? 200 : processing_status === 'failed' ? 409 : 202);
    expect(rpc.mock.calls[0]?.[1]).toMatchObject({ p_actor_id: 'verified-actor' });
    expect(waitUntil).not.toHaveBeenCalled();
    expect(transcribeVideo).not.toHaveBeenCalled();
    expect(getAiWorker).not.toHaveBeenCalled();
  });
  it('freezes canonical segments before orchestrator generation and saves only its completed result', async () => {
    const writes: any[] = [];
    let frozen = false;
    const rpc = vi.fn(async (name: string, args: any) => name === 'claim_ai_video_job'
      ? { data: { created: true, id: JOB, summary: { id: JOB, processing_status: 'processing' } }, error: null }
      : (frozen = true, { data: { input: args.p_source_input, hash: args.p_source_hash }, error: null }));
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ rpc, from: () => ({ update: (data: any) => ({ eq: async () => { writes.push(data); return { error: null }; } }) }) } as never);
    vi.mocked(transcribeVideo).mockResolvedValue({ transcript: 'Educational source', segments: [{ start: 0, end: 1, text: 'Educational source', speaker: 'one' }], duration: 1, sentimentData: {}, speakers: [] } as never);
    vi.mocked(getAiWorker).mockReturnValue({ orchestrator: async (value: any) => {
      expect(frozen).toBe(true);
      expect(value.operationId).toBe(JOB);
      expect(value.input.task.input.segments).toEqual([{ start: 0, text: 'Educational source' }]);
      return new Response([
        { type: 'result', result: { kind: 'video-summary', data: { summary: 'Confirmed summary' } } },
        { type: 'completed', executionId: 'execution', outcome: 'answered' },
      ].map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
    } } as never);
    const tasks: Promise<unknown>[] = [];
    const response = await onRequestPost({ request: request(), env: { VIDEO_JOBS_ENABLED: 'true', AI_ASSERT_SECRET: 'video-test-secret-at-least-32-characters' }, data: { user: { sub: 'verified-actor' } }, waitUntil: (task: Promise<unknown>) => { tasks.push(task); } } as never);
    expect(response.status).toBe(202);
    await Promise.all(tasks);
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({ transcript: 'Educational source' });
    expect(writes[1]).toMatchObject({ processing_status: 'completed', summary: 'Confirmed summary' });
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it('does not transcribe when durable claim cannot be confirmed', async () => {
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ rpc: async () => ({ data: null, error: { code: 'outage' } }) } as never);
    const response = await onRequestPost({ request: request(), env: { VIDEO_JOBS_ENABLED: 'true',}, data: { user: { sub: 'verified-actor' } }, waitUntil: vi.fn() } as never);
    expect(response.status).toBe(503);
    expect(transcribeVideo).not.toHaveBeenCalled();
  });
  it('reapplies confirmed output from a failed save using recovery-only orchestration without ASR', async () => {
    const source = { transcript: 'Saved source', segments: [], enableQuiz: false, enableFlashcards: false };
    const frozen = { ...source, jobId: JOB, prompts: buildVideoPrompts(source) };
    const updates: any[] = [];
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      rpc: async () => ({ data: { created: false, id: JOB, summary: { id: JOB, processing_status: 'failed' } }, error: null }),
      from: (table: string) => table === 'ai_video_jobs'
        ? { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { source_input: frozen }, error: null }) }) }) }) }
        : { update: (data: any) => { updates.push(data); return { eq: () => ({ select: () => ({ single: async () => ({ data: { id: JOB, ...data }, error: null }) }) }) }; } },
    } as never);
    vi.mocked(getAiWorker).mockReturnValue({ orchestrator: async (value: any) => {
      expect(value.replayOnly).toBe(true);
      expect(value.operationId).toBe(JOB);
      return new Response([
        { type: 'result', result: { kind: 'video-summary', data: { summary: 'Recovered result' } } },
        { type: 'completed', executionId: 'e', outcome: 'answered' },
      ].map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
    } } as never);
    const waitUntil = vi.fn();
    const response = await onRequestPost({ request: request(), env: { VIDEO_JOBS_ENABLED: 'true', AI_ASSERT_SECRET: 'video-test-secret-at-least-32-characters' }, data: { user: { sub: 'verified-actor' } }, waitUntil } as never);
    expect(response.status).toBe(200);
    expect(updates[0]).toMatchObject({ summary: 'Recovered result', processing_status: 'completed', error_message: null });
    expect(transcribeVideo).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });
  it('does not overwrite an applied completion after its database acknowledgement is lost', async () => {
    const filters: Array<[string, unknown]> = [];
    let writes = 0;
    const chain = { eq(key: string, value: unknown) { filters.push([key, value]); return chain; },
      then(resolve: any) { writes++; return Promise.resolve({ error: writes === 2 ? { message: 'lost acknowledgement' } : null }).then(resolve); } };
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      rpc: async (name: string, args: any) => name === 'claim_ai_video_job'
        ? { data: { created: true, id: JOB, summary: { id: JOB, processing_status: 'processing' } }, error: null }
        : { data: { input: args.p_source_input, hash: args.p_source_hash }, error: null },
      from: () => ({ update: () => chain }),
    } as never);
    vi.mocked(transcribeVideo).mockResolvedValue({ transcript: 'Source', segments: [], duration: 1, speakers: [] } as never);
    vi.mocked(getAiWorker).mockReturnValue({ orchestrator: async () => new Response([
      { type: 'result', result: { kind: 'video-summary', data: { summary: 'Saved' } } },
      { type: 'completed', executionId: 'e', outcome: 'answered' },
    ].map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } }) } as never);
    const tasks: Promise<unknown>[] = [];
    await onRequestPost({ request: request(), env: { VIDEO_JOBS_ENABLED: 'true', AI_ASSERT_SECRET: 'video-test-secret-at-least-32-characters' },
      data: { user: { sub: 'verified-actor' } }, waitUntil: (task: Promise<unknown>) => tasks.push(task) } as never);
    await Promise.all(tasks);
    expect(filters).toContainEqual(['processing_status', 'processing']);
    expect(writes).toBe(3);
  });
});
