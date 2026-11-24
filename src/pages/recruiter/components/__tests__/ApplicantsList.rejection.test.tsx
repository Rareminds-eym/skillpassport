import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplicantsList from '../../ApplicantsList';
const f = vi.hoisted(() => ({ applicants: vi.fn(), pipeline: vi.fn() }));
vi.mock('@/features/opportunities', () => ({ AppliedJobsService: { getAllApplicants: f.applicants }, getAllPipelineCandidatesByStage: f.pipeline, moveCandidateToStage: vi.fn() }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'owner', orgId: 'org' }) }));
vi.mock('@/entities/recruitment/model/useOrgContext', () => ({ useOrgContext: () => ({ organizationId: 'org' }) }));
vi.mock('@/features/messaging', () => ({ useMessageNotifications: () => {}, MessageModal: () => null }));
vi.mock('@/features/recruiter-copilot', () => ({ recruiterInsights: {} }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ info: () => {}, error: () => {} }) }));
beforeEach(() => {
  f.pipeline.mockResolvedValue({ data: { sourced: [{ id: 'pipeline', learner_id: 'learner', status: 'active' }] } });
});
afterEach(cleanup);
async function mount(status: string) {
  f.applicants.mockResolvedValue([{ id: 'application', learner_id: 'learner', opportunity_id: 'job', application_status: status,
    applied_at: '2026-11-13T12:00:00Z', learner: { id: 'learner', name: 'QA Learner', email: 'learner@example.test' },
    opportunity: { id: 'job', job_title: 'QA Job' } }]);
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ApplicantsList/></QueryClientProvider>);
  const candidate = await screen.findByText('QA Learner');
  return candidate.closest('tr')!;
}
it('shows rejection and hides stage moves for an application with stale active pipeline data', async () => {
  const row = await mount('rejected');
  expect(within(row).getByText('Rejected')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Move QA Learner to stage' })).not.toBeInTheDocument();
  const overview = screen.getByText('Pipeline Overview').parentElement!;
  const sourced = within(overview).getByText('Sourced').parentElement!;
  expect(within(sourced).getByText('0')).toBeVisible();
});
it('retains the active sourced stage and move action for an eligible application', async () => {
  const row = await mount('applied');
  expect(within(row).getByText('Sourced')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Move QA Learner to stage' })).toBeEnabled();
});
