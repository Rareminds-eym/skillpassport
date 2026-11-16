import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddLearnerModal from '../AddLearnerModal';
const f = vi.hoisted(() => ({ post: vi.fn(), parse: vi.fn(), queue: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/api/storageService', () => ({ default: {} }));
vi.mock('@/entities/user/api/userApiService', () => ({ default: {} }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'admin', email: 'admin@example.test', role: 'college_admin' } }) } }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: {} }));
vi.mock('@/features/college-admin/api/learnerAdmissionService', () => ({ learnerAdmissionService: { queueBulkUpload: f.queue } }));
vi.mock('papaparse', async () => {
  const actual = await vi.importActual<{ default: typeof import('papaparse') }>('papaparse');
  return { default: { ...actual.default, parse: f.parse } };
});
const context = { data: { id: 'org', organization_type: 'college' } };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  vi.clearAllMocks();
  f.post.mockResolvedValue(context);
  f.queue.mockResolvedValue({ success: false, error: { message: 'Fixture stopped after queue acknowledgement' } });
  f.parse.mockImplementation((file: File, options: { complete: (result: unknown) => Promise<void> }) => {
    void options.complete({ errors: [], data: [{ name: file.name, email: 'learner@example.test', contactnumber: '9876543210' }] });
  });
});
afterEach(cleanup);
function select(container: HTMLElement, filename: string) {
  const input = container.querySelector('input[accept=".csv"]');
  if (!input) throw new Error('CSV input missing');
  fireEvent.change(input, { target: { files: [new File(['fixture'], filename, { type: 'text/csv' })] } });
}
it('ignores earlier validation that resolves after a newer file preview', async () => {
  const first = deferred<typeof context>();
  f.post.mockReturnValueOnce(first.promise);
  const { container } = render(<AddLearnerModal isOpen onClose={() => {}}/>);
  select(container, 'first.csv');
  select(container, 'second.csv');
  await screen.findByRole('cell', { name: 'second.csv' });
  await act(async () => first.resolve(context));
  expect(screen.queryByRole('cell', { name: 'first.csv' })).toBeNull();
  expect(screen.getByRole('cell', { name: 'second.csv' })).toBeVisible();
});
it('does not queue an earlier preview if the file changes while submission verifies its tenant', async () => {
  const { container } = render(<AddLearnerModal isOpen onClose={() => {}}/>);
  select(container, 'first.csv');
  await screen.findByRole('cell', { name: 'first.csv' });
  const submit = deferred<typeof context>();
  f.post.mockReturnValueOnce(submit.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Import 1 Valid Learner' }));
  select(container, 'second.csv');
  await screen.findByRole('cell', { name: 'second.csv' });
  await act(async () => submit.resolve(context));
  expect(f.queue).not.toHaveBeenCalled();
});
it('discards validation after the modal closes', async () => {
  const pending = deferred<typeof context>();
  f.post.mockReturnValueOnce(pending.promise);
  const { container, rerender } = render(<AddLearnerModal isOpen onClose={() => {}}/>);
  select(container, 'first.csv');
  rerender(<AddLearnerModal isOpen={false} onClose={() => {}}/>);
  await act(async () => pending.resolve(context));
  rerender(<AddLearnerModal isOpen onClose={() => {}}/>);
  fireEvent.click(screen.getByRole('button', { name: /bulk.*csv|csv/i }));
  await waitFor(() => expect(screen.queryByRole('cell', { name: 'first.csv' })).toBeNull());
});

it('queues the selected validated file under StrictMode as a positive control', async () => {
  const { container } = render(<StrictMode><AddLearnerModal isOpen onClose={() => {}}/></StrictMode>);
  select(container, 'current.csv');
  await screen.findByRole('cell', { name: 'current.csv' });
  fireEvent.click(screen.getByRole('button', { name: 'Import 1 Valid Learner' }));
  await waitFor(() => expect(f.queue).toHaveBeenCalledTimes(1));
  expect(f.queue).toHaveBeenCalledWith(expect.stringContaining('current.csv'), 'org');
});

it('queues only the preview-approved rows as actual CSV', async () => {
  f.parse.mockImplementation((_file: File, options: { complete: (result: unknown) => Promise<void> }) => {
    void options.complete({ errors: [], data: [
      { name: 'Approved', email: 'approved@example.test', contactnumber: '9876543210' },
      { name: 'Invalid', email: '', contactnumber: '9876543210' },
    ] });
  });
  const { container } = render(<AddLearnerModal isOpen onClose={() => {}}/>);
  select(container, 'mixed.csv');
  await screen.findByRole('cell', { name: 'Approved' });
  fireEvent.click(screen.getByRole('button', { name: 'Import 1 Valid Learner' }));
  await waitFor(() => expect(f.queue).toHaveBeenCalledTimes(1));
  const csv: unknown = f.queue.mock.calls[0][0];
  if (typeof csv !== 'string') throw new Error('Expected CSV text');
  const actual = await vi.importActual<{ default: typeof import('papaparse') }>('papaparse');
  const parsed = actual.default.parse(csv, { header: true });
  expect(parsed.errors).toEqual([]);
  expect(parsed.data).toEqual([expect.objectContaining({ name: 'Approved', email: 'approved@example.test' })]);
});
