import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
const f = vi.hoisted(() => ({ result: {}, refresh: vi.fn() }));
vi.mock('@/features/opportunities', () => ({
  useAIJobMatching: () => ({ ...f.result, refreshMatches: f.refresh }),
}));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'actor', orgId: 'org' }) }));
vi.mock('@/features/subscription/ui/shared/FeatureGate', () => ({
  FeatureGate: ({ children }) => children,
}));
import RecommendedJobs from '../RecommendedJobs';
const props = {
  learnerProfile: { id: 'fixture-learner' },
  onSelectJob: vi.fn(),
  onApply: vi.fn(),
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  f.result = { matchedJobs: [], loading: false, error: null };
});
it('shows source errors before stale profile guidance', () => {
  f.result = { matchedJobs: [], loading: false, error: 'Career context unavailable', readiness: { state: 'needs_profile' } };
  render(<RecommendedJobs {...props} sidebar />);
  expect(screen.getByRole('alert').textContent).toContain('Career context unavailable');
  expect(screen.queryByRole('link', { name: 'Add a skill' })).toBeNull();
});
it('shows an explicit AI empty state instead of leaving the sidebar blank', () => {
  render(<RecommendedJobs {...props} sidebar />);
  expect(
    screen.getByRole('heading', { name: 'AI job recommendations' }),
  ).toBeTruthy();
  expect(screen.getByText(/No matching jobs found/)).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Refresh recommendations' }),
  );
  expect(f.refresh).toHaveBeenCalledOnce();
});
it.each(['needs_profile', 'limited_context'])('shows actionable %s without a retry loop or job cards', state => {
  f.result.readiness = { state };
  render(<RecommendedJobs {...props} sidebar />);
  expect(screen.getByRole('status')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Add a skill' }).getAttribute('href')).toBe('/learner/my-skills');
  expect(screen.queryByRole('button', { name: 'Retry suggestions' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Refresh suggestions' }).disabled).toBe(true);
  expect(screen.queryByRole('article')).toBeNull();
});
it('shows the actionable matching failure and a retry without generic jobs', () => {
  f.result.error =
    'AI job recommendations are being prepared. Please retry shortly.';
  render(<RecommendedJobs {...props} />);
  expect(screen.getByText(f.result.error)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retry suggestions' }));
  expect(f.refresh).toHaveBeenCalledOnce();
  expect(screen.queryByText('Recent opportunities')).toBeNull();
});
it('renders verified AI suggestions with working job details', () => {
  const job = {
    id: 'job-1',
    title: 'Software engineer',
    company_name: 'Example',
    location: 'Remote',
  };
  f.result.matchedJobs = [
    { opportunity: job, match_reason: 'Ranked against your profile' },
  ];
  render(<RecommendedJobs {...props} />);
  expect(
    screen.getByRole('heading', { name: 'AI recommended for you' }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Details for Software engineer' }));
  expect(props.onSelectJob).toHaveBeenCalledWith(job);
});

it('consolidates the repeated ranking disclaimer without displaying invented match percentages', () => {
  f.result.matchedJobs = ['Engineer', 'Designer', 'Analyst'].map((title, i) => ({
    opportunity: { id: String(i), title, company_name: 'Example Company', location: 'Bengaluru' },
    match_score: 95,
    match_reason: 'Ranked against your profile; this is not a hiring probability.',
  }));
  render(<RecommendedJobs {...props} sidebar />);
  expect(screen.getAllByText(/Profile-based suggestions, not hiring guarantees/)).toHaveLength(1);
  expect(screen.queryByText(/Ranked against your profile/)).toBeNull();
  expect(screen.queryByText(/95%/)).toBeNull();
  expect(screen.getAllByRole('article')).toHaveLength(3);
});

it('keeps a specific match explanation and real role metadata visible', () => {
  f.result.matchedJobs = [{ opportunity: { id: 'job', title: 'Engineer', company_name: 'Example', employment_type: 'Internship', mode: 'Remote' }, match_reason: 'Ranked against your profile because your approved Python learning matches this role.' }];
  render(<RecommendedJobs {...props} sidebar />);
  expect(screen.getByText(/because your approved Python learning/)).toBeTruthy();
  expect(screen.getByText('Why this role')).toBeTruthy();
  expect(screen.getByText('Internship')).toBeTruthy();
  expect(screen.getByText('Remote')).toBeTruthy();
});

it('shows actual eligible learning criteria when supplied', () => {
  f.result.matchedJobs = [{ opportunity: { id: 'job', title: 'Engineer' }, key_matching_skills: ['Python · Level 2'] }];
  render(<RecommendedJobs {...props} />);
  expect(screen.getByText('Relevant learning')).toBeTruthy();
  expect(screen.getByText('Python · Level 2')).toBeTruthy();
});

it('preserves apply behavior and blocks already submitted applications', () => {
  const job = { id: 'job', title: 'Engineer' };
  f.result.matchedJobs = [{ opportunity: job }];
  const view = render(<RecommendedJobs {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
  expect(props.onApply).toHaveBeenCalledWith(job);
  view.rerender(<RecommendedJobs {...props} appliedJobs={new Set(['job'])} />);
  const submitted = screen.getByRole('button', { name: 'Application Submitted' });
  expect(submitted.disabled).toBe(true);
  fireEvent.click(submitted);
  expect(props.onApply).toHaveBeenCalledTimes(1);
});

it('hides and restores recommendations using the learner-specific preference', () => {
  f.result.matchedJobs = [{ opportunity: { id: 'job', title: 'Engineer' } }];
  const change = vi.fn();
  render(<RecommendedJobs {...props} sidebar onResultsChange={change} />);
  fireEvent.click(screen.getByRole('button', { name: 'Hide suggestions' }));
  expect(localStorage.getItem('recommendations_dismissed:actor:org:fixture-learner')).toBe('true');
  expect(change).toHaveBeenLastCalledWith([]);
  fireEvent.click(screen.getByRole('button', { name: 'Show suggested opportunities' }));
  expect(localStorage.getItem('recommendations_dismissed:actor:org:fixture-learner')).toBeNull();
  expect(change).toHaveBeenLastCalledWith(['job']);
});

it('keeps a usable loading state and prevents repeated refresh requests', () => {
  f.result.loading = true;
  render(<RecommendedJobs {...props} sidebar />);
  expect(screen.getByRole('status').textContent).toContain('Finding AI recommendations');
  const refresh = screen.getByRole('button', { name: 'Refresh suggestions' });
  expect(refresh.disabled).toBe(true);
  fireEvent.click(refresh);
  expect(f.refresh).not.toHaveBeenCalled();
});
