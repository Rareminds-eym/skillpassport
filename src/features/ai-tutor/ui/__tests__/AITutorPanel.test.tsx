import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { fireEvent, render as baseRender, screen, cleanup, waitFor, within } from '@testing-library/react';
function render(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return baseRender(ui, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setFacilitatorMode: vi.fn(), sendMessage: vi.fn(), stopGeneration: vi.fn(), refreshSuggestions: vi.fn(), refreshConversations: vi.fn(),
  worksheet: false, streaming: false, educator: true, empty: false, content: '## Learning objectives\nPractise time management.', user: { id: 'educator' },
}));
vi.mock('@/shared/model', () => ({ useUser: () => mocks.user, useUserRole: () => ({ isEducator: mocks.educator }) }));
vi.mock('../../api/worksheetService', () => ({ worksheetAction: vi.fn().mockResolvedValue({ organization: { name: 'Mapped College' }, gradeLevel: 'College/University', learnerCount: 8 }) }));
vi.mock('../LearnerWorksheets', () => ({ default: ({ courseId }: { courseId: string }) => <div>Assignments for {courseId}</div> }));
vi.mock('@/features/ai-tutor/model', () => ({ useLearnerType: () => ({ isTeacher: false, loading: false }) }));
vi.mock('@/features/ai-tutor/model/useTutorChat', () => ({ useTutorChat: () => ({
  facilitatorMode: 'auto', setFacilitatorMode: mocks.setFacilitatorMode, activeFacilitator: 'organizer',
  messages: mocks.empty ? [] : [{ id: '1', role: 'assistant', content: mocks.content, worksheetAvailable: mocks.worksheet, timestamp: new Date() }],
  conversationId: 'saved-conversation', conversations: [], suggestedQuestions: [], isStreaming: mocks.streaming, isLoading: false,
  isReasoning: false, error: null, sendMessage: mocks.sendMessage, stopGeneration: mocks.stopGeneration,
  refreshSuggestions: mocks.refreshSuggestions, refreshConversations: mocks.refreshConversations,
  startNewConversation: vi.fn(),
}) }));
vi.mock('@/shared/ui', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/config', () => ({ getLogger: () => ({ error: vi.fn(), warn: vi.fn() }) }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn() } }));
vi.mock('../WorksheetConfigPanel', () => ({ default: ({ onGenerate, config }: { onGenerate: () => void; config: { difficultyLevels?: string[] } }) => <div>Worksheet controls<span>Levels: {config.difficultyLevels?.join(', ')}</span><button onClick={onGenerate}>Generate worksheet</button></div> }));
vi.mock('../LessonPlanConfigPanel', () => ({ default: () => <div>Lesson plan controls</div> }));
vi.mock('../WorksheetExportButton', () => ({ default: () => <button>Export material</button> }));
import AITutorPanel from '../AITutorPanel';
import FloatingEducatorAIButton from '@/shared/ui/FloatingEducatorAIButton';

beforeEach(() => {
  mocks.worksheet = false;
  mocks.streaming = false;
  mocks.empty = false;
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
  it('renders questions and private answers as separate numbered lists', () => {
    mocks.content = '<!-- STUDENT_WORKSHEET -->\n1. First question? A) Plan\n   B) Delay\n2. Second question?\n<!-- PRIVATE_SOLUTIONS -->\n1. A\n2. B\n<!-- END_WORKSHEET -->';
    showPanel();
    expect(screen.getByRole('heading', { name: 'Answer key and grading' })).toBeInTheDocument();
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    expect(within(lists[0]).getAllByRole('listitem')).toHaveLength(2);
    expect(within(lists[0]).getAllByRole('listitem')[0].querySelector('br')).not.toBeNull();
    expect(within(lists[1]).getAllByRole('listitem')).toHaveLength(2);
    expect(within(lists[1]).getAllByRole('listitem')[0]).toHaveTextContent('A');
  });
  it('uses normal Markdown whitespace and scopes compact paragraphs to worksheets', () => {
    mocks.content = '<!-- STUDENT_WORKSHEET -->\n1. What comes first? A) Plan\n\n   B) Delay\n\n2. Another question?\n<!-- PRIVATE_SOLUTIONS -->\n1. A\n2. B\n<!-- END_WORKSHEET -->';
    showPanel();
    const first = screen.getAllByRole('listitem')[0];
    expect(first).not.toHaveClass('whitespace-pre-line');
    const paragraphs = first.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs[0]).not.toHaveClass('whitespace-pre-line');
    expect(first.closest('div')).toHaveClass('[&_li>p]:!my-0');
  });
  it('shows all six facilitators vertically on hover and opens a chosen role page', () => {
    showPanel();
    const trigger = screen.getByRole('button', { name: 'Explore six facilitators' });
    expect(screen.queryByRole('group', { name: 'Choose a facilitator' })).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger.parentElement!);
    const choices = screen.getByRole('group', { name: 'Choose a facilitator' });
    expect(within(choices).getAllByRole('button')).toHaveLength(6);
    fireEvent.click(within(choices).getByRole('button', { name: 'Problem Solver' }));
    expect(screen.getByRole('heading', { name: 'Problem Solver' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Choose a facilitator' })).not.toBeInTheDocument();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it('opens the hover choices with keyboard focus and dismisses with Escape or pointer exit', () => {
    showPanel();
    const trigger = screen.getByRole('button', { name: 'Explore six facilitators' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('group', { name: 'Choose a facilitator' })).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Choose a facilitator' })).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger.parentElement!);
    fireEvent.mouseLeave(trigger.parentElement!);
    expect(screen.queryByRole('group', { name: 'Choose a facilitator' })).not.toBeInTheDocument();
  });

  it('omits the facilitator dropdown while keeping the chat tools', () => {
    showPanel();
    expect(screen.queryByRole('combobox', { name: 'Active facilitator' })).not.toBeInTheDocument();
    expect(screen.queryByText('Automatic')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Facilitator tools' })).toBeInTheDocument();
  });

  it.each([true, false])('grows the composer to three rows and collapses after sending (educator=%s)', educator => {
    mocks.educator = educator;
    showPanel();
    const input = screen.getByRole('textbox', { name: 'Message the AI facilitator' }) as HTMLTextAreaElement;
    Object.defineProperty(input, 'scrollHeight', { configurable: true, get: () => input.value ? input.value.split('\n').length * 20 : 20 });
    fireEvent.change(input, { target: { value: 'First\nSecond' } });
    expect(input.style.height).toBe('40px');
    fireEvent.change(input, { target: { value: 'First\nSecond\nThird' } });
    expect(input.style.height).toBe('60px');
    expect(input.style.overflowY).toBe('hidden');
    fireEvent.change(input, { target: { value: 'First\nSecond\nThird\nFourth' } });
    expect(input.style.height).toBe('60px');
    expect(input.style.overflowY).toBe('auto');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mocks.sendMessage).toHaveBeenCalledWith('First\nSecond\nThird\nFourth');
    expect(input.style.height).toBe('20px');
    expect(input.style.overflowY).toBe('hidden');
  });
  it('shows the shared orb in learner welcome without educator role controls', () => {
    mocks.educator = false;
    mocks.empty = true;
    const { container } = showPanel();
    expect(screen.getByText('Welcome to AI Tutor')).toBeInTheDocument();
    expect(container.querySelector('.facilitator-orb')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
  });
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
    expect(screen.queryByRole('button', { name: 'Export material' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message the AI facilitator' })).toBeEnabled();
  });
  it('switches generation settings', () => {
    showPanel();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lesson Plan' }));
    expect(screen.getByRole('region', { name: 'Plan a lesson' })).toBeInTheDocument();
    expect(screen.getByText('Lesson plan controls')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('opens worksheet settings only when its tool is selected', async () => {
    showPanel();
    expect(screen.queryByText('Worksheet controls')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Worksheet' }));
    expect(screen.getByRole('region', { name: 'Create a worksheet' })).toBeInTheDocument();
    expect(screen.getByText('Worksheet controls')).toBeInTheDocument();
    await screen.findByText(/Mapped College/);
  });
  it('keeps only worksheet and lesson-plan tools with expandable labels', () => {
    showPanel();
    expect(screen.queryByRole('button', { name: 'Refine' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Worksheet' })).toHaveTextContent('Worksheet');
    expect(screen.getByRole('button', { name: 'Lesson Plan' })).toHaveTextContent('Lesson Plan');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it('closes settings and generates into the conversation', async () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Worksheet' }));
    await screen.findByText(/Mapped College/);
    fireEvent.click(screen.getByRole('button', { name: 'Generate worksheet' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledWith(expect.stringContaining('worksheet'), { generate: true }));
    expect(screen.getByRole('region', { name: 'AI facilitator' })).toBeInTheDocument();
  });
  it('sends refinement requests through the existing chat action', () => {
    showPanel();
    fireEvent.change(screen.getByRole('textbox', { name: 'Message the AI facilitator' }), { target: { value: 'Add examples' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mocks.sendMessage).toHaveBeenCalledWith('Add examples');
  });
  it('shows export and assignment invitation only for generated questions', async () => {
    mocks.worksheet = true;
    showPanel();
    expect(screen.getByRole('button', { name: 'Export material' })).toBeInTheDocument();
    expect(await screen.findByText('Would you like to assign these questions to your learners?')).toBeInTheDocument();
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
    mocks.worksheet = true;
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

  it('keeps the welcome screen as default and opens roles only through the facilitator icon', () => {
    mocks.empty = true;
    showPanel();
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
    for (const name of ['Plan', 'Create', 'Guide', 'Solve']) expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Six AI facilitators' })).not.toBeInTheDocument();
    const explore = screen.getByRole('button', { name: 'Explore six facilitators' });
    expect(explore).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(explore);
    expect(screen.getByRole('region', { name: 'Six AI facilitators' })).toBeInTheDocument();
    expect(explore).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Back to conversation' }));
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
    expect(explore).toHaveAttribute('aria-expanded', 'false');
  });
  it.each(['Plan', 'Create'])('opens settings from welcome action %s without generating automatically', async label => {
    mocks.empty = true;
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('region', { name: label === 'Plan' ? 'Plan a lesson' : 'Create a worksheet' })).toBeInTheDocument();
    await screen.findByText(/Mapped College/);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
  });
  it('opens Organizer lesson planning without sending a chat request', async () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Explore six facilitators' }));
    fireEvent.click(screen.getByRole('button', { name: /Organizer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Plan this lesson' }));
    expect(screen.getByRole('region', { name: 'Plan a lesson' })).toBeInTheDocument();
    await screen.findByText(/Mapped College/);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it('selects all three levels from Individualized Support', async () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Explore six facilitators' }));
    fireEvent.click(screen.getByRole('button', { name: /Individualized Support/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create three difficulty levels' }));
    expect(screen.getByText('Levels: low, medium, high')).toBeInTheDocument();
    await screen.findByText(/Mapped College/);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it('prepares a guidance question for review instead of generating material', () => {
    showPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Explore six facilitators' }));
    fireEvent.click(screen.getByRole('button', { name: /Mentor and Guide/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Review a learner response' }));
    expect((screen.getByRole('textbox', { name: 'Message the AI facilitator' }) as HTMLTextAreaElement).value).toContain('Ask me to share the response');
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Learning objectives' })).toBeInTheDocument();
  });

  it.each(['Guide', 'Solve'])('prepares a chat question from the welcome %s action without sending automatically', name => {
    mocks.empty = true;
    showPanel();
    fireEvent.click(screen.getByRole('button', { name }));
    const input = screen.getByRole('textbox', { name: 'Message the AI facilitator' }) as HTMLTextAreaElement;
    expect(input.value).toContain(name === 'Guide' ? 'review a learner response' : 'work through a misconception');
    expect(input).toHaveFocus();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Six AI facilitators' })).not.toBeInTheDocument();
  });

});
