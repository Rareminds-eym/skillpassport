import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({
  get: vi.fn(),
  message: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
}));
vi.mock('@/shared/api', () => ({ apiGet: f.get }));
vi.mock('@/shared/api/messageService', () => ({
  default: { getOrCreateConversation: f.message },
}));
vi.mock('../../api/offerManagementService', () => ({
  default: { acceptOffer: f.accept, rejectOffer: f.reject },
}));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
import { ApplicationsPanel } from '../ApplicationsPanel';
const app = {
  id: 'owned-app',
  opportunityId: 'owned-job',
  jobTitle: 'Engineer',
  company: 'Example',
  location: 'Bengaluru',
  status: 'applied',
  type: 'Full-time',
  level: 'Entry',
  appliedDate: '2026-10-25T20:00:00Z',
  hasPipelineStatus: true,
  pipelineStage: 'screened',
  recruiterId: 'recruiter',
};
const props = {
  applications: [app],
  total: 1,
  page: 1,
  totalPages: 1,
  searchQuery: '',
  statusFilter: 'all',
  kindFilter: 'all',
  onPageChange: vi.fn(),
  setSearchQuery: vi.fn(),
  setStatusFilter: vi.fn(),
  setKindFilter: vi.fn(),
  onResetFilters: vi.fn(),
  onBrowseJobs: vi.fn(),
  onApplicationsUpdate: vi.fn(),
  learnerId: 'own-learner',
  navigate: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  f.get.mockResolvedValue({
    data: {
      application: {
        id: app.id,
        application_status: 'applied',
        applied_at: app.appliedDate,
        opportunity: {
          title: 'Engineer',
          company_name: 'Example',
          description: 'Historical job description',
          employment_type: 'Full-time',
          status: 'closed',
          is_active: false,
        },
      },
    },
  });
});
afterEach(cleanup);
it('provides consistent details for a pipeline application and reads the owned historical endpoint', async () => {
  render(<ApplicationsPanel {...props} />);
  expect(screen.getByRole('status')).toHaveTextContent('1 submission');
  fireEvent.click(
    screen.getByRole('button', {
      name: 'View details for Engineer at Example',
    }),
  );
  expect(await screen.findByText('Historical job description')).toBeVisible();
  expect(
    screen.getByText('No longer accepting new applications'),
  ).toBeVisible();
  expect(f.get).toHaveBeenCalledWith(
    '/opportunities/application-details?id=owned-app',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});
it('exposes progress state and treats rejection as an outcome rather than a negative step', () => {
  render(
    <ApplicationsPanel
      {...props}
      applications={[{ ...app, status: 'rejected', pipelineStage: 'rejected' }]}
    />,
  );
  const toggle = screen.getByRole('button', {
    name: 'Track progress for Engineer at Example',
  });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(toggle);
  expect(
    screen.getByRole('button', {
      name: 'Hide progress for Engineer at Example',
    }),
  ).toHaveAttribute('aria-expanded', 'true');
  expect(
    screen.getByRole('region', {
      name: 'Recruitment progress for Engineer at Example',
    }),
  ).toHaveTextContent('Not selected');
  expect(screen.queryByText(/Stage -1/)).toBeNull();
});
it('renders contextual visit metadata and registration details without salary or raw types', async () => {
  const visit = {
    ...app,
    type: 'factory_visit',
    hasPipelineStatus: false,
    salary: 'Salary not specified',
    industry: 'Manufacturing',
  };
  f.get.mockResolvedValue({
    data: {
      application: {
        id: app.id,
        application_status: 'applied',
        opportunity: {
          title: 'Engineer',
          employment_type: 'factory_visit',
          description: 'A visit',
          status: 'open',
          is_active: true,
        },
      },
    },
  });
  render(<ApplicationsPanel {...props} applications={[visit]} />);
  expect(screen.getAllByText('Registered')[0]).toBeVisible();
  expect(screen.queryByText('Salary not specified')).toBeNull();
  expect(screen.queryByText('factory_visit')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /View details for/ }));
  expect(
    await screen.findByRole('dialog', { name: 'Registration details' }),
  ).toBeVisible();
  expect(within(screen.getByRole('dialog')).queryByText('Salary')).toBeNull();
});
it('offers the right empty-state recovery and omits nonexistent pagination', () => {
  const view = render(
    <ApplicationsPanel {...props} applications={[]} total={0} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Browse jobs' }));
  expect(props.onBrowseJobs).toHaveBeenCalledOnce();
  expect(screen.getByRole('status')).not.toHaveTextContent('Page');
  view.rerender(
    <ApplicationsPanel
      {...props}
      applications={[]}
      total={0}
      searchQuery="missing"
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Clear search and filters' }),
  );
  expect(props.onResetFilters).toHaveBeenCalledOnce();
});
it('keeps messaging failures in context with a scoped retry', async () => {
  f.message.mockRejectedValueOnce(new Error('unavailable'));
  render(<ApplicationsPanel {...props} />);
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Message recruiter about Engineer at Example',
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Messaging could not be opened',
  );
  expect(screen.getByRole('button', { name: 'Retry messaging' })).toBeVisible();
  f.message.mockResolvedValueOnce({ id: 'conversation' });
  fireEvent.click(screen.getByRole('button', { name: 'Retry messaging' }));
  await waitFor(() =>
    expect(props.navigate).toHaveBeenCalledWith(
      '/learner/messages',
      expect.any(Object),
    ),
  );
});
it('cleans up tracking-only overlay suppression on unmount', () => {
  document.body.classList.remove('hide-zoho-widget');
  const view = render(<ApplicationsPanel {...props} />);
  expect(document.body).toHaveClass(
    'application-tracking-active',
    'hide-zoho-widget',
  );
  view.unmount();
  expect(document.body).not.toHaveClass(
    'application-tracking-active',
    'hide-zoho-widget',
  );
});

it('keeps offer responses single-flight across cards and refreshes after success', async () => {
  let finish;
  f.accept.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <ApplicationsPanel
      {...props}
      total={2}
      applications={[
        { ...app, status: 'offer_received' },
        {
          ...app,
          id: 'other-app',
          jobTitle: 'Analyst',
          status: 'offer_received',
        },
      ]}
    />,
  );
  const accepts = screen.getAllByRole('button', { name: 'Accept offer' });
  fireEvent.click(accepts[0]);
  expect(accepts[1]).toBeDisabled();
  expect(f.accept).toHaveBeenCalledTimes(1);
  finish({ success: true });
  await waitFor(() =>
    expect(props.onApplicationsUpdate).toHaveBeenCalledOnce(),
  );
});
