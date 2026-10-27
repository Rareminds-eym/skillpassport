import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const f = vi.hoisted(() => ({
  learner: { id: 'learner', grade: 'UG', email: 'learner@example.test' },
  visits: [{ id: 'visit', company_name: 'Visit employer', location: 'Delhi', sector: 'Technology' }],
  apps: [{ id: 'app', opportunity_id: 'job', application_status: 'applied', applied_at: '2026-10-01T12:00:00Z', opportunity: { title: 'Developer', company_name: 'Employer', employment_type: 'Full-time', salary_range_min: 0, salary_range_max: 10000 } }],
  independent: false,
  get: vi.fn(),
  register: vi.fn(),
  registeredIds: [] as string[],
  jobs: [] as {id: string}[],
  visitTotal: 30,
  api: vi.fn(),
}));
vi.mock('@/shared/api', () => ({ apiGet: (path: string) => { f.api(path); return path.includes('/application-details?') ? f.get(path) : Promise.resolve({ data: { appliedIds: f.registeredIds, savedIds: [], sectors: ['Technology'], locations: ['Delhi'] } }); } }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'user', email: 'learner@example.test' }), useAuthStore: { getState: () => ({ user: { email: 'learner@example.test' } }) } }));
vi.mock('@/entities/learner', () => ({ useLearnerDataByEmail: () => ({ learnerData: f.learner }) }));
vi.mock('@/entities/learner/lib/learnerType', () => ({ isSchoolLearner: () => false, isCollegeLearner: () => !f.independent, isLearner: () => f.independent }));
vi.mock('@/features/opportunities/lib/institutionDetails', () => ({ getMissingInstitutionFields: () => [] }));
vi.mock('@/features/learner-profile', () => ({ useProfileCompletion: () => ({ canApplyToJobs: true, needsProfileCompletion: false }) }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: null }) }));
vi.mock('@/features/subscription/lib/featureGating', () => ({ checkFeatureAccess: () => ({ hasAccess: true }) }));
vi.mock('@/features/messaging', () => ({ useMessageNotifications: () => {} }));
vi.mock('@/shared/api/messageService', () => ({ default: {} }));
vi.mock('@/features/learner-profile/api', () => ({ learnerPipelineService: { subscribeToPipelineUpdates: () => ({}), unsubscribeFromPipelineUpdates: () => {} } }));
vi.mock('@/features/opportunities/api/offerManagementService', () => ({ default: {} }));
vi.mock('@/features/college-admin/api/factoryVisitsService', () => ({ factoryVisitsService: { registerForVisit: f.register } }));
vi.mock('@/features/opportunities/api/opportunitiesService', () => ({ opportunitiesService: { getOpportunityById: (...args: unknown[]) => f.get(...args) } }));
vi.mock('@/features/opportunities', async () => ({
  ApplicationsPanel: (await import('@/features/opportunities/ui/ApplicationsPanel')).ApplicationsPanel,
  applicationUpdated: (await import('@/features/opportunities/lib/applicationPresentation')).applicationUpdated,
  useOpportunities: () => ({ opportunities: f.jobs, loading: false, hasLoadedPage: true, totalCount: 0, totalPages: 1 }),
  useOpportunityPage: (_path: string, collection: string) => ({ rows: collection === 'visits' ? f.visits : f.apps, total: collection === 'visits' ? f.visitTotal : 30, loading: false, error: '' }),
  LearningMatches: () => null, AppliedJobsService: {}, SavedJobsService: {},
}));
vi.mock('@/widgets/learner-dashboard', async () => ({
  IndustrialVisitRegistration: (await import('@/widgets/learner-dashboard/ui/IndustrialVisitPreview')).IndustrialVisitRegistration,
  AdvancedFilters: () => null, OpportunityCard: () => null, OpportunityListItem: () => null,
  OpportunityPreview: () => null, RecommendedJobs: () => null,
  IndustrialVisitPreview: ({ visit, onRegister, isRegistered, isRegistering, inDialog }: { inDialog?: boolean; visit: { id: string }; onRegister: (visit: { id: string }) => void; isRegistered: boolean; isRegistering: boolean }) => inDialog ? <p>Visit preview</p> : <button disabled={isRegistered || isRegistering} onClick={() => onRegister(visit)}>{isRegistered ? 'Registered' : 'Register for visit'}</button>,
}));
vi.mock('@/shared/ui', () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  PaginationContent: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  PaginationItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  PaginationEllipsis: () => <span>…</span>,
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Opportunities from '../Opportunities';
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function mount(query: string) {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/learner/opportunities' + query]}><Opportunities /><Location /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  window.matchMedia = vi.fn(query => ({media: query, matches: false, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  f.independent = false;
  f.registeredIds = [];
  f.jobs = [];
  f.visitTotal = 30;
  f.api.mockClear();
  f.register.mockReset();
  f.apps[0].application_status = 'applied';
  Object.assign(f.apps[0], { has_pipeline_status: false, pipeline_stage: null, interviews: [] });
  f.get.mockResolvedValue({ data: { application: { id: 'app', application_status: 'applied', applied_at: '2026-10-01T12:00:00Z', opportunity: { id: 'job', title: 'Developer', description: 'Full opportunity description.', salary_range_min: 0, salary_range_max: 10000 } } } });
  window.scrollTo = vi.fn();
});
afterEach(cleanup);

