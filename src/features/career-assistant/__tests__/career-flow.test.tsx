import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const io = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), remove: vi.fn(), stream: vi.fn(), feedback: vi.fn(), request: vi.fn(), tools: vi.fn(), access: vi.fn(), addon: vi.fn(), subscription: { plan: 'synthetic-plan-one' }, entitlements: [] }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: io.tools } }));
vi.mock('@/features/subscription', () => ({ entitlementService: { hasFeatureAccess: io.access }, addOnCatalogService: { getAddOnByFeatureKey: io.addon } }));
vi.mock('@/features/subscription/model/subscriptionStore', () => ({ useUserEntitlements: () => ({ activeEntitlements: io.entitlements, hasAddOnAccessSync: noAddOn }) }));
const noAddOn = () => false;
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: io.subscription }) }));
vi.mock('@/shared/lib/error-logging', () => ({ createFeatureAccessErrorLog: vi.fn(), logError: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiGet: io.get, apiPost: io.post, apiDelete: io.remove }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'synthetic-learner' }), useAuthStore: { getState: () => ({ user: { id: 'synthetic-learner' }, isAuthenticated: true }) } }));
vi.mock('../api/careerWorkerService', () => ({ streamCareerChat: io.stream }));
vi.mock('../hooks/useAIFeedback', () => ({ useAIFeedback: () => ({ submitFeedback: io.feedback, loadFeedback: stableLoad, getFeedback: () => null, isLoading: () => false }) }));
const stableLoad = () => Promise.resolve();
vi.mock('@/shared/ui', () => ({ Card: ({ children }: {children: React.ReactNode}) => <div>{children}</div> }));
vi.mock('@/shared/ui/CareerAIToolsGrid', () => ({ default: ({ onAction, disabled }: {onAction: (query: string) => void; disabled: boolean}) => <button disabled={disabled} onClick={() => onAction('synthetic quick question')}>Quick question</button> }));
vi.mock('../hooks/useVirtualMessage', () => ({ VirtualMessage: ({ children }: {children: React.ReactNode}) => <div>{children}</div> }));
vi.mock('../ui/InteractiveCards', () => ({ InteractiveCardRenderer: () => null }));
vi.mock('../ui/Visualizations', () => ({ VisualizationContainer: () => null }));
vi.mock('@/features/career-assistant', () => ({ formatMessageTime: () => '12:00' }));
vi.mock('@/shared/api/apiUtils', () => ({ getApiUrl: () => '/api/career', getAuthHeaders: () => ({}) }));
vi.mock('@/features/counselling/api/careerApiInterceptor', () => ({ getGlobalCareerApiInterceptor: () => ({ request: io.request }) }));
import { useFeatureGate, clearFeatureAccessCache } from '@/features/subscription/model/useFeatureGate';
import { useSmartScroll } from '../hooks/useSmartScroll';
import CareerAssistant from '../ui/CareerAssistant';
import { SimpleMessage } from '../ui/EnhancedMessage';
import { useCareerConversations } from '../hooks/useCareerConversations';
import { sendCareerChatMessage } from '@/features/counselling/api/careerApiService';
const conversation = (id = 'conversation-one', messages: unknown[] = []) => ({ id, title: id, messages, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
const pair = [{ id: 'same-turn', role: 'user', content: 'saved question', timestamp: '2026-01-01T00:00:00Z' }, { id: 'same-turn', role: 'assistant', content: 'saved response', timestamp: '2026-01-01T00:00:00Z' }];
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };
function mount(state?: unknown) { return render(<MemoryRouter initialEntries={[{ pathname: '/learner/career-ai', state }]}><CareerAssistant /></MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks();
  clearFeatureAccessCache();
  io.subscription = { plan: 'synthetic-plan-one' };
  io.access.mockResolvedValue({ success: true, data: { hasAccess: true, accessSource: 'plan' } });
  Element.prototype.scrollIntoView = vi.fn();
  io.get.mockImplementation(async (url: string) => url.includes('conversation?id=') ? { data: conversation('conversation-one', pair) } : { data: { conversations: [], hasMore: false } });
  io.feedback.mockResolvedValue(true);
  io.stream.mockResolvedValue({ success: true, conversationId: 'saved-conversation', messageId: 'saved-turn' });
});
afterEach(cleanup);
describe('Conversation state and chat interactions', () => {
  it('advances pagination without restarting page zero and keeps all history messages', async () => {
    io.get.mockImplementation(async (url: string) => url.includes('conversation?id=') ? { data: conversation('conversation-one', Array.from({ length: 60 }, (_, i) => ({ ...pair[i % 2], id: String(i) }))) } : { data: { conversations: [conversation(url)], hasMore: !url.endsWith('2') } });
    const { result } = renderHook(useCareerConversations);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.loadMore()); await act(() => result.current.loadMore());
    expect(io.get.mock.calls.map(([url]) => url)).toEqual(['/career/conversations?page=0', '/career/conversations?page=1', '/career/conversations?page=2']);
    await act(() => result.current.loadConversation('conversation-one'));
    expect(result.current.currentConversation?.messages).toHaveLength(60);
  });
  it('preserves selected messages when deletion fails and exposes the error', async () => {
    io.remove.mockRejectedValue(new Error('unavailable'));
    const { result } = renderHook(useCareerConversations);
    await act(() => result.current.loadConversation('conversation-one'));
    await act(() => result.current.deleteConversation('conversation-one'));
    expect(result.current.currentConversation?.messages).toEqual(pair);
    expect(result.current.error).toContain('Unable to delete');
  });
  it('ignores a stale conversation selection after New Chat', async () => {
    const pending = deferred<unknown>();
    const { result } = renderHook(useCareerConversations);
    io.get.mockImplementation((url: string) => url.includes('conversation?id=') ? pending.promise : Promise.resolve({ data: { conversations: [], hasMore: false } }));
    let selection!: Promise<boolean>;
    act(() => { selection = result.current.loadConversation('conversation-one'); });
    act(() => result.current.createNewConversation());
    await act(async () => { pending.resolve({ data: conversation('conversation-one', pair) }); await selection; });
    expect(result.current.currentConversationId).toBeNull();
  });
  it('sends a navigation query exactly once', async () => {
    mount({ query: 'navigation question' });
    await waitFor(() => expect(io.stream).toHaveBeenCalledTimes(1));
    expect(io.stream.mock.calls[0][0]).toBe('navigation question');
  });
  it('cancels an old stream on New Chat and does not carry its ID into a later request', async () => {
    const pending = deferred<unknown>(); io.stream.mockReturnValueOnce(pending.promise);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Quick question' }));
    expect(screen.getByRole('button', { name: 'Quick question' })).toBeDisabled();
    const signal = io.stream.mock.calls[0][4] as AbortSignal;
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
    expect(signal.aborted).toBe(true);
    await act(async () => { io.stream.mock.calls[0][3]('late chunk'); pending.resolve({ success: true, conversationId: 'stale-id', messageId: 'stale-message' }); await pending.promise; });
    expect(screen.queryByText('late chunk')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quick question' }));
    await waitFor(() => expect(io.stream).toHaveBeenCalledTimes(2));
    expect(io.stream.mock.calls[1][1]).toBeNull();
  });
  it('restores the draft and shows persistent failure, without showing an unsaved reply as history', async () => {
    io.stream.mockResolvedValue({ success: false, error: 'Service unavailable' });
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Quick question' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message Career AI' })).toHaveValue('synthetic quick question'));
    expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable');
  });
  it('does not send Enter during IME composition and exposes the input limit', async () => {
    mount(); const input = screen.getByRole('textbox', { name: 'Message Career AI' });
    fireEvent.change(input, { target: { value: 'composing' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(io.stream).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('maxlength', '10000');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(io.stream).toHaveBeenCalledTimes(1));
  });
  it('pairs feedback with the assistant role even when both saved messages share the same ID', async () => {
    io.get.mockResolvedValueOnce({ data: { conversations: [conversation()], hasMore: false } });
    mount(); fireEvent.click(await screen.findByRole('button', { name: /^conversation-one/ }));
    fireEvent.click(await screen.findByTitle('Good response'));
    await waitFor(() => expect(io.feedback).toHaveBeenCalledWith(expect.objectContaining({ userMessage: 'saved question', aiResponse: 'saved response', messageId: 'same-turn' }), true, undefined, undefined));
  });
});
describe('Feedback and markdown', () => {
  it('keeps rating and text open on save failure, forwards details and returns focus on Escape', async () => {
    const save = vi.fn().mockResolvedValue(false);
    render(<SimpleMessage content="answer" timestamp="2026-01-01T00:00:00Z" messageId="turn" onFeedback={save} />);
    const opener = screen.getByTitle('Bad response - Click to give feedback'); fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Help us improve' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3 stars' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'What could be improved?' }), { target: { value: 'more detail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('turn', false, 3, 'more detail'));
    expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
  it('renders inline code inline and a fenced block with exactly one pre element', () => {
    const { container } = render(<SimpleMessage content={'Use `code` here.\n\n```js\nconst a = 1;\n```'} timestamp="2026-01-01T00:00:00Z" />);
    expect(container.querySelectorAll('pre')).toHaveLength(1);
    expect(container.querySelector('p code')?.textContent).toBe('code');
  });
});
describe('Stream terminal states', () => {
  it('settles an EOF without done as an error and still delivers partial tokens', async () => {
    io.request.mockResolvedValue(new Response('data: {"content":"partial"}\n\n'));
    const token = vi.fn(), done = vi.fn(), error = vi.fn();
    await sendCareerChatMessage({ message: 'question' }, token, done, error);
    expect(token).toHaveBeenCalledWith('partial'); expect(done).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('interrupted') }));
  });
  it('accepts a final done line without a newline and ignores events after completion', async () => {
    io.request.mockResolvedValue(new Response('data: {"content":"answer"}\n\ndata: {"done":true,"conversationId":"saved"}\ndata: {"content":"late"}\n'));
    const token = vi.fn(), done = vi.fn(), error = vi.fn();
    await sendCareerChatMessage({ message: 'question' }, token, done, error);
    expect(token).toHaveBeenCalledTimes(1); expect(done).toHaveBeenCalledTimes(1); expect(error).not.toHaveBeenCalled();
    io.request.mockResolvedValue(new Response('data: {"done":true}'));
    await sendCareerChatMessage({ message: 'question' }, token, done, error);
    expect(done).toHaveBeenCalledTimes(2);
  });
});

