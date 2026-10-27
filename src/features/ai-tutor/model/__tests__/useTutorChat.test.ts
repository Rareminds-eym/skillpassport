import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../api/tutorService', () => ({
  sendMessage: mocks.send,
  getConversations: vi.fn().mockResolvedValue([]),
  getSuggestedQuestions: vi.fn().mockResolvedValue([]),
  getLastConversationId: () => null,
  getConversation: vi.fn(), submitFeedback: vi.fn(), deleteConversation: vi.fn(),
}));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));
import { useTutorChat } from '../useTutorChat';
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('material completion state', () => {
  it('aborts the request and preserves received text as stopped', async () => {
    mocks.send.mockImplementation(async function* (_request, signal: AbortSignal) {
      yield { type: 'content', content: 'First questions' };
      await new Promise((_resolve, reject) => {
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course' }));
    let pending: Promise<void>;
    act(() => { pending = result.current.sendMessage('Generate'); });
    await waitFor(() => expect(result.current.messages.at(-1)?.content).toBe('First questions'));
    await act(async () => { result.current.stopGeneration(); await pending!; });
    expect(mocks.send.mock.calls[0][1].aborted).toBe(true);
    expect(result.current.messages.at(-1)).toMatchObject({ content: 'First questions', status: 'stopped' });
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });
  it('marks a response complete only after a successful completion event', async () => {
    mocks.send.mockImplementation(async function* () {
      yield { type: 'content', content: 'Generated questions' };
      yield { type: 'done', conversationId: 'saved-conversation', messageId: 'saved-message', worksheetAvailable: true };
    });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course' }));
    await act(async () => { await result.current.sendMessage('Generate'); });
    expect(result.current.messages.at(-1)).toMatchObject({ id: 'saved-message', content: 'Generated questions', status: 'complete', worksheetAvailable: true });
  });

  it('keeps partial text marked as failed when generation errors', async () => {
    mocks.send.mockImplementation(async function* () {
      yield { type: 'content', content: 'Partial questions' };
      throw new Error('Generation interrupted');
    });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course' }));
    await act(async () => { await result.current.sendMessage('Generate'); });
    expect(result.current.messages.at(-1)).toMatchObject({ content: 'Partial questions', status: 'failed' });
    expect(result.current.error).toBe('Generation interrupted');
  });
});
