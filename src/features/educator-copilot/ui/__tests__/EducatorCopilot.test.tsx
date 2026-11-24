import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ processQueryStream: vi.fn() }));
vi.mock('@/features/educator-copilot', () => ({
  educatorIntelligenceEngine: { processQueryStream: mocks.processQueryStream },
  educatorWelcomeConfig: { title: 'Teaching Intelligence', subtitle: 'Educator insights', quickActions: [{ id: 'analytics', label: 'Class Analytics', query: 'Show class analytics', icon: () => null, gradient: '' }] },
  educatorChatConfig: { placeholder: 'Ask a question', disclaimer: 'Teaching guidance' },
}));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'educator-id' }) }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));
vi.mock('../EducatorCards', () => ({ LearnerInsightCard: () => null }));
import EducatorCopilot from '../EducatorCopilot';

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  mocks.processQueryStream.mockResolvedValue({ success: true, message: 'Your class analytics are ready.' });
});
afterEach(cleanup);
describe('Teaching Intelligence interactions', () => {
  it('allows typing and shows non-streamed answers', async () => {
    render(<EducatorCopilot />);
    const input = screen.getByRole('textbox', { name: 'Ask Teaching Intelligence' });
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: 'Show my class' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByText('Your class analytics are ready.')).toBeInTheDocument());
    expect(mocks.processQueryStream).toHaveBeenCalledWith('Show my class', 'educator-id', expect.any(Function));
  });
  it('fills the input from a card and submits that question using Enter', async () => {
    render(<EducatorCopilot />);
    fireEvent.click(screen.getByRole('button', { name: 'Class Analytics' }));
    const input = screen.getByRole('textbox', { name: 'Ask Teaching Intelligence' });
    expect(input).toHaveValue('Show class analytics');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mocks.processQueryStream).toHaveBeenCalledWith('Show class analytics', 'educator-id', expect.any(Function)));
  });
  it('shows returned failures instead of leaving a blank answer', async () => {
    mocks.processQueryStream.mockResolvedValue({ success: false, error: 'AI service unavailable' });
    render(<EducatorCopilot />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByText('AI service unavailable')).toBeInTheDocument());
  });
  it('prevents duplicate requests while an answer is pending', async () => {
    mocks.processQueryStream.mockReturnValue(new Promise(() => {}));
    render(<EducatorCopilot />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Help' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(mocks.processQueryStream).toHaveBeenCalledTimes(1);
  });
});
