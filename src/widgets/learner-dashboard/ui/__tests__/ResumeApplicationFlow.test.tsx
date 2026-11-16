import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpportunityPreview from '../OpportunityPreview';
import { useResumeApplicationReview } from '@/features/opportunities/ui/ResumeApplicationReview';
const f = vi.hoisted(() => ({ post: vi.fn(), upload: vi.fn(), submit: vi.fn(), fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/api/storageApiService', () => ({ uploadFile: f.upload }));
const request = { jobId: 'job' };
const job = { id: 'job', title: 'Engineer', company_name: 'Example' };
function Harness() {
  const { requestReview, resumeReview } = useResumeApplicationReview('learner');
  return <>{resumeReview}<OpportunityPreview opportunity={job} showSummary={false}
    applicationRequest={request} onToggleSave={undefined} onRetryAccess={undefined} onRetryProfile={undefined}
    navigate={undefined} learnerData={undefined} onShowUpgradePrompt={undefined}
    detailsOpen={undefined} onDetailsOpenChange={undefined} onApply={() => requestReview(job, f.submit)} /></>;
}
beforeEach(() => {
  vi.clearAllMocks();
  f.fetch.mockResolvedValue({ ok: true, blob: async () => new Blob(['pdf'], { type: 'application/pdf' }) });
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:resume-preview'), revokeObjectURL: vi.fn() }));
  f.post.mockResolvedValue({ data: { resume: { key: 'uploads/owner/resume.pdf', url: 'https://app.test/resume', filename: 'resume.pdf', size: 100 } } });
  f.submit.mockResolvedValue(true);
});
afterEach(cleanup);
it('completes the real confirmation and resume dialogs with one final application call', async () => {
  const user = userEvent.setup();
  render(<Harness/>);
  await user.click(await screen.findByRole('button', { name: 'Confirm & Apply' }));
  const review = await screen.findByRole('dialog', { name: 'Review your application' });
  await within(review).findByText('Preview resume');
  expect(f.submit).not.toHaveBeenCalled();
  await user.click(within(review).getByRole('button', { name: 'Submit Application' }));
  await screen.findByRole('dialog', { name: 'Application Submitted!' });
  expect(f.submit).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog', { name: 'Review your application' })).toBeNull();
});
it('cancels the real resume review without recording an application', async () => {
  const user = userEvent.setup();
  render(<Harness/>);
  await user.click(await screen.findByRole('button', { name: 'Confirm & Apply' }));
  const review = await screen.findByRole('dialog', { name: 'Review your application' });
  await within(review).findByText('Preview resume');
  await waitFor(() => expect(within(review).getByRole('button', { name: 'Submit Application' })).toBeEnabled());
  await user.click(within(review).getByRole('button', { name: 'Close dialog' }));
  expect(f.submit).not.toHaveBeenCalled();
  await screen.findByRole('dialog', { name: 'Confirm Application' });
  expect(screen.queryByRole('dialog', { name: 'Application Submitted!' })).toBeNull();
});
