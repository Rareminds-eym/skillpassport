import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowDown, Square, PanelLeft, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { streamCareerChat } from '../api/careerWorkerService';
import { useCareerConversations, Conversation } from '../hooks/useCareerConversations';
import { useAIFeedback, AIFeedback, FeedbackData } from '../hooks/useAIFeedback';
import { ConversationSidebar } from './ConversationSidebar';
import { EnhancedMessage, SimpleMessage } from './EnhancedMessage';
import CareerAIToolsGrid from '@/shared/ui/CareerAIToolsGrid';
import { Card } from '@/shared/ui';
import { useOptimizedMessages, Message } from '../hooks/useOptimizedMessages';
import { useSmartScroll } from '../hooks/useSmartScroll';
import { VirtualMessage } from '../hooks/useVirtualMessage';
import { useUser } from '@/shared/model/authStore';
import { INITIAL_VISIBLE_MESSAGES, MESSAGE_PRELOAD_MARGIN, USER_MESSAGE_HEIGHT,
  ASSISTANT_MESSAGE_HEIGHT, MAX_INPUT_LENGTH } from '../constants';

const CareerAssistantContainer: React.FC = () => {
  const user = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const history = useCareerConversations();
  const { submitFeedback, loadFeedback, getFeedback, isLoading: isFeedbackLoading } = useAIFeedback();
  const { messages, setMessages, clearMessages, replaceMessages } = useOptimizedMessages();
  const scroll = useSmartScroll([messages]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const active = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const activeTurn = useRef<{ userId: string; assistantId: string; text: string } | null>(null);
  const navigationQuery = useRef<string | null>(null);
  const cancel = useCallback(() => {
    epoch.current++;
    active.current?.abort();
    active.current = null;
    setIsTyping(false);
    if (activeTurn.current) {
      const turn = activeTurn.current;
      setMessages(previous => previous.filter(message => message.id !== turn.userId && message.id !== turn.assistantId));
      setInput(turn.text);
      activeTurn.current = null;
    }
  }, [setMessages]);
  useEffect(() => { cancel(); setLimitReached(false); setFailure(null); setInput('');
    return () => { epoch.current++; active.current?.abort(); };
  }, [user?.id, cancel]);
  useEffect(() => {
    if (history.currentConversation) replaceMessages(history.currentConversation.messages);
    else if (!history.currentConversationId) clearMessages();
  }, [history.currentConversation, history.currentConversationId, replaceMessages, clearMessages]);
  useEffect(() => {
    if (history.currentConversationId) void loadFeedback(history.currentConversationId);
  }, [history.currentConversationId, loadFeedback]);

  const handleSend = useCallback(async (query?: string) => {
    const text = (query ?? input).trim();
    if (!text || active.current || history.loadingConversation || limitReached) return;
    if (text.length > MAX_INPUT_LENGTH) { setFailure(`Messages must be ${MAX_INPUT_LENGTH} characters or fewer.`); return; }
    if (!user?.id) { setFailure('Please log in to use Career AI.'); return; }
    const controller = new AbortController();
    active.current = controller;
    const requestEpoch = ++epoch.current;
    const conversationId = history.currentConversationId;
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    activeTurn.current = { userId, assistantId, text };
    setMessages(previous => [...previous,
      { id: userId, role: 'user', content: text, timestamp },
      { id: assistantId, role: 'assistant', content: '', timestamp }]);
    setInput(''); setFailure(null); setIsTyping(true); scroll.setUserScrolledUp(false);
    try {
      const result = await streamCareerChat(text, conversationId, [], chunk => {
        if (epoch.current !== requestEpoch) return;
        setMessages(previous => previous.map(message => message.id === assistantId && message.role === 'assistant'
          ? { ...message, content: message.content + chunk } : message));
      }, controller.signal);
      if (epoch.current !== requestEpoch) return;
      if (!result.success) throw new Error(typeof result.error === 'string' ? result.error : 'The response could not be saved.');
      if (!result.conversationId || !result.messageId) throw new Error('The response was not confirmed as saved.');
      history.setCurrentConversationId(result.conversationId);
      setMessages(previous => previous.map(message => message.id === assistantId
        ? { ...message, id: result.messageId!, interactive: result.interactive, intent: result.intent,
          intentConfidence: result.intentConfidence, phase: result.phase } : message));
      void history.fetchConversations();
    } catch (error) {
      if (epoch.current !== requestEpoch) return;
      const message = error instanceof Error ? error.message : 'Unable to send your message.';
      if (message.includes('QUOTA_EXCEEDED')) setLimitReached(true);
      // Neither a partial reply nor an unconfirmed turn is presented as persisted history.
      setMessages(previous => previous.filter(item => item.id !== assistantId && item.id !== userId));
      setInput(text);
      setFailure(`${message} Your question is in the composer. Check history before sending it again.`);
    } finally {
      if (epoch.current === requestEpoch) { active.current = null; activeTurn.current = null; setIsTyping(false); }
    }
  }, [input, user?.id, history.currentConversationId, history.loadingConversation, limitReached,
    history.setCurrentConversationId, history.fetchConversations, setMessages, scroll.setUserScrolledUp]);

  useEffect(() => {
    const state = location.state as { query?: string } | null;
    if (!state?.query || navigationQuery.current === location.key) return;
    const { query, ...rest } = state;
    // Defer dispatch until effect setup survives Strict Mode's setup/cleanup
    // replay. Mark the query consumed only when its single request is dispatched.
    const timer = window.setTimeout(() => {
      navigationQuery.current = location.key;
      setInput(query);
      navigate(location.pathname + location.search, { replace: true, state: rest });
      void handleSend(query);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.key, location.state, location.pathname, location.search, navigate, handleSend]);

  const selectConversation = async (id: string) => {
    cancel(); setFailure(null);
    if (await history.loadConversation(id)) setSidebarCollapsed(true);
  };
  const newConversation = () => {
    cancel(); history.createNewConversation(); clearMessages(); setInput(''); setFailure(null); setSidebarCollapsed(true);
  };
  const deleteConversation = async (id: string) => {
    if (id === history.currentConversationId) cancel();
    await history.deleteConversation(id);
  };
  const feedback = async (messageId: string, thumbsUp: boolean, rating?: number, text?: string) => {
    if (!history.currentConversationId) return false;
    const index = messages.findIndex(message => message.id === messageId && message.role === 'assistant');
    const assistant = messages[index];
    const question = messages.slice(0, index).reverse().find(message => message.role === 'user');
    if (!assistant || !question) return false;
    const data: AIFeedback = { conversationId: history.currentConversationId, messageId,
      userMessage: question.content, aiResponse: assistant.content, detectedIntent: assistant.intent,
      intentConfidence: assistant.intentConfidence, conversationPhase: assistant.phase };
    return submitFeedback(data, thumbsUp, rating, text);
  };
  return <CareerAssistantUI showWelcome={messages.length === 0} limitReached={limitReached}
    sidebarCollapsed={sidebarCollapsed}
    setSidebarCollapsed={setSidebarCollapsed} messages={messages} loading={history.loadingConversation}
    isTyping={isTyping} input={input} setInput={setInput} onSendMessage={() => void handleSend()}
    onStopTyping={() => { cancel();
      setFailure('Generation stopped. This response may not have been saved. Check history before sending again.'); }}
    {...scroll} getFeedback={getFeedback} isFeedbackLoading={isFeedbackLoading} submitFeedback={feedback}
    onSendQuery={query => void handleSend(query)} conversations={history.conversations}
    currentConversationId={history.currentConversationId} selectConversation={selectConversation}
    newConversation={newConversation} deleteConversation={deleteConversation}
    conversationsLoading={history.loading} hasMore={history.hasMore} loadMore={history.loadMore}
    failure={failure} historyError={history.error} retryHistory={history.fetchConversations} />;
};

interface CareerAssistantUIProps {
  showWelcome: boolean;
  limitReached: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  loading: boolean;
  isTyping: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: () => void;
  onStopTyping: () => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
  userScrolledUp: boolean;
  setUserScrolledUp: (value: boolean) => void;
  scrollToBottom: (smooth?: boolean) => void;
  getFeedback: (messageId: string) => FeedbackData | null;
  isFeedbackLoading: (messageId: string) => boolean;
  submitFeedback: (messageId: string, thumbsUp: boolean, rating?: number, text?: string) => Promise<boolean>;
  failure: string | null;
  historyError: string | null;
  retryHistory: () => void;
  onSendQuery: (query: string) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  selectConversation: (id: string) => void;
  newConversation: () => void;
  deleteConversation: (id: string) => void;
  conversationsLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Career Assistant UI Component
 * Uses Zustand store for state management
 */
const CareerAssistantUI: React.FC<CareerAssistantUIProps> = ({
  showWelcome,
  limitReached,
  sidebarCollapsed,
  setSidebarCollapsed,
  messages,
  loading,
  isTyping,
  input,
  setInput,
  onSendMessage,
  onStopTyping,
  messagesContainerRef,
  messagesEndRef,
  handleScroll,
  userScrolledUp,
  setUserScrolledUp,
  scrollToBottom,
  getFeedback,
  isFeedbackLoading,
  submitFeedback,
  onSendQuery,
  conversations,
  currentConversationId,
  selectConversation,
  newConversation,
  deleteConversation,
  conversationsLoading,
  hasMore,
  loadMore, failure, historyError, retryHistory,
}) => {

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyToggleRef = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);


  /**
   * Auto-focus input on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full min-h-0 min-w-0 bg-white">
      <div className="hidden md:flex">
      {/* Conversation History Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={newConversation}
        onDeleteConversation={deleteConversation}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        conversationsLoading={conversationsLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />

      </div>
      <Dialog.Root open={!sidebarCollapsed && mobile} onOpenChange={open => setSidebarCollapsed(!open)}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 md:hidden" />
          <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); historyToggleRef.current?.focus(); }} className="fixed inset-y-0 left-0 z-50 max-w-[90vw] bg-white md:hidden">
            <Dialog.Title className="sr-only">Conversation history</Dialog.Title>
            <Dialog.Description className="sr-only">Open or delete a conversation, or start a new chat.</Dialog.Description>
            <ConversationSidebar conversations={conversations} currentConversationId={currentConversationId}
              onSelectConversation={selectConversation} onNewConversation={newConversation} onDeleteConversation={deleteConversation}
              sidebarCollapsed={false} onToggleSidebar={() => setSidebarCollapsed(true)} conversationsLoading={conversationsLoading}
              hasMore={hasMore} onLoadMore={loadMore} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col max-w-5xl mx-auto relative">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden absolute top-4 left-4 z-10">
          <button
            ref={historyToggleRef} aria-label="Open conversation history" aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-16 pb-8 md:pt-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          {showWelcome && messages.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                  Welcome to Career AI
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Get personalized career guidance, job matching, skill analysis, and interview prep. Not sure where to start?
                </motion.p>
              </div>

              <CareerAIToolsGrid onAction={(prompt) => onSendQuery(prompt)} variant="full" animated={true} disabled={loading || isTyping || limitReached} />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-sm text-gray-500 mt-8">
                💡 Click a card above or type your question below to get started
              </motion.div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 text-center">Quick Actions:</p>
                  <CareerAIToolsGrid onAction={(prompt) => onSendQuery(prompt)} variant="compact" animated={true} disabled={loading || isTyping || limitReached} />
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message, index) => {
                  // Create unique key by combining ID with role and index
                  // Backend uses same turnId for user+assistant pair, so we need unique keys for React
                  const uniqueKey = `${message.id}-${message.role}-${index}`;

                  // Virtual scrolling: Always render first 5 and last 5 messages
                  // Virtualize messages in the middle for performance
                  const isInitialVisible = index < INITIAL_VISIBLE_MESSAGES || index >= messages.length - INITIAL_VISIBLE_MESSAGES;

                  return (
                    <VirtualMessage
                      key={uniqueKey}
                      initialVisible={isInitialVisible}
                      rootMargin={MESSAGE_PRELOAD_MARGIN}
                      defaultHeight={message.role === 'user' ? USER_MESSAGE_HEIGHT : ASSISTANT_MESSAGE_HEIGHT}
                    >
                      {message.role === 'user' ? (
                        <SimpleMessage content={message.content} timestamp={message.timestamp} isUser={true} />
                      ) : message.interactive ? (
                        <EnhancedMessage response={{ success: true, message: message.content, interactive: message.interactive }} timestamp={message.timestamp} onSendQuery={onSendQuery} />
                      ) : message.content === '' ? (
                        // Show loading indicator only for empty messages (actively typing)
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-6">
                          <div className="bg-gray-100 rounded-2xl px-6 py-4">
                            <div className="flex gap-2">
                              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <SimpleMessage
                          content={message.content}
                          timestamp={message.timestamp}
                          isUser={false}
                          messageId={message.id}
                           onFeedback={isTyping ? undefined : submitFeedback}
                          feedbackData={getFeedback(message.id)}
                          feedbackLoading={isFeedbackLoading(message.id)}
                        />
                      )}
                    </VirtualMessage>
                  );
                })}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-6 py-4">
                    <div className="flex gap-2">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {limitReached && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mx-auto max-w-4xl mt-4"
            >
              <Card variant="orange" className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900">
                      Your current message allowance has been reached
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Starting another conversation does not reset your allowance. Review your subscription or contact support.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>


        {/* Floating Action Buttons */}
        <AnimatePresence>
          {messages.length > 0 && !showWelcome && (
            <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-2">
                {userScrolledUp && (loading || isTyping) && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    onClick={() => {
                      setUserScrolledUp(false);
                      scrollToBottom(true);
                    }}
                    className="p-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </motion.button>
                )}

                {(loading || isTyping) && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    onClick={onStopTyping}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                    title="Stop generating"
                  >
                    <Square className="w-4 h-4 fill-gray-700" />
                    <span className="text-sm font-medium">Stop generating</span>
                  </motion.button>
                )}

                {userScrolledUp && !loading && !isTyping && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    onClick={() => {
                      setUserScrolledUp(false);
                      scrollToBottom(true);
                    }}
                    className="p-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>

        <div role="status" aria-live="polite" className="sr-only">{loading ? 'Loading conversation' : isTyping ? 'Career AI is responding' : 'Ready'}</div>
        {historyError && <div role="alert" className="p-3 text-red-700">{historyError} <button onClick={retryHistory} className="underline">Retry history</button></div>}
        {failure && <p role="alert" className="p-3 text-red-700">{failure}</p>}
        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                rows={2}
                aria-label="Message Career AI"
                maxLength={MAX_INPUT_LENGTH}
                aria-describedby="career-message-help"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSendMessage(); } }}
                placeholder={limitReached ? "Message limit reached" : (showWelcome ? "Ask me anything about your career..." : "Type your message...")}
                disabled={loading || isTyping || limitReached}
                className="w-full px-5 py-4 pr-16 resize-y text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={onSendMessage}
                  disabled={loading || isTyping || !input.trim() || limitReached}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 px-2">
              <p id="career-message-help" className="text-xs text-gray-500">
                {input.length}/{MAX_INPUT_LENGTH} characters. Shift+Enter for a new line. Career AI may generate inaccurate information. Please verify important details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAssistantContainer;
