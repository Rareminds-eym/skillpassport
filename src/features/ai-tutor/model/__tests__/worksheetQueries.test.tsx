import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock('../../api/worksheetService', () => ({ worksheetAction: mocks.action }));
import { useWorksheetContext, useWorksheetSource, usePublishWorksheet, useAssignedWorksheets, useOpenWorksheet, worksheetKeys } from '../worksheetQueries';

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
const publication = { conversationId: 'conversation', messageId: 'message', groupId: 'stable-retry-id', title: 'Worksheet', instructions: '', dueAt: null, reviewed: true as const };

describe('worksheet server state', () => {
  it('deduplicates teaching context across consumers', async () => {
    mocks.action.mockResolvedValue({ gradeLevel: 'College', learnerCount: 8 });
    const { wrapper } = setup();
    const { result } = renderHook(() => [useWorksheetContext('educator', true), useWorksheetContext('educator', true)], { wrapper });
    await waitFor(() => expect(result.current.every(query => query.isSuccess)).toBe(true));
    expect(mocks.action).toHaveBeenCalledTimes(1);
  });
  it('does not expose a previous account cache when the user changes', async () => {
    mocks.action.mockResolvedValueOnce({ gradeLevel: 'Private educator data' }).mockImplementation(() => new Promise(() => {}));
    const { wrapper } = setup();
    const { result, rerender } = renderHook(({ userId }) => useWorksheetContext(userId, true), { wrapper, initialProps: { userId: 'alice' } });
    await waitFor(() => expect(result.current.data?.gradeLevel).toBe('Private educator data'));
    rerender({ userId: 'bob' });
    expect(result.current.data).toBeUndefined();
  });
  it('waits for review before fetching private source material', () => {
    const { wrapper } = setup();
    renderHook(() => useWorksheetSource('educator', 'conversation', 'message', false), { wrapper });
    expect(mocks.action).not.toHaveBeenCalled();
  });
  it('invalidates only the publishing account after confirmed publication', async () => {
    mocks.action.mockResolvedValue({ learnerCount: 8 });
    const { client, wrapper } = setup();
    client.setQueryData(worksheetKeys.context('other-user'), { private: true });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => usePublishWorksheet('educator'), { wrapper });
    await act(async () => { await result.current.mutateAsync(publication); });
    expect(mocks.action).toHaveBeenCalledWith('publish-all', publication);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: worksheetKeys.user('educator') });
    expect(client.getQueryState(worksheetKeys.context('other-user'))?.isInvalidated).toBe(false);
  });
  it('does not retry publication automatically or invalidate after failure', async () => {
    mocks.action.mockRejectedValue(new Error('Publication failed'));
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => usePublishWorksheet('educator'), { wrapper });
    await act(async () => { await expect(result.current.mutateAsync(publication)).rejects.toThrow('Publication failed'); });
    expect(mocks.action).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('scopes list pages by user, course and page', async () => {
    mocks.action.mockResolvedValue([]);
    const { wrapper } = setup();
    const { result, rerender } = renderHook(({ course, page }) => useAssignedWorksheets('learner', course, page), { wrapper, initialProps: { course: 'course-a', page: 0 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ course: 'course-b', page: 1 });
    await waitFor(() => expect(mocks.action).toHaveBeenCalledWith('list', { courseId: 'course-b', page: 1 }));
  });
  it('reauthorizes each open and refreshes activity for that course', async () => {
    mocks.action.mockResolvedValue({ id: 'worksheet' });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useOpenWorksheet('learner', 'course-a'), { wrapper });
    await act(async () => { await result.current.mutateAsync('recipient'); });
    expect(mocks.action).toHaveBeenCalledWith('open', { recipientId: 'recipient', courseId: 'course-a' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai-worksheets', 'learner', 'deliveries', 'course-a'] });
  });
});
