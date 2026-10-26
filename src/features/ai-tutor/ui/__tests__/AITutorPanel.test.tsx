import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(), stopGeneration: vi.fn(), refreshSuggestions: vi.fn(), refreshConversations: vi.fn(),
  streaming: false, content: '## Learning objectives\nPractise time management.', user: { id: 'educator' },
}));
vi.mock('@/shared/model', () => ({ useUser: () => mocks.user, useUserRole: () => ({ isEducator: true }) }));
vi.mock('@/features/ai-tutor/model', () => ({ useLearnerType: () => ({ isTeacher: false, loading: false }) }));
vi.mock('@/features/ai-tutor/model/useTutorChat', () => ({ useTutorChat: () => ({
  messages: [{ id: '1', role: 'assistant', content: mocks.content, timestamp: new Date() }],
  conversations: [], suggestedQuestions: [], isStreaming: mocks.streaming, isLoading: false,
  isReasoning: false, error: null, sendMessage: mocks.sendMessage, stopGeneration: mocks.stopGeneration,
  refreshSuggestions: mocks.refreshSuggestions, refreshConversations: mocks.refreshConversations,
  startNewConversation: vi.fn(),
}) }));
vi.mock('@/shared/ui', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/config', () => ({ getLogger: () => ({ error: vi.fn(), warn: vi.fn() }) }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn() } }));
vi.mock('../WorksheetConfigPanel', () => ({ default: ({ onGenerate }: { onGenerate: () => void }) => <div>Worksheet controls<button onClick={onGenerate}>Generate worksheet</button></div> }));
vi.mock('../LessonPlanConfigPanel', () => ({ default: () => <div>Lesson plan controls</div> }));
vi.mock('../WorksheetExportButton', () => ({ default: () => <button>Export material</button> }));
import AITutorPanel from '../AITutorPanel';
import FloatingEducatorAIButton from '@/shared/ui/FloatingEducatorAIButton';

beforeEach(() => {
  mocks.streaming = false;
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
function showPanel() {
  return render(<MemoryRouter><AITutorPanel courseId="course" courseName="Time Management"
    lessonContext={{ lessonId: 'lesson', lessonTitle: 'Planning your day' }} defaultExpanded /><FloatingEducatorAIButton /></MemoryRouter>);
}
describe('AI facilitator workspace', () => {
  it('hides the floating teaching assistant until the facilitator closes', () => {
    showPanel();
    expect(screen.queryByRole('button', { name: 'Open Teaching AI Assistant' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close facilitator' }));
    expect(screen.getByRole('button', { name: 'Open Teaching AI Assistant' })).toBeInTheDocument();
  });
  it('shows lesson context, readable material, export and an accessible composer', () => {
    showPanel();
    expect(screen.getByRole('region', { name: 'AI facilitator' })).toBeInTheDocument();
    expect(screen.getByText('Planning your day')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learning objectives' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export material' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message the AI facilitator' })).toBeEnabled();
  });
  it('switches generation settings', () => {
    showPanel();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lesson Plan' }));
    expect(screen.getByRole('dialog', { name: 'Plan a lesson' })).toBeInTheDocument();
    expect(screen.getByText('Lesson plan controls')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('opens worksheet settings only when its tool is selected', () => {
    showPanel();
    expect(screen.queryByText('Worksheet controls')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Worksheet' }));
    expect(screen.getByRole('dialog', { name: 'Create a worksheet' })).toBeInTheDocument();
    expect(screen.getByText('Worksheet controls')).toBeInTheDocument();
  });
  it('places refinement instructions in the composer without sending automatically', () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'What would you like to change?' }), { target: { value: 'Add examples' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to message' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message the AI facilitator' })).toHaveValue('Add examples');
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it('closes settings and generates into the conversation', () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Worksheet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate worksheet' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.sendMessage).toHaveBeenCalledWith(expect.stringContaining('worksheet'));
    expect(screen.getByRole('region', { name: 'AI facilitator' })).toBeInTheDocument();
  });
  it('sends refinement requests through the existing chat action', () => {
    showPanel();
    fireEvent.change(screen.getByRole('textbox', { name: 'Message the AI facilitator' }), { target: { value: 'Add examples' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mocks.sendMessage).toHaveBeenCalledWith('Add examples');
  });
  it('announces generation and disables sending while streaming', () => {
    mocks.streaming = true;
    showPanel();
    expect(screen.getByRole('status')).toHaveTextContent('Writing your response');
    expect(screen.getByRole('textbox', { name: 'Message the AI facilitator' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop generation' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop generation' }));
    expect(mocks.stopGeneration).toHaveBeenCalledOnce();
  });
  it('hides response actions while streaming and shows them after completion', () => {
    mocks.streaming = true;
    const view = showPanel();
    expect(screen.queryByRole('button', { name: 'Export material' })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Copy content')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Helpful')).not.toBeInTheDocument();
    mocks.streaming = false;
    view.rerender(<MemoryRouter><AITutorPanel courseId="course" defaultExpanded /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Export material' })).toBeInTheDocument();
  });

  it('does not scroll again when the current streamed response grows', () => {
    mocks.streaming = true;
    const view = showPanel();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    mocks.content += ' More streamed text';
    view.rerender(<MemoryRouter><AITutorPanel courseId="course" defaultExpanded /></MemoryRouter>);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

});