it.each(['grid', 'list'])('selects the desktop %s card in the side preview without opening a popup', async view => {
  const originalVisits = f.visits;
  f.visits = [...originalVisits, {...originalVisits[0], id: 'second-visit', company_name: 'Another employer'}];
  const media = vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    media: query, matches: true, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  } as any));
  try {
    mount(`?tab=industrial-visits&visitView=${view}`);
    const card = await screen.findByRole('button', {name: 'View visit at Another employer'});
    expect(card).not.toHaveAttribute('aria-haspopup');
    expect(card).toHaveAttribute('aria-controls', 'industrial-visit-preview');
    await userEvent.click(card);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(card).toHaveAttribute('aria-current', 'true');
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  } finally { media.mockRestore(); f.visits = originalVisits; }
});

it('closes the mobile visit popup when resizing to the desktop preview', async () => {
  const query = {matches: false, media: '(min-width: 1024px)', addEventListener: vi.fn(), removeEventListener: vi.fn()};
  const media = vi.spyOn(window, 'matchMedia').mockReturnValue(query as any);
  try {
    mount('?tab=industrial-visits');
    const card = await screen.findByRole('button', {name: 'View visit at Visit employer'});
    expect(card).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(card);
    expect(screen.getByRole('dialog')).toBeVisible();
    await act(async () => {
      query.matches = true;
      query.addEventListener.mock.calls.find(([event]) => event === 'change')![1]();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(card).not.toHaveAttribute('aria-haspopup');
    expect(card).toHaveAttribute('aria-current', 'true');
  } finally { media.mockRestore(); }
});

it('only batches badge lookups for visible visits, excluding retained jobs from hidden tabs', async () => {
  f.jobs = [{id: 'hidden-job'}];
  mount('?tab=industrial-visits');
  await waitFor(() => expect(f.api.mock.calls.some(([path]) => path.includes('/membership?'))).toBe(true));
  const requests = f.api.mock.calls.map(([path]) => path).filter(path => path.includes('/membership?'));
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0], 'http://app.test').searchParams.get('ids')).toBe('visit');
});

it('renders both pagination gaps without duplicate React keys', async () => {
  f.visitTotal = 200;
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mount('?tab=industrial-visits&visitPage=10');
    expect(await screen.findByRole('button', {name: 'Page 10', exact: true})).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/same key|unique.*key/i);
  } finally { errors.mockRestore(); }
});

it('resets backend pagination when changing visit filters while keeping the tab', async () => {
  mount('?tab=industrial-visits&visitPage=3&visitLocation=Delhi');
  await userEvent.selectOptions(await screen.findByRole('combobox', {name: 'Visit industry'}), 'Technology');
  expect(screen.getByTestId('location')).toHaveTextContent('visitSector=Technology');
  expect(screen.getByTestId('location')).toHaveTextContent('visitLocation=Delhi');
  expect(screen.getByTestId('location')).toHaveTextContent('tab=industrial-visits');
  expect(screen.getByTestId('location')).not.toHaveTextContent('visitPage=');
});

it('corrects an out-of-range visit bookmark to the last backend page', async () => {
  mount('?tab=industrial-visits&visitPage=999&visitSector=Technology');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('visitPage=3'));
  expect(screen.getByTestId('location')).toHaveTextContent('visitSector=Technology');
});

it('advances Visits repeatedly without dropping the current tab or filters', async () => {
  mount('?tab=industrial-visits&visitSector=Technology&visitLocation=Delhi');
  const next = await screen.findByRole('button', { name: 'Next page' });
  await userEvent.click(next);
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('visitPage=2'));
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByTestId('location')).toHaveTextContent('visitPage=3');
  expect(screen.getByTestId('location')).toHaveTextContent('tab=industrial-visits');
  expect(screen.getByTestId('location')).toHaveTextContent('visitSector=Technology');
  expect(screen.getByTestId('location')).toHaveTextContent('visitLocation=Delhi');
  await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(screen.getByTestId('location')).toHaveTextContent('visitPage=2');
});

