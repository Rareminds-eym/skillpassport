import { beforeEach, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
const f = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/api', () => ({ apiGet: f.get }));
vi.mock('@/shared/model', () => ({
  useUser: () => ({ id: 'learner-user' }),
}));
import { LearningMatches } from '../LearningMatches';
const job = (id: number) => ({
  id: String(id),
  title: `Learning job ${id}`,
  company_name: 'Example',
  location: 'Bengaluru',
  learning_eligibility: { state: 'eligible', criteria: [] },
});
function Location() {
  const location = useLocation();
  return (
    <output aria-label="Current location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}
function setup(
  path = '/learner/opportunities?tab=my-jobs&q=Python',
  onSelect = vi.fn(),
) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LearningMatches onSelectJob={onSelect} />
      <Location />
    </MemoryRouter>,
  );
  return onSelect;
}
beforeEach(() => {
  vi.clearAllMocks();
  f.get.mockImplementation(async (url: string) => ({
    data: {
      jobs: url.includes('offset=12')
        ? [job(13), job(14)]
        : Array.from({ length: 12 }, (_, i) => job(i + 1)),
      total: 14,
      pageSize: 12,
    },
  }));
});
it('shows a compact section and expands/paginates without leaving Jobs or losing general filters', async () => {
  setup();
  await screen.findByText('Learning job 1');
  expect(screen.getAllByRole('article')).toHaveLength(3);
  fireEvent.click(
    screen.getByRole('button', { name: 'Show all 14 learning matches' }),
  );
  expect(screen.getAllByRole('article')).toHaveLength(12);
  fireEvent.click(
    within(
      screen.getByRole('navigation', { name: 'Learning match pages' }),
    ).getByRole('button', { name: 'Next' }),
  );
  await screen.findByText('Learning job 13');
  expect(screen.getByLabelText('Current location').textContent).toContain(
    '/learner/opportunities?tab=my-jobs&q=Python',
  );
  expect(screen.getByLabelText('Current location').textContent).toContain(
    'matchPage=2',
  );
});
it('opens matched job details through the existing callback instead of navigating to another page', async () => {
  const select = setup();
  await screen.findByText('Learning job 1');
  fireEvent.click(
    screen.getAllByRole('button', { name: 'View job details' })[0],
  );
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  expect(screen.getByLabelText('Current location').textContent).not.toContain(
    'learning-jobs',
  );
});
it('keeps learning search separate from the main job search and resets learning pagination', async () => {
  setup(
    '/learner/opportunities?tab=my-jobs&q=Python&matchPage=2&matchView=expanded',
  );
  await screen.findByText('Learning job 13');
  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search learning matches' }),
    { target: { value: 'Engineer' } },
  );
  await waitFor(() =>
    expect(f.get).toHaveBeenCalledWith(
      '/learning/jobs?state=eligible&search=Engineer&offset=0',
    ),
  );
  expect(screen.getByLabelText('Current location').textContent).toContain(
    'q=Python',
  );
  expect(screen.getByLabelText('Current location').textContent).toContain(
    'matchQ=Engineer',
  );
});
it('offers a scoped retry and preserves general job browsing when matching fails', async () => {
  f.get.mockRejectedValueOnce(new Error('Learning matching is unavailable'));
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Learning matching is unavailable',
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry learning matches' }),
  );
  await screen.findByText('Learning job 1');
});
it('does not present malformed API responses as a successful empty feed', async () => {
  f.get.mockResolvedValueOnce({ data: {} });
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Learning matches could not be loaded',
  );
});

it('opens retired all-view links in Ready to apply and exposes only the two learning filters', async () => {
  setup('/learner/opportunities?tab=my-jobs&matchState=all');
  await screen.findByText('Learning job 1');
  expect(
    screen.getByRole('button', { name: 'Ready to apply' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    within(
      screen.getByRole('group', { name: 'Learning eligibility filter' }),
    ).getAllByRole('button'),
  ).toHaveLength(2);
  expect(
    screen.queryByRole('button', { name: 'All learning jobs' }),
  ).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Show all 14 learning matches' }),
  ).toBeTruthy();
  expect(f.get).toHaveBeenCalledWith(
    '/learning/jobs?state=eligible&search=&offset=0',
  );
});

it('explains an empty learning-only catalog without duplicating general jobs', async () => {
  f.get.mockResolvedValueOnce({ data: { jobs: [], total: 0, pageSize: 12 } });
  setup('/learner/opportunities?tab=my-jobs&matchState=all&matchView=expanded');
  await screen.findByText('No learning matches ready to apply yet');
  expect(
    screen.getByText(/You can still browse all job openings below/),
  ).toBeTruthy();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
  expect(
    screen.queryByRole('navigation', { name: 'Learning match pages' }),
  ).toBeNull();
});
