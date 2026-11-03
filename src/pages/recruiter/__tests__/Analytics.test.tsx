import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ funnel: vi.fn(), kpis: vi.fn(), quality: vi.fn(), courses: vi.fn(), diversity: vi.fn(), download: vi.fn(), refetch: vi.fn() }));
vi.mock('@/entities/user', () => ({ useRecruitmentFunnel: mocks.funnel }));
vi.mock('@/features/analytics', () => ({ useAnalyticsKPIs: mocks.kpis, getRecruitmentFunnelStats: vi.fn() }));
vi.mock('@/features/educator', () => ({ useQualityMetrics: mocks.quality, useDiversityData: mocks.diversity }));
vi.mock('@/features/courses', () => ({ useCoursePerformance: mocks.courses }));
vi.mock('@/features/recruiter', async () => ({ DateRangePicker: (await import('@/features/recruiter-pipeline/ui/DateRangePicker')).default }));
vi.mock('../analytics/model', async importOriginal => ({ ...await importOriginal<typeof import('../analytics/model')>(), downloadCSV: mocks.download }));
vi.mock('../analytics/HiringTrendChart', () => ({ default: ({ type }: { type: string }) => <div role="img" aria-label={`${type} hiring trend`} /> }));
import Analytics from '../Analytics';

const result = (data: unknown) => ({ data, isLoading: false, isFetching: false, isError: false, refetch: mocks.refetch });
const metrics = { totalCandidates: 10, successfulHires: 0, timeToHire: 23, qualityScore: 85.2, totalCandidatesTrend: 0, successfulHiresTrend: 0 };
const funnel = { sourced: 10, screened: 0, interviewed: 0, offered: 0, hired: 0, hiresTrend: [0, 0, 0], trendLabels: ['Wk1', 'Wk2', 'Wk3'] };
function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output aria-label="URL">{location.search}</output><button onClick={() => navigate(-1)}>Back</button></>;
}
function open(url = '/recruitment/analytics?range=30d&chart=line') {
  return render(<MemoryRouter initialEntries={[url]}><Analytics /><Navigation /></MemoryRouter>);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.kpis.mockReturnValue(result(metrics));
  mocks.funnel.mockReturnValue(result(funnel));
  mocks.quality.mockReturnValue(result({ totalHired: 0, avgAiScore: 0 }));
  mocks.courses.mockReturnValue(result([]));
  mocks.diversity.mockReturnValue({ geographic: result([]), colleges: result([]), refetchAll: mocks.refetch });
});
afterEach(cleanup);

describe('Hiring analytics', () => {
  it('does not present sample quality, speed, or hackathon data as real results', () => {
    open();
    expect(screen.queryByText('23 days')).not.toBeInTheDocument();
    expect(screen.queryByText('85.2')).not.toBeInTheDocument();
    expect(screen.queryByText('TechFest 2024')).not.toBeInTheDocument();
    expect(screen.getByText('No hires recorded in this period')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('supports chart selection and browser back without overwriting URL state', () => {
    open('/recruitment/analytics?range=90d&chart=area&keep=value');
    expect(screen.getByRole('button', { name: 'Area' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Reporting period: Last 90 days' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('range=90d&chart=column&keep=value');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Area' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('passes bookmarked custom dates to every report, including the complete end day', () => {
    open('/recruitment/analytics?range=custom&chart=line&start=2025-09-01&end=2025-09-15');
    const options = mocks.kpis.mock.calls[0][0];
    expect(options.preset).toBe('custom');
    expect(new Date(options.startDate).getHours()).toBe(0);
    expect(new Date(options.endDate).getHours()).toBe(23);
    expect(new Date(options.endDate).getMilliseconds()).toBe(999);
    expect(mocks.quality).toHaveBeenCalledWith(options);
    expect(mocks.courses).toHaveBeenCalledWith({ ...options, limit: 4 });
  });

  it('exports displayed live values and omits fabricated or unavailable metrics', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    const rows = mocks.download.mock.calls[0][0];
    expect(rows).toContainEqual({ Section: 'Overview', Metric: 'Total candidates', Value: 10, Unit: 'candidates', Period: 'Last 30 days' });
    expect(rows.some((row: { Metric: string }) => /CGPA|score|Time to hire|Premium|TechFest/i.test(row.Metric))).toBe(false);
    expect(rows.find((row: { Section: string }) => row.Section === 'Current pipeline').Period).toContain('all dates');
  });

  it('shows loading feedback and prevents exporting the previous period while updating', () => {
    mocks.kpis.mockReturnValue({ ...result(metrics), isFetching: true });
    open();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'Key hiring metrics' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Updating reports…')).toBeInTheDocument();
  });

  it('distinguishes failed reports from empty ones and offers retry', () => {
    mocks.funnel.mockReturnValue({ ...result(null), isError: true });
    open();
    const report = screen.getByRole('region', { name: 'Hiring trend' });
    expect(within(report).getByRole('alert')).toHaveTextContent("This report couldn't be loaded");
    expect(within(report).queryByText('No hires recorded in this period')).not.toBeInTheDocument();
    fireEvent.click(within(report).getByRole('button', { name: 'Try again' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('renders a populated chart and exposes the exact numbers in a table', () => {
    mocks.funnel.mockReturnValue(result({ ...funnel, hiresTrend: [2, 0, 3] }));
    open();
    expect(screen.getByRole('img', { name: 'line hiring trend' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View chart data' }));
    const table = screen.getByRole('table', { name: 'Hiring trend for Last 30 days' });
    expect(within(table).getByRole('row', { name: 'Wk1 2' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: 'Wk2 0' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: 'Wk3 3' })).toBeInTheDocument();
  });

  it('allows dates and chart selection to reset together', () => {
    open('/recruitment/analytics?range=7d&chart=column');
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('?range=30d&chart=line');
    expect(screen.getByRole('button', { name: 'Reporting period: Last 30 days' })).toBeInTheDocument();
  });
});
