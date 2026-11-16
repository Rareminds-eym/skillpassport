import type { ComponentProps, ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({
  state: {} as Record<string, unknown>, create: vi.fn(), save: vi.fn(), complete: vi.fn(),
  status: vi.fn(), training: vi.fn(), generate: vi.fn(), cached: vi.fn(), cache: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ state: f.state }) }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ email: 'qa@example.test' }) }));
vi.mock('@/entities/learner', () => ({ useLearnerDataByEmail: () => ({ learnerData: { id: 'qa-learner' } }) }));
vi.mock('@/features/assessment/api/assessmentGenerationService', () => ({
  generateAssessment: f.generate, getCachedAssessment: f.cached, cacheAssessment: f.cache,
}));
vi.mock('@/features/assessment/api/externalAssessmentService', () => ({
  createAssessmentAttempt: f.create, updateAssessmentProgress: f.save,
  completeAssessment: f.complete, checkAssessmentStatus: f.status, updateTrainingAfterAssessment: f.training,
}));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children, className }: ComponentProps<'div'>) => <div className={className}>{children}</div> },
}));
import DynamicAssessment from '../DynamicAssessment';

const questions = [1, 2].map(n => ({ id: `q${n}`, question: `Question prompt ${n}`, type: 'short_answer', correct_answer: 'A' }));
const assessment = { course: 'QA Assessment', level: 'Intermediate', questions };
const resume = (index = 0, time = 900) => {
  f.state.resumeAttempt = { id: 'attempt-1', course_name: assessment.course, assessment_level: assessment.level,
    questions, learner_answers: [], current_question_index: index, time_remaining: time };
};
const answer = async () => {
  const input = await screen.findByPlaceholderText('Type your answer here...');
  fireEvent.change(input, { target: { value: 'A' } });
};
beforeEach(() => {
  vi.clearAllMocks();
  f.state = { courseName: assessment.course, courseId: '30000000-0000-4000-8000-000000000001' };
  f.status.mockResolvedValue({ status: 'not_started' });
  f.create.mockResolvedValue({ success: true, data: { id: 'attempt-1' } });
  f.save.mockResolvedValue({ success: true });
  f.complete.mockResolvedValue({ success: true, score: 50 });
  f.training.mockResolvedValue({ success: true });
  f.generate.mockResolvedValue(assessment); f.cached.mockReturnValue(null);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

for (const source of ['pre-generated', 'cached', 'generated']) {
  it(`blocks an unsaved ${source} assessment when attempt creation fails`, async () => {
    if (source === 'pre-generated') f.state.preGeneratedQuestions = questions;
    if (source === 'cached') f.cached.mockReturnValue(assessment);
    f.create.mockResolvedValue({ success: false, error: 'Cannot save assessment attempt' });
    render(<DynamicAssessment />);
    expect(await screen.findByText('Cannot save assessment attempt')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Type your answer here...')).not.toBeInTheDocument();
    expect(f.complete).not.toHaveBeenCalled();
  });
}
it('retains the answer and question on rejected or thrown progress saves, and advances only after success', async () => {
  resume(); f.save.mockResolvedValueOnce({ success: false, error: 'Save unavailable' }).mockRejectedValueOnce(new Error('Connection lost'));
  render(<DynamicAssessment />); await answer();
  fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable');
  expect(screen.getByText('Question prompt 1')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Type your answer here...')).toHaveValue('A');
  fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connection lost'));
  fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  expect(await screen.findByText('Question prompt 2')).toBeInTheDocument();
  expect(f.create).not.toHaveBeenCalled();
});
it('does not complete or lose the final answer when its save fails', async () => {
  resume(1); f.save.mockResolvedValue({ success: false, error: 'Final answer not saved' });
  render(<DynamicAssessment />); await answer();
  fireEvent.click(screen.getByRole('button', { name: /Submit/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Final answer not saved');
  expect(screen.getByPlaceholderText('Type your answer here...')).toHaveValue('A');
  expect(f.complete).not.toHaveBeenCalled(); expect(f.training).not.toHaveBeenCalled();
});
it('keeps the persisted attempt on screen instead of announcing completion when completion fails', async () => {
  resume(1); f.complete.mockResolvedValue({ success: false });
  render(<DynamicAssessment />); await answer();
  fireEvent.click(screen.getByRole('button', { name: /Submit/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to complete assessment');
  expect(screen.queryByText('Assessment Completed')).not.toBeInTheDocument();
  expect(f.training).not.toHaveBeenCalled();
});
it('uses the persisted server score after saving the final answer and completing successfully', async () => {
  resume(1); f.complete.mockResolvedValue({ success: true, score: 20 });
  render(<DynamicAssessment />); await answer();
  fireEvent.click(screen.getByRole('button', { name: /Submit/ }));
  expect(await screen.findByText('Assessment Completed')).toBeInTheDocument();
  expect(screen.getByText('20%')).toBeInTheDocument();
  expect(f.save.mock.invocationCallOrder[0]).toBeLessThan(f.complete.mock.invocationCallOrder[0]);
  expect(f.training).toHaveBeenCalledWith('qa-learner', f.state.courseId, 20, false);
});
it('persists the current answer before timed submission completes', async () => {
  resume(0, 1); render(<DynamicAssessment />); await answer();
  fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), { target: { value: 'B' } });
  expect(await screen.findByText('Assessment Completed', {}, { timeout: 2500 })).toBeInTheDocument();
  expect(f.save).toHaveBeenCalledWith('attempt-1', 0, 'B', expect.any(Number), 0);
  expect(f.save.mock.invocationCallOrder[0]).toBeLessThan(f.complete.mock.invocationCallOrder[0]);
});

it('autosaves the selected answer while the one-second countdown is running', async () => {
  vi.useFakeTimers(); resume();
  await act(async () => { render(<DynamicAssessment />); });
  fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), { target: { value: 'A' } });
  for (let second = 0; second < 10; second++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
  expect(f.save).toHaveBeenCalledWith('attempt-1', 0, 'A', expect.any(Number));
});
