import {expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ResumePromptScreen from '../ResumePromptScreen';
const answers = Object.fromEntries(Array.from({length: 80}, (_, i) => ['q'+i, 'A']));
function show(extra = {}, props = {}) {
  return render(<MemoryRouter><ResumePromptScreen pendingAttempt={{stream_id: 'btech_cse', all_responses: answers, ...extra}} onResume={vi.fn()} onStartNew={vi.fn()} {...props}/></MemoryRouter>);
}
it('uses the supplied assessment total rather than an unrelated default', () => {
  show({}, {totalQuestions: 200});
  expect(screen.getByText('40%')).toBeTruthy();
  expect(screen.queryByText('100%')).toBeNull();
});
it('keeps saved answer count without inventing a percentage when the total is unknown', () => {
  show();
  expect(screen.getByText('80')).toBeTruthy();
  expect(screen.queryByText(/^[0-9]+%$/)).toBeNull();
  expect(screen.getByText('Total question count unavailable')).toBeTruthy();
  expect(screen.getByText('Resume Assessment')).toBeTruthy();
});
it('retains the adaptive session percentage with its defined 50-question total', () => {
  show({isAdaptiveInProgress: true, adaptiveSession: {questionsAnswered: 6}});
  expect(screen.getByText('12%')).toBeTruthy();
});
