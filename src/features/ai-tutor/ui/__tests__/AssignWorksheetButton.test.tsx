import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock('../../api/worksheetService', () => ({ worksheetAction: mocks.action }));
import AssignWorksheetButton from '../AssignWorksheetButton';
afterEach(cleanup);
describe('inline combined worksheet assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.action.mockImplementation(async (action: string) => {
      if (action === 'source') return { variants: [{ difficulty: 'beginner', content: 'Questions' }, { difficulty: 'advanced', content: 'More questions' }], assignmentReady: true };
      if (action === 'context') return { organization: { name: 'Mapped College' }, gradeLevel: 'College/University', learnerCount: 62 };
      return { learnerCount: 62 };
    });
  });
  const show = () => { render(<AssignWorksheetButton conversationId="conversation" messageId="message" courseTitle="Time" />); fireEvent.click(screen.getByText('Assign')); };
  it('confirms inside the chat and assigns every generated level without browser recipient IDs', async () => {
    show();
    expect(await screen.findByText(/62 active learners/)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(/beginner, advanced/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Assign worksheet' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Assign worksheet' }));
    await waitFor(() => expect(mocks.action).toHaveBeenCalledWith('publish-all', expect.objectContaining({ reviewed: true, conversationId: 'conversation', messageId: 'message' })));
    const payload = mocks.action.mock.calls.find(([action]) => action === 'publish-all')?.[1];
    expect(payload).not.toHaveProperty('variants');
    expect(payload).not.toHaveProperty('learnerIds');
    expect(await screen.findByRole('status')).toHaveTextContent('Assigned to 62 learners');
    expect(screen.queryByRole('button', { name: 'Assign' })).toBeNull();
  });
  it('shows inline progress until the server confirms assignment', async () => {
    let complete!: (_result: { learnerCount: number }) => void;
    const pending = new Promise<{ learnerCount: number }>(resolve => { complete = resolve; });
    const original = mocks.action.getMockImplementation()!;
    mocks.action.mockImplementation((action: string, ...args: unknown[]) => action === 'publish-all' ? pending : original(action, ...args));
    show();
    await screen.findByText(/62 active learners/);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Assign worksheet' }));
    expect(screen.getByRole('status')).toHaveTextContent('Assigning worksheet...');
    expect(screen.queryByText(/Assigned to/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assign worksheet' })).toBeNull();
    await act(async () => complete({ learnerCount: 1 }));
    expect(screen.getByRole('status')).toHaveTextContent('Assigned to 1 learner');
    expect(screen.getByText('All included levels are available in course assignments.')).toBeTruthy();
  });
  it('shows a failed assignment inline without claiming success', async () => {
    const original = mocks.action.getMockImplementation()!;
    mocks.action.mockImplementation((action: string, ...args: unknown[]) => action === 'publish-all' ? Promise.reject(new Error('Assignment failed')) : original(action, ...args));
    show();
    await screen.findByText(/62 active learners/);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Assign worksheet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Assignment failed');
    expect(screen.queryByText(/Assigned to/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Assign worksheet' })).toBeEnabled();
  });
  it('prevents assigning unsafe legacy material', async () => {
    const original = mocks.action.getMockImplementation()!;
    mocks.action.mockImplementation((action: string, ...args: unknown[]) => action === 'source' ? Promise.resolve({ variants: [{ difficulty: 'beginner' }], assignmentReady: false }) : original(action, ...args));
    show();
    expect(await screen.findByText(/Regenerate this worksheet/)).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Assign worksheet' })).toBeDisabled();
  });
  it('blocks an empty mapped audience', async () => {
    mocks.action.mockImplementation(async (action: string) => action === 'source' ? { variants: [{ difficulty: 'beginner' }], assignmentReady: true } : { organization: { name: 'College' }, learnerCount: 0 });
    show();
    expect(await screen.findByText('No active learners are mapped to you.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Assign worksheet' })).toBeDisabled();
  });
});
