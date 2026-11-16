import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ post: vi.fn(), fetch: vi.fn(), submit: vi.fn(), view: 'grid' }));
const job = { id: 'qa-job', title: 'QA saved role', company_name: 'QA company', is_active: true, has_applied: false, saved_at: '2026-11-14', skills_required: [] };
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'qa-user', email: 'qa@example.invalid' }), useAuthStore: (select: (state: { user: { email: string } }) => unknown) => select({ user: { email: 'qa@example.invalid' } }) }));
vi.mock('@/entities/learner', () => ({ useLearnerDataByEmail: () => ({ learnerData: { id: 'qa-learner' } }) }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: (...args: unknown[]) => f.post(...args) }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: (...args: unknown[]) => f.fetch(...args) } }));
vi.mock('@/shared/api/storageApiService', () => ({ uploadFile: vi.fn() }));
vi.mock('@/features/opportunities', async () => {
 const { useState } = await import('react');
 return { SavedJobsService: {}, useSavedJobs: () => {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  return { savedJobs: [job], filteredAndSortedJobs: [job], loading: false, error: null, searchTerm: '', sortBy: 'newest', viewMode: f.view, selectedOpportunity, appliedJobs: new Set(), isApplying: false, showActiveOnly: true, setSelectedOpportunity, setSearchTerm: vi.fn(), setSortBy: vi.fn(), setViewMode: vi.fn(), setShowActiveOnly: vi.fn(), handleUnsave: vi.fn(), handleApply: f.submit };
 }};
});
vi.mock('@/widgets/learner-dashboard', async () => ({
 OpportunityCard: (await import('@/widgets/learner-dashboard/ui/OpportunityCard')).default,
 OpportunityListItem: (await import('@/widgets/learner-dashboard/ui/OpportunityListItem')).default,
 OpportunityPreview: (await import('@/widgets/learner-dashboard/ui/OpportunityPreview')).default,
}));
import SavedJobs from '../SavedJobs';
beforeEach(() => {
 vi.clearAllMocks();f.view = 'grid';
 f.post.mockResolvedValue({ data: { resume: null } });
 f.fetch.mockResolvedValue({ ok: true, blob: async () => new Blob(['qa'], { type: 'application/pdf' }) });
 vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:qa-resume'), revokeObjectURL: vi.fn() }));
 f.submit.mockResolvedValue(true);
});
afterEach(cleanup);
function mount() { return render(<MemoryRouter><SavedJobs /></MemoryRouter>); }
it.each(['grid', 'list'])('%s Details opens the real job dialog instead of selecting a hidden preview', async view => {
 f.view = view;mount();
 fireEvent.click(screen.getByRole('button', { name: 'Details for QA saved role' }));
 expect(await screen.findByRole('dialog', { name: 'QA saved role' })).toBeInTheDocument();
 expect(f.submit).not.toHaveBeenCalled();
});
it.each(['grid', 'list'])('%s Apply requires the existing resume review before the application callback', async view => {
 f.view = view;const page = mount();
 const card = page.container.querySelector('article');expect(card).not.toBeNull();
 fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Apply Now' }));
 const review = await screen.findByRole('dialog', { name: 'Review your application' });
 await waitFor(() => expect(within(review).getByRole('button', { name: 'Submit Application' })).toBeDisabled());
 expect(f.post).toHaveBeenCalledWith('/opportunities', { action: 'get-application-resume', learner_id: 'qa-learner' });
 expect(f.submit).not.toHaveBeenCalled();
});
