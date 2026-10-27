import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(), stopGeneration: vi.fn(), refreshSuggestions: vi.fn(), refreshConversations: vi.fn(),
  streaming: false, educator: true, content: '## Learning objectives\nPractise time management.', user: { id: 'educator' },
}));
vi.mock('@/shared/model', () => ({ useUser: () => mocks.user, useUserRole: () => ({ isEducator: mocks.educator }) }));
vi.mock('../LearnerWorksheets', () => ({ default: ({ courseId }: { courseId: string }) => <div>Assignments for {courseId}</div> }));
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
  mocks.educator = true;
  mocks.content = '## Learning objectives\nPractise time management.';
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
function showPanel() {
  return render(<MemoryRouter><AITutorPanel courseId="course" courseName="Time Management"
    lessonContext={{ lessonId: 'lesson', lessonTitle: 'Planning your day' }} defaultExpanded /><FloatingEducatorAIButton /></MemoryRouter>);
}
describe('AI facilitator workspace', () => {
  it('renders escaped worksheet comments as clean content rather than implementation markers', () => {
    mocks.content = '```markdown\n&lt;!-- STUDENT_WORKSHEET --&gt;\n## Clean worksheet\nQuestions\n<!-- PRIVATE_SOLUTIONS -->\nAnswer guidance\n<!-- END_WORKSHEET -->\n```';
    showPanel();
    expect(screen.getByRole('heading', { name: 'Clean worksheet' })).toBeInTheDocument();
    expect(screen.queryByText(/STUDENT_WORKSHEET|PRIVATE_SOLUTIONS|END_WORKSHEET/)).not.toBeInTheDocument();
    expect(screen.getByText('Answer guidance')).toBeInTheDocument();
  });
  it('copies teaching content without worksheet protocol comments', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    mocks.content = '`<!-- STUDENT_WORKSHEET -->`\nQuestions\n<!-- PRIVATE_SOLUTIONS -->\nAnswers\n<!-- END_WORKSHEET -->';
    showPanel();
    fireEvent.click(screen.getByTitle('Copy content'));
    expect(writeText).toHaveBeenCalledWith('\nQuestions\n\nAnswers\n');
  });
  it('opens course-specific assignments from the learner tutor header', () => {
    mocks.educator = false;
    showPanel();
    expect(screen.queryByText('Assignments for course')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View course assignments' }));
    expect(screen.getByRole('region', { name: 'Course assignments' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Assignments for course')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Back to AI tutor'));
    expect(screen.queryByRole('region', { name: 'Course assignments' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View course assignments' })).toBeInTheDocument();
  });
  it('does not show the learner assignment icon to educators', () => {
    showPanel();
    expect(screen.queryByLabelText('View course assignments')).not.toBeInTheDocument();
  });
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
  it('keeps only worksheet and lesson-plan tools with expandable labels', () => {
    showPanel();
    expect(screen.queryByRole('button', { name: 'Refine' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Worksheet' })).toHaveTextContent('Worksheet');
    expect(screen.getByRole('button', { name: 'Lesson Plan' })).toHaveTextContent('Lesson Plan');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
