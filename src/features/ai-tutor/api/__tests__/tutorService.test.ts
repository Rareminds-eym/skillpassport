// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: mocks.fetch } }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: vi.fn(), ApiError: class extends Error {} }));
vi.mock('@/shared/api/apiUtils', () => ({ getApiUrl: () => '/api/ai-tutor' }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ warn: vi.fn(), error: vi.fn() }) }));
import { sendMessage } from '../tutorService';

afterEach(() => vi.clearAllMocks());
describe('tutor streaming errors', () => {
  it('forwards cancellation and stops consuming the response', async () => {
    const abort = new AbortController();
    const cancel = vi.fn();
    mocks.fetch.mockResolvedValue(new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('event: token\ndata: {"content":"First questions"}\n\n')); },
      cancel,
    })));
    const stream = sendMessage({ courseId: 'course', message: 'Generate' }, abort.signal);
    expect((await stream.next()).value).toEqual({ type: 'content', content: 'First questions' });
    abort.abort();
    await expect(stream.next()).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.fetch.mock.calls[0][1].signal).toBe(abort.signal);
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('propagates a save failure after generated content has arrived', async () => {
    mocks.fetch.mockResolvedValue(new Response(
      'event: token\ndata: {"content":"Worksheet"}\n\nevent: error\ndata: {"error":"Material could not be saved"}\n\n',
    ));
    const stream = sendMessage({ courseId: 'course', message: 'Generate' });
    expect((await stream.next()).value).toEqual({ type: 'content', content: 'Worksheet' });
    await expect(stream.next()).rejects.toThrow('Material could not be saved');
  });
});
