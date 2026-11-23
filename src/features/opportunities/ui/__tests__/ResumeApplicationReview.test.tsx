import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const f = vi.hoisted(() => ({ post: vi.fn(), upload: vi.fn(), submit: vi.fn(), fetch: vi.fn(), createUrl: vi.fn(), revokeUrl: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
vi.mock('@/shared/api/storageApiService', () => ({ uploadFile: f.upload }));
vi.mock('../OpportunityDialog', () => ({ OpportunityDialog: ({ open, title, children, footer }: { open: boolean; title: string; children: ReactNode; footer: ReactNode }) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { useResumeApplicationReview } from '../ResumeApplicationReview';
function Harness({ learnerId = 'learner' }: { learnerId?: string } = {}) {
  const { requestReview, resumeReview } = useResumeApplicationReview(learnerId);
  return <><button onClick={() => { void requestReview({ title: 'Engineer' }, f.submit); }}>Apply</button>{resumeReview}</>;
}
const resume = { key: 'uploads/owner/resume.pdf', url: 'https://app.test/resume', filename: 'resume.pdf', size: 100 };
beforeEach(() => { vi.clearAllMocks(); f.fetch.mockResolvedValue({ ok: true, blob: async () => new Blob(['pdf'], { type: 'application/pdf' }) }); f.createUrl.mockReturnValue('blob:qa-preview'); vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: f.createUrl, revokeObjectURL: f.revokeUrl })); f.post.mockResolvedValue({ data: { resume: null } }); f.submit.mockResolvedValue(true); });
afterEach(cleanup);
it('marks resume mandatory and blocks submission when none is attached', async () => {
  render(<Harness/>);
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByRole('dialog');
  await waitFor(() => expect(f.post).toHaveBeenCalled());
  expect((screen.getByRole('button', { name: 'Submit Application' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText(/Resume.*Required/).getAttribute('aria-required')).toBe('true');
  expect(f.submit).not.toHaveBeenCalled();
});
it('auto-attaches an existing resume and submits only after explicit confirmation', async () => {
  f.post.mockResolvedValue({ data: { resume } });
  render(<Harness/>);
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText('Preview resume');
  expect(f.submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
  await waitFor(() => expect(f.submit).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
it('rejects unsupported replacements without uploading or retaining a submit-enabled selection', async () => {
  f.post.mockResolvedValue({ data: { resume } });
  render(<Harness/>);
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText('Preview resume');
  fireEvent.change(screen.getByLabelText(/Resume.*Required/), { target: { files: [new File(['image'], 'resume.jpg', { type: 'image/jpeg' })] } });
  expect(screen.getByRole('alert').textContent).toContain('PDF or DOCX');
  expect((screen.getByRole('button', { name: 'Submit Application' }) as HTMLButtonElement).disabled).toBe(true);
  expect(f.upload).not.toHaveBeenCalled();
});
it('uploads, verifies and previews a replacement', async () => {
  f.post.mockResolvedValueOnce({ data: { resume: null } }).mockResolvedValueOnce({ data: { resume } });
  f.upload.mockResolvedValue({ url: 'https://storage.test/uploads/owner/resume.pdf' });
  render(<Harness/>);
  fireEvent.click(screen.getByText('Apply'));
  await waitFor(() => expect((screen.getByLabelText(/Resume.*Required/) as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText(/Resume.*Required/), { target: { files: [new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' })] } });
  await screen.findByText('Preview resume');
  expect(f.upload).toHaveBeenCalledWith(expect.any(File), { context: 'resume', filename: 'resume.pdf' });
  expect(f.post).toHaveBeenLastCalledWith('/opportunities', expect.objectContaining({ action: 'set-application-resume', learner_id: 'learner' }));
});
it('surfaces a failed profile read and keeps submission blocked', async () => {
  f.post.mockRejectedValue(new Error('Profile unavailable'));
  render(<Harness/>);
  fireEvent.click(screen.getByText('Apply'));
  expect((await screen.findByRole('alert')).textContent).toContain('Profile unavailable');
  expect((screen.getByRole('button', { name: 'Submit Application' }) as HTMLButtonElement).disabled).toBe(true);
});

it('removes the previous learner resume and review when account identity changes', async () => {
  f.post.mockResolvedValue({ data: { resume } });
  const { rerender } = render(<Harness learnerId="first"/>);
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText('Preview resume');
  rerender(<Harness learnerId="second"/>);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(f.submit).not.toHaveBeenCalled();
});

it('loads private preview bytes through the authenticated client and releases them on identity change', async () => {
  f.post.mockResolvedValue({ data: { resume } });
  const { rerender } = render(<Harness learnerId="first"/>);
  fireEvent.click(screen.getByText('Apply'));
  const preview = await screen.findByRole('link', { name: 'Preview resume' });
  expect(preview).toHaveAttribute('href', 'blob:qa-preview');
  expect(f.fetch).toHaveBeenCalledWith(resume.url, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  rerender(<Harness learnerId="second"/>);
  await waitFor(() => expect(f.revokeUrl).toHaveBeenCalledWith('blob:qa-preview'));
});
it('shows private preview errors without rendering an unauthenticated link', async () => {
  f.post.mockResolvedValue({ data: { resume } }); f.fetch.mockResolvedValue({ ok: false, status: 401 });
  render(<Harness/>); fireEvent.click(screen.getByText('Apply'));
  expect(await screen.findByRole('alert')).toHaveTextContent('preview');
  expect(screen.queryByRole('link', { name: 'Preview resume' })).toBeNull();
});

it('retries only the same authenticated preview after the owner-approved retry action', async () => {
  f.post.mockResolvedValue({ data: { resume } });
  f.fetch.mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['pdf']) });
  render(<Harness/>); fireEvent.click(screen.getByText('Apply'));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry preview' }));
  expect(await screen.findByRole('link', { name: 'Preview resume' })).toHaveAttribute('href', 'blob:qa-preview');
  expect(f.fetch).toHaveBeenCalledTimes(2);
  expect(f.submit).not.toHaveBeenCalled();
});
