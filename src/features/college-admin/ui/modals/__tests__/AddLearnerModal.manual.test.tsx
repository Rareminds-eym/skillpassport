import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddLearnerModal from '../AddLearnerModal';
const f = vi.hoisted(() => ({ post: vi.fn(), create: vi.fn(), update: vi.fn(), upload: vi.fn(), legacy: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/api/storageApiService', () => ({ uploadFile: f.upload }));
vi.mock('@/entities/user/api/userApiService', () => ({ default: { createLearner: f.create, updatelearnerDocuments: f.update } }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: { getState: () => ({ user: { email: 'admin@example.test' } }) } }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { getAccessToken: f.legacy } }));
beforeEach(() => {
  vi.clearAllMocks();
  f.legacy.mockReturnValue(null);
  f.post.mockResolvedValue({ data: { id: 'college-id', organization_type: 'college' } });
  f.create.mockResolvedValue({ data: { data: { learnerId: 'sso-user-id', authUserId: 'sso-user-id' } } });
  f.upload.mockResolvedValue({ success: true, url: 'https://storage.example.test/document.pdf' });
  f.update.mockResolvedValue({ success: true });
});
afterEach(cleanup);
function submit(files?: File[]) {
  const success = vi.fn();
  const { container, rerender } = render(<AddLearnerModal isOpen onClose={() => {}} onSuccess={success}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Manual Entry' }));
  const values: Record<string, string> = {
    "Enter learner's full name": 'QA Learner', 'learner@example.com': 'learner@example.test',
    'ENR2024001': 'ENR-QA-1', 'ROLL2024001': 'ROLL-QA-1', "Guardian's full name": 'QA Guardian',
    'guardian@example.com': 'guardian@example.test', 'Street address, building, etc.': 'QA Street',
    'City name': 'QA City', 'State/Province': 'QA State', '123456': '600001', 'District name': 'QA District'
  };
  for (const [placeholder, value] of Object.entries(values)) fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  for (const input of container.querySelectorAll('input[type=tel]')) fireEvent.change(input, { target: { value: '9876543210' } });
  fireEvent.change(container.querySelector('input[type=date]')!, { target: { value: '2000-01-01' } });
  const options = ['General', 'Merit', 'Male', 'A+', 'Father'];
  for (const select of container.querySelectorAll('select')) {
    const option = [...select.options].find(option => options.includes(option.value));
    if (option) fireEvent.change(select, { target: { value: option.value } });
  }
  const file = new File(['%PDF-1.4 synthetic'], 'document.pdf', { type: 'application/pdf' });
  fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: files || [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Learner' }));
  return { success, rerender };
}
it('creates a learner through the authenticated service when raw tokens are unavailable', async () => {
  submit();
  await waitFor(() => expect(f.create).toHaveBeenCalledTimes(1));
  expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ collegeId: 'college-id', schoolId: null }));
  expect(f.legacy).not.toHaveBeenCalled();
});
it('associates uploaded documents through the authenticated service without a raw token', async () => {
  const { success } = submit();
  await waitFor(() => expect(f.update).toHaveBeenCalledTimes(1));
  expect(f.update).toHaveBeenCalledWith({ userId: 'sso-user-id' }, [expect.objectContaining({ name: 'document.pdf', url: 'https://storage.example.test/document.pdf' })]);
  expect(success).toHaveBeenCalledTimes(1);
  expect(f.legacy).not.toHaveBeenCalled();
});
it('surfaces authentication rejection and does not upload documents or signal success', async () => {
  f.create.mockRejectedValueOnce(new Error('Your session has expired. Please login again.'));
  const { success } = submit();
  expect(await screen.findByText('Your session has expired. Please login again.')).toBeVisible();
  expect(f.upload).not.toHaveBeenCalled();
  expect(f.update).not.toHaveBeenCalled();
  expect(success).not.toHaveBeenCalled();
});
it('retains the created identity and uploaded files when projection/linking fails, then retries only linking', async () => {
  f.update.mockRejectedValueOnce(new Error('Learner projection is not ready'));
  const { success } = submit();
  expect(await screen.findByText(/Enrollment incomplete: document linking failed/)).toBeVisible();
  expect(success).not.toHaveBeenCalled();
  expect(screen.queryByText(/created successfully with/)).toBeNull();
  expect(screen.getByPlaceholderText("Enter learner's full name")).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry documents' }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.upload).toHaveBeenCalledTimes(1);
  expect(f.update).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('button', { name: 'Enrollment complete' })).toBeDisabled();
});
it('exposes upload failure and retries that file without provisioning another account', async () => {
  f.upload.mockResolvedValueOnce({ success: false, error: 'Storage unavailable' });
  const { success } = submit();
  expect(await screen.findByText(/Enrollment incomplete: document upload failed/)).toBeVisible();
  expect(f.update).not.toHaveBeenCalled(); expect(success).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry documents' }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(f.create).toHaveBeenCalledTimes(1); expect(f.upload).toHaveBeenCalledTimes(2);
});
it('blocks retries from a different institution while preserving the created account', async () => {
  f.update.mockRejectedValueOnce(new Error('Projection pending'));
  const { success } = submit();
  await screen.findByText(/Enrollment incomplete: document linking failed/);
  f.post.mockResolvedValueOnce({ data: { id: 'foreign-org', organization_type: 'college' } });
  fireEvent.click(screen.getByRole('button', { name: 'Retry documents' }));
  expect(await screen.findByText(/original administrator and institution/)).toBeVisible();
  expect(f.create).toHaveBeenCalledTimes(1); expect(f.update).toHaveBeenCalledTimes(1);
  expect(success).not.toHaveBeenCalled();
});
it('does not permit another account creation when a successful response omits its identity', async () => {
  f.create.mockResolvedValueOnce({ data: { data: {} } });
  const { success } = submit();
  expect(await screen.findByText(/identity was not confirmed/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Retry documents' })).toBeDisabled();
  expect(f.create).toHaveBeenCalledTimes(1); expect(f.upload).not.toHaveBeenCalled();
  expect(success).not.toHaveBeenCalled();
});

it('retains successful uploads when only one file needs retrying', async () => {
  const first=new File(['one'], 'first.pdf', { type: 'application/pdf' });
  const second=new File(['two'], 'second.pdf', { type: 'application/pdf' });
  f.upload.mockResolvedValueOnce({ success: true, url: 'https://storage.example.test/first.pdf' }).mockResolvedValueOnce({ success: false, error: 'Unavailable' }).mockResolvedValueOnce({ success: true, url: 'https://storage.example.test/second.pdf' });
  const { success }=submit([first,second]);
  await screen.findByText(/Enrollment incomplete: document upload failed/);
  fireEvent.click(screen.getByRole('button', { name: 'Retry documents' }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(f.create).toHaveBeenCalledTimes(1); expect(f.upload).toHaveBeenCalledTimes(3);
  expect(f.upload.mock.calls.map(call => call[0])).toEqual([first,second,second]);
  expect(f.update).toHaveBeenCalledWith({ userId: 'sso-user-id' }, [expect.objectContaining({ name: 'first.pdf' }),expect.objectContaining({ name: 'second.pdf' })]);
});
it('retains an incomplete enrollment when the mounted dialog is closed and reopened', async () => {
  f.update.mockRejectedValueOnce(new Error('Projection pending'));
  const { success, rerender }=submit();
  await screen.findByText(/Enrollment incomplete: document linking failed/);
  rerender(<AddLearnerModal isOpen={false} onClose={() => {}} onSuccess={success}/>);
  rerender(<AddLearnerModal isOpen onClose={() => {}} onSuccess={success}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Retry documents' }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(f.create).toHaveBeenCalledTimes(1); expect(f.upload).toHaveBeenCalledTimes(1);
});