describe('Scroll, tools and entitlement recovery', () => {
  it('does not pull the reader down while streaming new content', () => {
    const { result, rerender } = renderHook(({ version }) => useSmartScroll([version]), { initialProps: { version: 0 } });
    const container = document.createElement('div');
    Object.defineProperties(container, { scrollHeight: { value: 2000 }, clientHeight: { value: 500 }, scrollTop: { value: 800, writable: true } });
    Object.defineProperty(result.current.messagesContainerRef, 'current', { value: container, writable: true });
    const end = document.createElement('div');
    Object.defineProperty(result.current.messagesEndRef, 'current', { value: end, writable: true });
    act(() => result.current.handleScroll());
    container.scrollTop = 300;
    act(() => result.current.handleScroll());
    expect(result.current.userScrolledUp).toBe(true);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    rerender({ version: 1 });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
  it('clears the old entitlement error on explicit retry and rechecks when the plan changes', async () => {
    io.access.mockResolvedValueOnce({ success: false, error: 'Unavailable' });
    const { result, rerender } = renderHook(() => useFeatureGate('synthetic-feature'));
    await waitFor(() => expect(result.current.error).toBe('Unavailable'));
    await act(() => result.current.invalidateCache());
    expect(result.current.hasAccess).toBe(true); expect(result.current.error).toBeNull();
    io.subscription = { plan: 'synthetic-plan-two' };
    rerender();
    await waitFor(() => expect(io.access).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
  it('ignores an old entitlement response after a plan change', async () => {
    const pending = deferred<unknown>(); io.access.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(() => useFeatureGate('synthetic-feature'));
    io.subscription = { plan: 'synthetic-plan-two' }; rerender();
    await waitFor(() => expect(result.current.hasAccess).toBe(true));
    await act(async () => { pending.resolve({ success: false, error: 'Old failure' }); await pending.promise; });
    expect(result.current.hasAccess).toBe(true); expect(result.current.error).toBeNull();
  });
  it('shows action catalog errors with an explicit retry instead of an empty tools grid', async () => {
    const { default: Tools } = await vi.importActual<typeof import('@/shared/ui/CareerAIToolsGrid')>('@/shared/ui/CareerAIToolsGrid');
    io.tools.mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { actions: [{ id: 'malformed' }] } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { actions: [] } }));
    render(<MemoryRouter><Tools /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load career tools');
    fireEvent.click(screen.getByRole('button', { name: 'Retry career tools' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('invalid response'));
    fireEvent.click(screen.getByRole('button', { name: 'Retry career tools' }));
    expect(await screen.findByText(/No career tools are available/)).toBeInTheDocument();
  });
});

describe('Mobile history drawer', () => {
  it('opens a modal drawer, supports Escape and returns focus to its named toggle', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation(query => ({ matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    try {
      mount(); const toggle = screen.getByRole('button', { name: 'Open conversation history' });
      fireEvent.click(toggle);
      expect(screen.getByRole('dialog', { name: 'Conversation history' })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(toggle).toHaveFocus();
    } finally {
      window.matchMedia = original;
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
    }
  });
});

describe('Recheck of previously unexercised boundaries', () => {
  it('preserves a completed navigation query under the application Strict Mode setup', async () => {
    render(<React.StrictMode><MemoryRouter initialEntries={[{ pathname: '/learner/career-ai', state: { query: 'strict-mode question' } }]}><CareerAssistant /></MemoryRouter></React.StrictMode>);
    await waitFor(() => expect(io.stream).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('strict-mode question')).toBeInTheDocument());
    expect((io.stream.mock.calls[0][4] as AbortSignal).aborted).toBe(false);
  });
  it('does not let an older feedback load overwrite a newly acknowledged vote', async () => {
    const { useAIFeedback: useActualFeedback } = await vi.importActual<typeof import('../hooks/useAIFeedback')>('../hooks/useAIFeedback');
    const pending = deferred<unknown>(); io.get.mockReturnValueOnce(pending.promise); io.post.mockResolvedValue({ success: true });
    const { result } = renderHook(useActualFeedback);
    let load!: Promise<void>;
    act(() => { load = result.current.loadFeedback('conversation-one'); });
    await act(() => result.current.submitFeedback({ conversationId: 'conversation-one', messageId: 'turn', userMessage: 'question', aiResponse: 'answer' }, true));
    expect(result.current.getFeedback('turn')?.thumbsUp).toBe(true);
    await act(async () => { pending.resolve({ data: [{ message_id: 'turn', thumbs_up: false, user_rating: null, user_feedback: null }] }); await load; });
    expect(result.current.getFeedback('turn')?.thumbsUp).toBe(true);
  });
  it('allows Escape while a feedback save remains pending', async () => {
    const pending = deferred<boolean>(); const save = vi.fn().mockReturnValue(pending.promise);
    render(<SimpleMessage content="answer" timestamp="2026-01-01T00:00:00Z" messageId="turn" onFeedback={save} />);
    fireEvent.click(screen.getByTitle('Bad response - Click to give feedback'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    const wasDismissed = screen.queryByRole('dialog') === null;
    await act(async () => { pending.resolve(true); await pending.promise; });
    expect(wasDismissed).toBe(true);
  });
});

describe('Recheck real stream service adapter', () => {
  it('preserves confirmed turn metadata through the actual stream service', async () => {
    const { streamCareerChat: actualStream } = await vi.importActual<typeof import('../api/careerWorkerService')>('../api/careerWorkerService');
    io.request.mockResolvedValue(new Response('data: {"content":"answer"}\n\ndata: {"done":true,"conversationId":"saved","messageId":"turn","intent":"interview-prep","interactive":{"suggestions":[]}}\n\n'));
    const chunk = vi.fn();
    const result = await actualStream('question', null, [], chunk);
    expect(chunk).toHaveBeenCalledWith('answer');
    expect(result).toMatchObject({ success: true, conversationId: 'saved', messageId: 'turn', intent: 'interview-prep', interactive: { suggestions: [] } });
  });
  it('settles a truncated stream through the actual adapter as a failure', async () => {
    const { streamCareerChat: actualStream } = await vi.importActual<typeof import('../api/careerWorkerService')>('../api/careerWorkerService');
    io.request.mockResolvedValue(new Response('data: {"content":"partial"}\n\n'));
    const result = await actualStream('question', null, [], vi.fn());
    expect(result).toMatchObject({ success: false, error: expect.stringContaining('interrupted') });
  });
});
