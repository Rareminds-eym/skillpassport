import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useInstitutions } from '@/entities/institution/model/useInstitutions';
import { apiPost } from '@/shared/api/apiClient';

const auth = vi.hoisted(() => ({ user: { id: 'user-a' } }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => auth.user }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: vi.fn() }));
let client;
beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { id: 'user-a' };
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  apiPost.mockResolvedValue({ data: { schools: [{ id: 'school-a', name: 'School A' }] } });
});
afterEach(() => { cleanup(); client.clear(); });
const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

it('defers the request until enabled and reuses fresh options on remount', async () => {
  const first = renderHook(({ enabled }) => useInstitutions(enabled), { wrapper, initialProps: { enabled: false } });
  expect(apiPost).not.toHaveBeenCalled();
  first.rerender({ enabled: true });
  await waitFor(() => expect(first.result.current.schools).toHaveLength(1));
  expect(apiPost).toHaveBeenCalledTimes(1);
  first.unmount();
  const second = renderHook(() => useInstitutions(), { wrapper });
  expect(second.result.current.schools[0].name).toBe('School A');
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it('does not reuse another user’s cached options', async () => {
  const { result, rerender } = renderHook(() => useInstitutions(), { wrapper });
  await waitFor(() => expect(result.current.schools).toHaveLength(1));
  apiPost.mockResolvedValue({ data: { schools: [{ id: 'school-b', name: 'School B' }] } });
  auth.user = { id: 'user-b' };
  rerender();
  expect(result.current.schools).toHaveLength(0);
  await waitFor(() => expect(result.current.schools[0]?.name).toBe('School B'));
  expect(apiPost).toHaveBeenCalledTimes(2);
});

it('waits for authentication before loading institution options', async () => {
  auth.user = null;
  const { result, rerender } = renderHook(() => useInstitutions(), { wrapper });
  expect(apiPost).not.toHaveBeenCalled();
  auth.user = { id: 'user-a' };
  rerender();
  await waitFor(() => expect(result.current.schools).toHaveLength(1));
  expect(apiPost).toHaveBeenCalledTimes(1);
});
