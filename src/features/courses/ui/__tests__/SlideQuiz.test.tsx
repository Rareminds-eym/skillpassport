import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SlideQuiz } from '../SlideQuiz';
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'POST' ? ({ ok: true, json: async () => ({ correct: true }) }) : ({ ok: true, json: async () => ({ quizzes: [{ id: 'quiz', version: 'v1', slideNumber: 4, answers: {}, questions: [{ question: 'Which language?', options: ['Python', 'French', 'Spanish', 'German'] }, { question: 'What next?', options: ['Continue', 'Stop', 'Leave', 'Wait'] }] }] }) })) } }));
describe('slide quiz', () => {
  it('saves an answer and restores it when reopened', async () => {
    const props = { courseId: 'course', lessonId: 'lesson', resourceId: 'resource', ready: true };
    const view = render(<SlideQuiz {...props} slide={1} />);
    view.rerender(<SlideQuiz {...props} slide={4} />);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Submit answer' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Python'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    await screen.findByText('Correct answer. Well done!');
    expect(screen.queryByText('What next?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('What next?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect((screen.getByLabelText('Python') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect((screen.getByRole('button', { name: 'Submit answer' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Continue'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    await screen.findByRole('button', { name: 'Save answers' });
    fireEvent.click(screen.getByRole('button', { name: 'Save answers' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Open slide 4 quiz, 2 questions' }));
    expect((screen.getByLabelText('Python') as HTMLInputElement).checked).toBe(true);
  });

  it('does not open automatically when every answer was already saved', async () => {
    const { ssoClient } = await import('@/shared/api/ssoClient');
    vi.mocked(ssoClient.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quizzes: [{ id: 'quiz', version: 'v1', slideNumber: 4, answers: { 0: 0, 1: 0 }, questions: [{ question: 'Which language?', options: ['Python', 'French', 'Spanish', 'German'] }, { question: 'What next?', options: ['Continue', 'Stop', 'Leave', 'Wait'] }] }] }),
    } as Response);
    render(<SlideQuiz courseId="course" lessonId="lesson" resourceId="resource" ready slide={4} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open slide 4 quiz, 2 questions' })).toBeTruthy());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
