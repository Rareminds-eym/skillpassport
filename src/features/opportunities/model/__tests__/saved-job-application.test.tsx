import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ list: vi.fn(), apply: vi.fn(), current: vi.fn(), toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('../../api', () => ({ SavedJobsService: { getSavedJobsWithAppliedStatus: f.list }, AppliedJobsService: { applyToJob: f.apply } }));
vi.mock('../../api/opportunitiesService', () => ({ opportunitiesService: { getOpportunityById: f.current } }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }));
vi.mock('react-hot-toast', () => ({ default: f.toast }));
import { useSavedJobs } from '../useSavedJobs';
import OpportunityPreview from '@/widgets/learner-dashboard/ui/OpportunityPreview';

const job = { id: 'job-1', job_title: 'Engineer', skills_required: ['TypeScript'], created_at: '2026-10-16', is_active: true, has_applied: false, saved_at: '2026-10-16', application_link: 'https://stale.example/apply' };
const previewProps = {
  onClose: vi.fn(), onToggleSave: vi.fn(), navigate: vi.fn(),
  learnerData: { currentBacklogs: 0 }, onShowUpgradePrompt: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  f.list.mockResolvedValue([job]);
  f.current.mockResolvedValue({ ...job, application_link: 'https://current.example/apply' });
  f.apply.mockResolvedValue({ success: true });
  vi.spyOn(window, 'open').mockReturnValue(null);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('uses the current employer destination and acknowledges recording, not employer submission', async () => {
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(true);
  expect(window.open).toHaveBeenCalledWith('https://current.example/apply', '_blank', 'noopener,noreferrer');
  expect(r.result.current.appliedJobs.has(job.id)).toBe(true);
  expect(f.toast.success).toHaveBeenCalledWith('Application recorded. Complete submission on the employer website.');
  // A normal null noopener handle must not turn an acknowledged record into failure.
  expect(f.toast.error).not.toHaveBeenCalled();
});
it('does not mark an unacknowledged external application as applied', async () => {
  f.apply.mockResolvedValue({ success: false, message: 'Unavailable' });
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(false);
  expect(r.result.current.appliedJobs.has(job.id)).toBe(false);
  expect(f.toast.success).not.toHaveBeenCalled();
});
it.each(['javascript:alert(1)', '/relative', 'data:text/html,test'])('rejects the current invalid destination %s before recording or opening', async (url) => {
  f.current.mockResolvedValue({ ...job, application_link: url });
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(false);
  expect(f.apply).not.toHaveBeenCalled();
  expect(window.open).not.toHaveBeenCalled();
  expect(r.result.current.appliedJobs.has(job.id)).toBe(false);
});
it('returns an acknowledged result for internal applications without opening a tab', async () => {
  f.current.mockResolvedValue({ ...job, application_link: null });
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(true);
  expect(window.open).not.toHaveBeenCalled();
  expect(f.toast.success).toHaveBeenCalledWith('Application submitted successfully!');
});
it('never reports success after a failed authoritative job read', async () => {
  f.current.mockRejectedValue(new Error('network'));
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(false);
  expect(f.apply).not.toHaveBeenCalled();
  expect(f.toast.success).not.toHaveBeenCalled();
});
it('updates the selected Details snapshot and saved row before awaiting the record acknowledgement', async () => {
  let resolve!: (value: { success: boolean }) => void;
  f.apply.mockImplementation(() => new Promise(done => { resolve = done; }));
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  act(() => r.result.current.setSelectedOpportunity(job));
  let pending!: Promise<boolean>;
  await act(async () => { pending = r.result.current.handleApply(job); });
  expect(r.result.current.selectedOpportunity?.application_link).toBe('https://current.example/apply');
  expect(r.result.current.savedJobs[0].application_link).toBe('https://current.example/apply');
  expect(r.result.current.savedJobs[0].saved_at).toBe(job.saved_at);
  await act(async () => { resolve({ success: true }); await pending; });
});
it('renders the current Details retry destination when the employer URL changes during Apply', async () => {
  function SavedPreview() {
    const state = useSavedJobs({ learnerId: 'learner-1' });
    const opportunity = state.selectedOpportunity || state.savedJobs[0];
    return <OpportunityPreview {...previewProps} opportunity={opportunity} onApply={state.handleApply} isApplied={state.appliedJobs.has(job.id)} />;
  }
  await act(async () => { render(<SavedPreview />); });
  fireEvent.click(screen.getByRole('button', { name: /View More Details/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Record & Open Employer Site' })); });
  // The accessible confirmation keeps background actions inert until dismissed.
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  vi.mocked(window.open).mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Open employer application page' }));
  expect(window.open).toHaveBeenCalledWith('https://current.example/apply', '_blank', 'noopener,noreferrer');
  expect(screen.getByRole('button', { name: 'Application Recorded' })).toBeDisabled();
});
it('preserves an acknowledged recording when browser navigation throws, with explicit retry guidance', async () => {
  vi.mocked(window.open).mockImplementation(() => { throw new Error('browser restriction'); });
  const r = renderHook(() => useSavedJobs({ learnerId: 'learner-1' }));
  await act(async () => {});
  let result: unknown;
  await act(async () => { result = await r.result.current.handleApply(job); });
  expect(result).toBe(true);
  expect(r.result.current.appliedJobs.has(job.id)).toBe(true);
  expect(f.toast.error).toHaveBeenCalledWith('Application recorded, but the employer page could not be opened. Use the application link in Details to retry.');
  expect(f.toast.error).not.toHaveBeenCalledWith('Failed to submit application');
});
it('updates success labels when an internal snapshot becomes an external application before Apply', async () => {
  f.list.mockResolvedValue([{ ...job, application_link: null }]);
  function SavedPreview() {
    const state = useSavedJobs({ learnerId: 'learner-1' });
    return <OpportunityPreview {...previewProps} opportunity={state.savedJobs[0]} onApply={state.handleApply} isApplied={state.appliedJobs.has(job.id)} />;
  }
  await act(async () => { render(<SavedPreview />); });
  fireEvent.click(screen.getByRole('button', { name: /View More Details/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' })); });
  expect(screen.getByText('Application Recorded!')).toBeInTheDocument();
  expect(screen.getByText(/opening a page does not confirm submission/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByRole('button', { name: 'Application Recorded' })).toBeDisabled();
  expect(screen.queryByText('Application Submitted!')).not.toBeInTheDocument();
});
