import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock('../../api/worksheetService', () => ({ worksheetAction: mocks.action }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }));
import AssignWorksheetButton from '../AssignWorksheetButton';
describe('assign worksheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.action.mockImplementation(async (action: string) => {
      if (action === 'source') return { variants: [{ difficulty: 'beginner', content: 'Student questions only' }, { difficulty: 'advanced', content: 'Advanced questions' }], organization: { id: 'org', name: 'College' } };
      if (action === 'learners') return [{ id: 'learner-one', name: 'Learner One' }, { id: 'learner-two', name: 'Learner Two' }];
      return { groupId: 'group' };
    });
  });
  it('publishes generated variants without content textareas or organization selection', async () => {
    render(<AssignWorksheetButton conversationId="conversation" messageId="message" courseTitle="Time" />);
    fireEvent.click(screen.getByText('Assign'));
    const first = await screen.findByLabelText(/Learner One/);
    fireEvent.click(first);
    expect((screen.getByText('Publish assignments') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Learner worksheet — questions only')).toBeNull();
    expect(screen.queryByLabelText('Private answer key')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('Student questions only')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /advanced/ }));
    expect((screen.getByLabelText(/Learner One/) as HTMLInputElement).disabled).toBe(false);
    fireEvent.click(screen.getByLabelText(/Learner One/));
    expect((screen.getByLabelText(/Learner One/) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /beginner/ }));
    expect((screen.getByLabelText(/Learner One/) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByLabelText(/Learner One/));
    fireEvent.click(screen.getByLabelText(/I reviewed/));
    await waitFor(() => expect((screen.getByText('Publish assignments') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByText('Publish assignments'));
    await waitFor(() => expect(mocks.action).toHaveBeenCalledWith('publish', expect.objectContaining({ variants: [{ difficulty: 'beginner', learnerIds: ['learner-one'] }] })));
    expect(await screen.findByText('Assigned')).toBeTruthy();
  });
  it('clears recipient selections and approval when the modal is reopened', async () => {
    render(<AssignWorksheetButton conversationId="conversation" messageId="message" courseTitle="Time" />);
    fireEvent.click(screen.getByText('Assign'));
    fireEvent.click(await screen.findByLabelText(/Learner One/));
    fireEvent.click(screen.getByLabelText(/I reviewed/));
    fireEvent.click(screen.getByLabelText('Close worksheet assignment'));
    fireEvent.click(screen.getByText('Assign'));
    expect((await screen.findByLabelText(/Learner One/) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText(/I reviewed/) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByText('Publish assignments') as HTMLButtonElement).disabled).toBe(true);
  });
  it('still lists mapped learners for an older worksheet that needs regeneration', async () => {
    mocks.action.mockImplementation(async (action: string) => action === 'source'
      ? { variants: [{ difficulty: 'beginner', content: 'Original educator material' }], organization: { id: 'college', name: 'College' }, assignmentReady: false, readinessMessage: 'Regenerate this older worksheet before publishing.' }
      : [{ id: 'learner-one', name: 'Learner One' }]);
    render(<AssignWorksheetButton conversationId="conversation" messageId="message" courseTitle="Time" />);
    fireEvent.click(screen.getByText('Assign'));
    expect(await screen.findByLabelText(/Learner One/)).toBeTruthy();
    expect(screen.getByText('Regenerate this older worksheet before publishing.')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Learner One/));
    expect((screen.getByText('Publish assignments') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText(/I reviewed/) as HTMLInputElement).disabled).toBe(true);
  });
  it('loads learners independently when the worksheet source request fails', async () => {
    mocks.action.mockImplementation(async (action: string) => {
      if (action === 'source') throw new Error('Worksheet is unavailable');
      return [{ id: 'learner-one', name: 'Learner One' }];
    });
    render(<AssignWorksheetButton conversationId="conversation" messageId="message" courseTitle="Time" />);
    fireEvent.click(screen.getByText('Assign'));
    expect(await screen.findByLabelText(/Learner One/)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Worksheet is unavailable');
    expect((screen.getByText('Publish assignments') as HTMLButtonElement).disabled).toBe(true);
  });
});
