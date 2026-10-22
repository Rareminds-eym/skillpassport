import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTutorChat } from '../useTutorChat';
import { sendMessage } from '../../api/tutorService';
vi.mock('../../api/tutorService', () => ({ sendMessage: vi.fn(), getLastConversationId: () => null,
  getConversations: async () => [], getSuggestedQuestions: async () => [], getConversation: vi.fn(),
  submitFeedback: vi.fn(), deleteConversation: vi.fn() }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ info() {}, warn() {}, error() {} }) }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: (selector: any) => selector({ user: { id: 'actor' } }) }));
describe('pending tutor turn recovery', () => {
  beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear(); });
  it('retries the original frozen request and turn id after an unknown transport outcome', async () => {
    vi.mocked(sendMessage).mockImplementationOnce(async function* () { throw new Error('Connection interrupted'); });
    const { result, rerender } = renderHook(({ topic }) => useTutorChat({ courseId: 'course', worksheetConfig: { topic } as any }), { initialProps: { topic: 'Cells' } });
    await act(async () => { await result.current.sendMessage('Explain cells'); });
    expect(result.current.hasPendingSend).toBe(true);
    const original = vi.mocked(sendMessage).mock.calls[0]![0];
    rerender({ topic: 'Changed configuration' });
    vi.mocked(sendMessage).mockImplementationOnce(async function* () {
      yield { type: 'content', content: 'Recovered answer' };
      yield { type: 'done', conversationId: 'conversation', messageId: 'answer' };
    });
    await act(async () => { await result.current.retryPendingMessage(); });
    expect(vi.mocked(sendMessage).mock.calls[1]![0]).toEqual(original);
    expect(original.worksheetConfig?.topic).toBe('Cells');
    expect(result.current.messages.filter(message => message.role === 'user')).toHaveLength(1);
    await waitFor(() => expect(result.current.hasPendingSend).toBe(false));
  });
  it('restores a pending turn after remount without automatically repeating inference', async () => {
    vi.mocked(sendMessage).mockImplementationOnce(async function* () { throw new Error('Connection interrupted'); });
    const first = renderHook(() => useTutorChat({ courseId: 'course' }));
    await act(async () => { await first.result.current.sendMessage('Explain cells'); });
    const original = vi.mocked(sendMessage).mock.calls[0]![0];
    first.unmount();
    const restored = renderHook(() => useTutorChat({ courseId: 'course' }));
    await waitFor(() => expect(restored.result.current.hasPendingSend).toBe(true));
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(restored.result.current.messages[0]?.id).toBe(original.turnId);
    vi.mocked(sendMessage).mockImplementationOnce(async function* () {
      yield { type: 'done', conversationId: 'conversation', messageId: 'answer' };
    });
    await act(async () => { await restored.result.current.retryPendingMessage(); });
    expect(vi.mocked(sendMessage).mock.calls[1]![0]).toEqual(original);
    expect(sessionStorage.length).toBe(0);
  });
});
