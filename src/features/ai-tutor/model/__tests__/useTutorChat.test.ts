import { getConversation } from '../../api/tutorService';
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
import { DEFAULT_WORKSHEET_CONFIG } from '../../types/worksheet';
import { DEFAULT_LESSON_PLAN_CONFIG } from '../../types/lesson-plan';
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
afterEach(cleanup);

describe('material completion state', () => {
  it('does not restore another user or course conversation', () => {
    sessionStorage.setItem('ai-tutor-active:alice:other-course', 'private-conversation');
    const { result } = renderHook(() => useTutorChat({ courseId: 'course', userId: 'bob' }));
    expect(getConversation).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });
  it('does not overwrite a new chat when an old restore finishes later', async () => {
    sessionStorage.setItem('ai-tutor-active:educator:course', 'saved');
    let resolve!: (value: Awaited<ReturnType<typeof getConversation>>) => void;
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useTutorChat({ courseId: 'course', userId: 'educator' }));
    act(() => result.current.startNewConversation());
    await act(async () => { resolve({ id: 'saved', courseId: 'course', messages: [{ id: 'old', content: 'Old questions' }] } as Awaited<ReturnType<typeof getConversation>>); });
    expect(result.current.messages).toEqual([]);
    expect(result.current.conversationId).toBeNull();
  });
  it('restores the active course conversation after refresh and clears it for new chat', async () => {
    const saved = { id: 'saved', courseId: 'course', messages: [{ id: 'questions', role: 'assistant', content: 'Questions', worksheetAvailable: true, timestamp: new Date() }] } as Awaited<ReturnType<typeof getConversation>>;
    vi.mocked(getConversation).mockResolvedValue(saved);
    const first = renderHook(() => useTutorChat({ courseId: 'course', userId: 'educator' }));
    await act(async () => { await first.result.current.loadConversation('saved'); });
    first.unmount();
    const restored = renderHook(() => useTutorChat({ courseId: 'course', userId: 'educator' }));
    await waitFor(() => expect(restored.result.current.messages.at(-1)?.worksheetAvailable).toBe(true));
    expect(restored.result.current.conversationId).toBe('saved');
    act(() => restored.result.current.startNewConversation());
    expect(sessionStorage.getItem('ai-tutor-active:educator:course')).toBeNull();
  });

  it('restores the saved conversation persona, sends it on each turn and resets for new chat', async () => {
    vi.mocked(getConversation).mockResolvedValue({ id: 'saved', messages: [{ id: 'reply', role: 'assistant', content: 'Feedback', facilitator: 'mentor-and-guide', facilitatorMode: 'mentor-and-guide', timestamp: new Date() }] } as Awaited<ReturnType<typeof getConversation>>);
    mocks.send.mockImplementation(async function* () { yield { type: 'done', conversationId: 'saved', facilitator: 'mentor-and-guide', facilitatorMode: 'mentor-and-guide' }; });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course', isEducator: true }));
    await act(async () => { await result.current.loadConversation('saved'); });
    expect(result.current.facilitatorMode).toBe('mentor-and-guide');
    await act(async () => { await result.current.sendMessage('What next?'); });
    expect(mocks.send.mock.calls[0][0].facilitatorMode).toBe('mentor-and-guide');
    expect(result.current.activeFacilitator).toBe('mentor-and-guide');
    act(() => result.current.startNewConversation());
    expect(result.current.facilitatorMode).toBe('auto');
  });
  it('does not send educator persona controls for a learner', async () => {
    mocks.send.mockImplementation(async function* () { yield { type: 'done' }; });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course' }));
    await act(async () => { await result.current.sendMessage('Explain this'); });
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty('facilitatorMode');
  });

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
  it('keeps normal questions free of generation settings even after generating a worksheet', async () => {
    mocks.send.mockImplementation(async function* () { yield { type: 'done' }; });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course', worksheetConfig: DEFAULT_WORKSHEET_CONFIG }));
    await act(async () => { await result.current.sendMessage('Generate worksheet', { generate: true }); });
    expect(mocks.send.mock.calls[0][0].worksheetConfig).toEqual(DEFAULT_WORKSHEET_CONFIG);
    await act(async () => { await result.current.sendMessage('Is that assigned to all learners?'); });
    expect(mocks.send.mock.calls[1][0]).not.toHaveProperty('worksheetConfig');
    expect(mocks.send.mock.calls[1][0]).not.toHaveProperty('lessonPlanConfig');
  });
  it('only attaches lesson-plan settings for an explicit generate action', async () => {
    mocks.send.mockImplementation(async function* () { yield { type: 'done' }; });
    const { result } = renderHook(() => useTutorChat({ courseId: 'course', lessonPlanConfig: DEFAULT_LESSON_PLAN_CONFIG }));
    await act(async () => { await result.current.sendMessage('Explain the lesson objective'); });
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty('lessonPlanConfig');
    await act(async () => { await result.current.sendMessage('Generate lesson plan', { generate: true }); });
    expect(mocks.send.mock.calls[1][0].lessonPlanConfig).toEqual(DEFAULT_LESSON_PLAN_CONFIG);
  });

});
