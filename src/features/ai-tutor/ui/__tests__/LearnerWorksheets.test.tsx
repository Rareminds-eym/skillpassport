import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ action: vi.fn(), pdf: vi.fn() }));
vi.mock('../../api/worksheetService', () => ({ worksheetAction: mocks.action }));
vi.mock('../../model/exportToPDF', () => ({ exportToPDF: mocks.pdf }));
import LearnerWorksheets from '../LearnerWorksheets';
describe('learner worksheets', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.pdf.mockResolvedValue(undefined); });
  it('downloads the authorized worksheet as PDF without opening a preview', async () => {
    mocks.action.mockImplementation(async (action: string) => action === 'list' ? [{ id: 'recipient', worksheet: { title: 'Time management', difficulty: 'beginner' } }] : { title: 'Time management', difficulty: 'beginner', student_content: 'What is prioritization?', instructions: 'Answer each question.' });
    render(<LearnerWorksheets courseId="course-a" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Download Time management as PDF' }));
    await waitFor(() => expect(mocks.pdf).toHaveBeenCalledWith(expect.objectContaining({ content: 'Answer each question.\n\nWhat is prioritization?', courseTitle: 'Time management', lessonTitle: 'beginner worksheet' })));
    expect(screen.queryByText('What is prioritization?')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Worksheet details' })).toBeNull();
    expect(mocks.action).toHaveBeenCalledWith('list', { page: 0, courseId: 'course-a' });
    expect(mocks.action).toHaveBeenCalledWith('open', { recipientId: 'recipient', courseId: 'course-a' });
    expect(screen.getByRole('region', { name: 'Assigned AI worksheets' })).toBeTruthy();
  });
  it('does not generate a PDF when the assignment access check fails', async () => {
    mocks.action.mockImplementation(async (action: string) => {
      if (action === 'list') return [{ id: 'recipient', worksheet: { title: 'Time management', difficulty: 'beginner' } }];
      throw new Error('Assignment access denied');
    });
    render(<LearnerWorksheets courseId="course-a" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Download Time management as PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Assignment access denied');
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it('reports PDF failures and lets the learner retry', async () => {
    mocks.action.mockImplementation(async (action: string) => action === 'list' ? [{ id: 'recipient', worksheet: { title: 'Time management', difficulty: 'beginner' } }] : { title: 'Time management', difficulty: 'beginner', student_content: 'Question' });
    mocks.pdf.mockRejectedValueOnce(new Error('PDF failed'));
    render(<LearnerWorksheets courseId="course-a" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Download Time management as PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('PDF failed');
    fireEvent.click(screen.getByRole('button', { name: 'Download Time management as PDF' }));
    await waitFor(() => expect(mocks.pdf).toHaveBeenCalledTimes(2));
  });
});
