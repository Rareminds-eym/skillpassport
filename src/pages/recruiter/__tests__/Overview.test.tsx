import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ dashboard: vi.fn(), track: vi.fn(), refresh: vi.fn() }));
vi.mock('@/features/analytics', () => ({ getDashboardData: mocks.dashboard }));
vi.mock('@/features/analytics/model/useRealtimeActivities', () => ({ useRealtimeActivities: () => ({ activities: [], isLoading: false, refetch: mocks.refresh }) }));
vi.mock('@/features/recruiter', () => ({ ActivityFeed: () => <div>Activity feed</div> }));
vi.mock('@/features/opportunities', () => ({ trackSearchUsage: mocks.track }));
vi.mock('@/components/recruitment/OrgSetupChecklist', () => ({ OrgSetupBanner: () => null, OrgSetupModal: () => null }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { getAccessToken: () => null } }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));

import Overview from '../Overview';

function Location() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}
const data = { kpis: { newProfiles: 2, newProfilesTrend: 0, shortlisted: 0, interviewsScheduled: 0, offersExtended: 0, timeToHire: 15, timeToHireTrend: 0 }, alerts: [], shortlists: [], savedSearches: [] };
function open() { return render(<MemoryRouter initialEntries={['/recruitment/overview']}><Overview /><Location /></MemoryRouter>); }

beforeEach(() => { vi.resetAllMocks(); mocks.dashboard.mockResolvedValue({ data, error: null }); });
afterEach(cleanup);

describe('Recruitment overview', () => {
  it('does not append zero trends to metric values', async () => {
    open();
    const metric = await screen.findByRole('link', { name: /New profiles this week 2$/ });
    expect(metric).toHaveAttribute('href', '/recruitment/talent-pool');
    expect(within(metric).getByText('2')).toBeInTheDocument();
    expect(within(metric).queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Time to hire \(days\) 15$/ })).toBeInTheDocument();
  });

  it('explains empty sections and provides usable destinations', async () => {
    open();
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(screen.getByText('Your next great hire starts with a search')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to shortlists' })).toHaveAttribute('href', '/recruitment/shortlists');
    expect(screen.getByRole('link', { name: 'Browse talent' })).toHaveAttribute('href', '/recruitment/talent-pool');
    expect(screen.getAllByRole('link', { name: 'View all' }).map(link => link.getAttribute('href'))).toEqual(['/recruitment/shortlists', '/recruitment/activities']);
  });

  it('shows loading feedback before showing an empty state', () => {
    mocks.dashboard.mockReturnValue(new Promise(() => {}));
    open();
    expect(screen.getByRole('region', { name: 'Hiring metrics' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  });

  it('shows a recoverable failure without fabricated candidates or metrics', async () => {
    mocks.dashboard.mockResolvedValueOnce({ data: null, error: new Error('Offline') });
    open();
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the dashboard");
    expect(screen.queryByText('Arjun Kumar')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New profiles this week —/ })).toBeInTheDocument();
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retains existing data if refreshing fails', async () => {
    open();
    await screen.findByText("You're all caught up");
    mocks.dashboard.mockResolvedValueOnce({ data: null, error: new Error('Offline') });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last loaded data');
    expect(screen.getByRole('link', { name: /New profiles this week 2$/ })).toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('keeps search criteria when usage tracking fails', async () => {
    mocks.track.mockRejectedValue(new Error('Tracking unavailable'));
    mocks.dashboard.mockResolvedValueOnce({ data: { ...data, savedSearches: [{ id: 'saved-123', name: 'React developers', search_criteria: { query: 'frontend', skills: ['React', 'TypeScript'], location: 'Bengaluru' } }] }, error: null });
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'React developers' }));
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('/recruitment/talent-pool?q=frontend&skills=React%2CTypeScript&location=Bengaluru'));
    expect(mocks.track).toHaveBeenCalledWith('saved-123');
  });

  it('renders incomplete shortlist records safely and links to the matching search', async () => {
    mocks.dashboard.mockResolvedValueOnce({ data: { ...data, shortlists: [{ id: 'sl-1', name: 'Design & Research', candidate_count: 1 }] }, error: null });
    open();
    const link = await screen.findByRole('link', { name: /Design & Research/ });
    expect(link).toHaveAttribute('href', '/recruitment/shortlists?q=Design%20%26%20Research');
    expect(link).toHaveTextContent('1 candidate');
  });
});