it('falls back to an available tab for a learner-incompatible bookmark', async () => {
  f.independent = true;
  mount('?tab=history');
  expect(await screen.findByRole('button', { name: 'Jobs', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('button', { name: 'Visits', exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Search jobs by title, company, or location' })).toBeVisible();
});

it('uses grid cards and the matching pressed toggle for an invalid visit view', async () => {
  mount('?tab=industrial-visits&visitView=invalid');
  expect(await screen.findByRole('button', { name: 'Visit grid view' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'View visit at Visit employer' })).toBeVisible();
});

it('keeps a newly selected tab when a pending Jobs search updates the URL', async () => {
  mount('?tab=my-jobs');
  await userEvent.type(await screen.findByRole('searchbox', { name: 'Search jobs by title, company, or location' }), 'React');
  await userEvent.click(screen.getByRole('button', { name: 'Visits', exact: true }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('q=React'));
  expect(screen.getByTestId('location')).toHaveTextContent('tab=industrial-visits');
  expect(screen.getByRole('button', { name: 'Visits', exact: true })).toHaveAttribute('aria-current', 'page');
});

it('prevents repeat registration while pending and updates the registered state after success', async () => {
  let finish: (value: unknown) => void = () => {};
  f.register.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  mount('?tab=industrial-visits');
  await userEvent.click(await screen.findByRole('button', { name: 'View visit at Visit employer' }));
  const dialog = screen.getByRole('dialog');
  const register = within(dialog).getByRole('button', { name: /Register for visit/i });
  await userEvent.click(register);
  expect(register).toBeDisabled();
  await userEvent.click(register);
  expect(f.register).toHaveBeenCalledTimes(1);
  expect(f.register).toHaveBeenCalledWith('learner', 'visit');
  f.registeredIds = ['visit'];
  await act(async () => finish({ success: true, message: 'Registered successfully' }));
  expect(await within(dialog).findByRole('button', { name: 'Registered' })).toBeDisabled();
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'View visit at Visit employer' })).toHaveTextContent('Registered');
});

it('leaves a failed registration available to retry without displaying a registered badge', async () => {
  f.register.mockResolvedValue({ success: false, message: 'Registration failed' });
  mount('?tab=industrial-visits');
  await userEvent.click(await screen.findByRole('button', { name: 'View visit at Visit employer' }));
  const dialog = screen.getByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: /Register for visit/i }));
  await waitFor(() => expect(within(dialog).getByRole('button', { name: /Register for visit/i })).toBeEnabled());
  expect(within(dialog).queryByRole('button', { name: 'Registered' })).not.toBeInTheDocument();
});

it('shows real application details even when no recruiter pipeline exists', async () => {
  mount('?tab=my-applications');
  await userEvent.click(await screen.findByRole('button', { name: 'View details for Developer at Employer' }));
  expect(await screen.findByRole('dialog', { name: 'Application details' })).toBeVisible();
  expect(await screen.findByText('Full opportunity description.')).toBeVisible();
  expect(f.get).toHaveBeenCalledWith('/opportunities/application-details?id=app');
  expect(screen.getAllByText('₹0 – ₹10,000').length).toBeGreaterThan(0);
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'View details for Developer at Employer' })).toHaveFocus();
});

it('keeps application metadata visible after a details failure and supports retry', async () => {
  f.get.mockRejectedValueOnce(new Error('Offline'));
  mount('?tab=my-applications');
  await userEvent.click(await screen.findByRole('button', { name: 'View details for Developer at Employer' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Application details could not be loaded');
  expect(screen.getByRole('dialog')).toHaveTextContent('Applied');
  await userEvent.click(screen.getByRole('button', { name: 'Retry details' }));
  expect(await screen.findByText('Full opportunity description.')).toBeVisible();
});

it('lets the learner dismiss a decline dialog by keyboard without declining the offer', async () => {
  f.apps[0].application_status = 'offer_received';
  mount('?tab=my-applications');
  const decline = await screen.findByRole('button', { name: 'Decline', exact: true });
  await userEvent.click(decline);
  expect(screen.getByRole('dialog', { name: 'Decline offer' })).toBeVisible();
  await userEvent.type(screen.getByLabelText('Reason (optional)'), 'Draft reason');
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(decline).toHaveFocus();
  await userEvent.click(decline);
  expect(screen.getByLabelText('Reason (optional)')).toHaveValue('');
});

it('keeps scheduled interviews visible when an application has no pipeline', async () => {
  Object.assign(f.apps[0], { interviews: [{ id: 'interview', type: 'Technical interview', date: '2026-11-01T12:00:00Z', interviewer: 'Hiring team' }] });
  mount('?tab=my-applications');
  await userEvent.click(await screen.findByRole('button', { name: 'View details for Developer at Employer' }));
  expect(screen.getByRole('region', { name: 'Scheduled interviews' })).toHaveTextContent('Technical interview');
});

it('still expands the recruitment pipeline when one exists', async () => {
  Object.assign(f.apps[0], { has_pipeline_status: true, pipeline_stage: 'screened' });
  mount('?tab=my-applications');
  await userEvent.click(await screen.findByRole('button', { name: 'Track progress for Developer at Employer' }));
  expect(screen.getByText('Recruitment progress')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Hide progress for Developer at Employer' }));
  expect(screen.getByText('Recruitment progress')).not.toBeVisible();
});
