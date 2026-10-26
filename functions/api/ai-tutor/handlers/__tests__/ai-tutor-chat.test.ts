// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  client: { from: vi.fn(), rpc: vi.fn() },
  increment: vi.fn(),
}));
vi.mock('../../../../lib/auth', () => ({
  getContextUser: () => ({ id: 'educator-id', roles: ['college_educator'] }),
  getServiceClient: () => mocks.client,
}));
vi.mock('../../../shared/ai-config', () => ({
  getAPIKeys: () => ({ openRouter: 'test-key' }),
  AI_MODELS: { GPT_4O_MINI: 'test-model' },
  API_CONFIG: { OPENROUTER: { endpoint: 'https://example.test/chat' } },
}));
vi.mock('../../utils/course-context', () => ({
  buildCourseContext: vi.fn().mockResolvedValue({ courseTitle: 'Time Management' }),
  buildSystemPrompt: () => 'Generate a worksheet',
}));
vi.mock('../../utils/generation-limit', () => ({
  hasReachedLimit: vi.fn().mockResolvedValue(false),
  incrementGenerationCount: mocks.increment,
}));
import { handleAiTutorChat } from '../ai-tutor-chat';

describe('tutor conversation persistence', () => {
  let saveResult: { data: { id: string } | null; error: { message: string } | null };
  beforeEach(() => {
    vi.clearAllMocks();
    saveResult = { data: { id: 'saved-conversation' }, error: null };
    mocks.client.from.mockImplementation((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'insert']) query[method] = vi.fn(() => query);
      query.maybeSingle = vi.fn().mockResolvedValue({
        data: table === 'learners' ? null : { messages: [] }, error: null,
      });
      query.single = vi.fn(() => Promise.resolve(saveResult));
      return query;
    });
    mocks.client.rpc.mockResolvedValue({ error: null });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(
      'data: {"choices":[{"delta":{"content":"Generated worksheet"}}]}\n\ndata: [DONE]\n\n',
      { status: 200 },
    )));
  });

  async function generate(conversationId?: string, difficultyLevels = ['medium'], questionCount = 10) {
    const response = await handleAiTutorChat({
      request: new Request('https://example.test/api/ai-tutor/chat', {
        method: 'POST', body: JSON.stringify({
          courseId: 'course-id', conversationId, message: 'Generate a worksheet',
          worksheetConfig: { templateType: 'multiple_choice', difficulty: 'medium', difficultyLevels, questionCount },
        }),
      }),
      env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' },
    } as Parameters<typeof handleAiTutorChat>[0]);
    return response.text();
  }

  it('completes only after saving a new educator conversation', async () => {
    const stream = await generate();
    expect(stream).toContain('event: done');
    expect(stream).toContain('saved-conversation');
    expect(stream).not.toContain('event: error');
  });

  it('reports an insert failure instead of claiming success', async () => {
    saveResult = { data: null, error: { message: 'Foreign key violation' } };
    const stream = await generate();
    expect(stream).toContain('Generated worksheet');
    expect(stream).toContain('could not be saved');
    expect(stream).not.toContain('event: done');
    expect(mocks.increment).not.toHaveBeenCalled();
  });

  it('reports an append failure instead of claiming success', async () => {
    mocks.client.rpc.mockResolvedValue({ error: { message: 'Database unavailable' } });
    const stream = await generate('existing-conversation');
    expect(stream).toContain('could not be saved');
    expect(stream).not.toContain('event: done');
  });
  it('generates the selected count separately for each checked level', async () => {
    const stream = await generate(undefined, ['low', 'high'], 15);
    expect(stream).toContain('Beginner');
    expect(stream).toContain('Advanced');
    expect(stream).toContain('event: done');
    const requests = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body))).filter(body => body.stream);
    expect(requests).toHaveLength(2);
    expect(requests[0].messages.at(-1).content).toContain('exactly 15 questions at Beginner difficulty only');
    expect(requests[1].messages.at(-1).content).toContain('exactly 15 questions at Advanced difficulty only');
    expect(requests[0].max_tokens).toBeGreaterThan(2000);
  });

  it('rejects no difficulty selection without calling the provider', async () => {
    const stream = await generate(undefined, []);
    expect(stream).toContain('VALIDATION_ERROR');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not report completion when the provider truncates the material', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"Partial material"},"finish_reason":"length"}]}\n\n'));
    const stream = await generate();
    expect(stream).toContain('response limit');
    expect(stream).not.toContain('event: done');
  });

  it('aborts the provider and never starts the next difficulty after client cancellation', async () => {
    let providerSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      providerSignal = init?.signal as AbortSignal;
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"First questions"}}]}\n\n'));
          providerSignal!.addEventListener('abort', () => controller.error(providerSignal!.reason), { once: true });
        },
      }));
    });
    const response = await handleAiTutorChat({
      request: new Request('https://example.test/api/ai-tutor/chat', { method: 'POST', body: JSON.stringify({
        courseId: 'course', message: 'Generate', worksheetConfig: {
          templateType: 'multiple_choice', difficulty: 'low', difficultyLevels: ['low', 'high'], questionCount: 10,
        },
      }) }),
      env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' },
    } as Parameters<typeof handleAiTutorChat>[0]);
    await response.body!.cancel();
    // Flush the rejected provider read and the server's cancellation handler.
    await Promise.resolve();
    await Promise.resolve();
    expect(providerSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
    expect(mocks.client.rpc).not.toHaveBeenCalled();
    expect(mocks.increment).not.toHaveBeenCalled();
  });

});
