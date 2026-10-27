import { expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LearningJobs from '../LearningJobs';
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
it('redirects old learning-jobs bookmarks to the inline Jobs section', async () => {
  render(
    <MemoryRouter initialEntries={['/learner/learning-jobs']}>
      <Routes>
        <Route path="/learner/learning-jobs" element={<LearningJobs />} />
        <Route path="/learner/opportunities" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Current location')).toHaveTextContent(
      '/learner/opportunities?tab=my-jobs#learning-matches',
    ),
  );
});
