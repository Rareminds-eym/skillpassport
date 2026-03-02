/**
 * Career Assistant Component
 * 
 * Main chat interface for Career AI assistant.
 * Refactored with optimized React patterns for better performance.
 * 
 * @author Senior React Developer
 * @pattern Component Composition & Performance Optimization
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Send,
  Mic,
  Paperclip,
  X,
  ArrowDown,
  Square,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { streamCareerChat } from '../services/careerWorkerService';
import { useAuth } from '../../../context/AuthContext';
import { useCareerConversations, ConversationMessage } from '../hooks/useCareerConversations';
import { useAIFeedback, AIFeedback } from '../hooks/useAIFeedback';
import { ConversationSidebar } from './ConversationSidebar';
import { EnhancedMessage, SimpleMessage } from './EnhancedMessage';
import CareerAIToolsGrid from '../../../components/shared/CareerAIToolsGrid';

// Import optimized hooks
import { useOptimizedMessages, Message } from '../hooks/useOptimizedMessages';
import { useSmartScroll } from '../hooks/useSmartScroll';
import { useConversationSwitcher } from '../hooks/useConversationSwitcher';
import { VirtualMessage } from '../hooks/useVirtualMessage';

// Import Context Provider
import { CareerAssistantProvider, useCareerAssistantContext } from '../context/CareerAssistantContext';

// Import constants
import {
  INITIAL_VISIBLE_MESSAGES,
  MESSAGE_PRELOAD_MARGIN,
  USER_MESSAGE_HEIGHT,
  ASSISTANT_MESSAGE_HEIGHT,
  MIN_MESSAGE_INTERVAL_MS,
  MAX_INPUT_LENGTH,
} from '../constants';

/**
 * Career Assistant Container
 * Manages all state and provides it to child components via Context
 */
const CareerAssistantContainer: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // ==================== HOOKS ====================
  
  // Conversation management
  const {
    conversations,
    currentConversation,
    loading: conversationsLoading,
    fetchConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    currentConversationId,
    setCurrentConversationId,
    hasMore,
    loadMore,
  } = useCareerConversations();

  // AI Feedback
  const {
    submitFeedback,
    loadFeedback,
    getFeedback,
    isLoading: isFeedbackLoading
  } = useAIFeedback();

  // Optimized message management
  const {
    messages,
    setMessages,
    clearMessages,
    replaceMessages,
  } = useOptimizedMessages();

  // Smart scroll behavior
  const {
    messagesEndRef,
    messagesContainerRef,
    userScrolledUp,
    scrollToBottom,
    handleScroll,
    setUserScrolledUp,
  } = useSmartScroll([messages]);

  // ==================== STATE ====================
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [autoSendQuery, setAutoSendQuery] = useState(false);
  
  // Sidebar state - collapsed on mobile by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // ==================== REFS ====================
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSendTimeRef = useRef<number>(0); // Rate limiting

  // Conversation switching with race condition prevention
  const {
    handleSelectConversation: selectConversation,
    handleNewConversation: newConversation,
  } = useConversationSwitcher({
    loadConversation,
    onMessagesCleared: clearMessages,
    onWelcomeStateChange: setShowWelcome,
  });

  // ==================== EFFECTS ====================
  
  /**
   * Load conversation messages when currentConversation changes
   * Uses replaceMessages from optimized hook
   */
  useEffect(() => {
    if (currentConversation?.messages) {
      const loadedMessages: Message[] = currentConversation.messages.map((msg: ConversationMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      replaceMessages(loadedMessages);
      setShowWelcome(false);
    } else if (currentConversation === null && currentConversationId === null) {
      clearMessages();
      setShowWelcome(true);
    }
  }, [currentConversation, currentConversationId, replaceMessages, clearMessages]);

  /**
   * Auto-focus input on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Handle query from navigation state (e.g., from other pages)
   */
  useEffect(() => {
    const state = location.state as { query?: string } | null;
    if (state?.query && messages.length === 0) {
      setInput(state.query);
      setAutoSendQuery(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, messages.length]);

  // ==================== HANDLERS ====================
  
  /**
   * Stop AI response generation
   * Aborts the current request and cleans up state
   * FIX: Remove empty assistant messages when stopping
   */
  const stopTyping = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Remove any empty assistant messages (loading indicators)
    setMessages(prev => prev.filter(m => 
      !(m.role === 'assistant' && m.content.trim() === '')
    ));
    
    setIsTyping(false);
    setLoading(false);
    userInteractedRef.current = false;
  }, [setMessages]);

  /**
   * Send user message to AI
   * Handles streaming response and conversation management
   * FIX: Wrapped in useCallback with proper dependencies
   * FIX: Added rate limiting and input validation
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    // Rate limiting check
    const now = Date.now();
    if (now - lastSendTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      console.warn('Please wait before sending another message');
      return;
    }

    // Input validation
    const trimmedInput = input.trim();
    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      console.error(`Message too long. Maximum ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    lastSendTimeRef.current = now;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = trimmedInput;
    setInput('');
    setLoading(true);
    setShowWelcome(false);
    setUserScrolledUp(false);
    userInteractedRef.current = false;

    // Track the temporary message ID for cleanup
    let tempMessageId: string | null = null;
    
    try {
      const studentId = user?.id;
      if (!studentId) {
        throw new Error('Please log in to use Career AI');
      }

      const id = (Date.now() + 1).toString();
      tempMessageId = id; // Track for cleanup
      
      const aiMessage: Message = {
        id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      setIsTyping(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const result = await streamCareerChat(
        userInput,
        currentConversationId,
        selectedChips,
        (chunk: string) => {
          setMessages(prev => prev.map(m => 
            m.id === id ? { ...m, content: m.content + chunk } : m
          ));
          
          if (!userInteractedRef.current) {
            requestAnimationFrame(() => {
              if (!userInteractedRef.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
              }
            });
          }
        },
        abortControllerRef.current.signal
      );
      
      if (!result.success && result.error) {
        // Remove the empty loading message before showing error
        setMessages(prev => prev.filter(m => m.id !== id));
        tempMessageId = null; // Clear since we removed it
        throw new Error(result.error);
      }

      // Success - update message with backend's messageId
      tempMessageId = null; // Clear since message is now permanent
      
      if (result.conversationId && result.conversationId !== currentConversationId) {
        setCurrentConversationId(result.conversationId);
        fetchConversations();
      }

      // Update message with backend's messageId, interactive content and metadata
      setMessages(prev => prev.map(m => 
        m.id === id ? { 
          ...m, 
          id: result.messageId || m.id,
          interactive: result.interactive,
          intent: result.intent,
          intentConfidence: result.intentConfidence,
          phase: result.phase
        } : m
      ));
    } catch (error: any) {
      console.error('Career AI Error:', error);
      
      // Check if error is from abort (user stopped generation)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        // Remove any temporary loading message
        if (tempMessageId) {
          setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        }
        return;
      }
      
      // Remove temporary loading message if it still exists
      if (tempMessageId) {
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${error?.message || 'Unknown error'}. Please try again!`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      abortControllerRef.current = null;
    }
  }, [input, loading, user?.id, currentConversationId, selectedChips, setMessages, setUserScrolledUp, messagesEndRef, setCurrentConversationId, fetchConversations]);

  /**
   * Auto-send query if set from navigation
   * FIX: Added handleSend to dependency array
   */
  useEffect(() => {
    if (autoSendQuery && input && !loading) {
      setAutoSendQuery(false);
      const timer = setTimeout(() => {
        handleSend();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoSendQuery, input, loading, handleSend]);

  /**
   * Handle quick action button clicks
   */
  const handleQuickAction = useCallback((prompt: string, label: string) => {
    setInput(prompt);
    setShowWelcome(false);
    if (!selectedChips.includes(label)) {
      setSelectedChips(prev => [...prev, label]);
    }
    inputRef.current?.focus();
  }, [selectedChips]);

  /**
   * Remove a selected chip
   */
  const removeChip = useCallback((label: string) => {
    setSelectedChips(prev => prev.filter(chip => chip !== label));
  }, []);

  /**
   * Handle query from interactive elements
   * FIX: Added handleSend to dependency array
   */
  const handleSendQuery = useCallback((query: string) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  }, [handleSend]);

  /**
   * Create new conversation
   * Uses optimized hook that prevents race conditions
   */
  const handleNewConversation = useCallback(() => {
    createNewConversation();
    newConversation();
    setSelectedChips([]);
  }, [createNewConversation, newConversation]);

  /**
   * Handle feedback submission for AI responses
   * Finds the corresponding user message for context
   */
  const handleFeedback = useCallback(async (
    messageId: string, 
    thumbsUp: boolean,
    rating?: number,
    feedbackText?: string
  ) => {
    if (!currentConversationId) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const aiMessage = messages[messageIndex];
    const userMessage = messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');

    if (!userMessage) return;

    const feedback: AIFeedback = {
      conversationId: currentConversationId,
      messageId: messageId,
      userMessage: userMessage.content,
      aiResponse: aiMessage.content,
      detectedIntent: aiMessage.intent,
      intentConfidence: aiMessage.intentConfidence,
      conversationPhase: aiMessage.phase
    };

    await submitFeedback(feedback, thumbsUp, rating, feedbackText);
  }, [currentConversationId, messages, submitFeedback]);

  /**
   * Load feedback when conversation changes
   */
  useEffect(() => {
    if (currentConversationId) {
      loadFeedback(currentConversationId);
    }
  }, [currentConversationId, loadFeedback]);


  // ==================== CONTEXT VALUE ====================
  
  const contextValue = {
    // Conversation state
    conversations,
    currentConversation,
    currentConversationId,
    conversationsLoading,
    hasMore,
    
    // Message state
    messages,
    loading,
    isTyping,
    
    // UI state
    showWelcome,
    selectedChips,
    sidebarCollapsed,
    
    // Conversation handlers
    onSelectConversation: selectConversation,
    onNewConversation: handleNewConversation,
    onDeleteConversation: deleteConversation,
    onLoadMore: loadMore,
    
    // Message handlers
    onSendMessage: handleSend,
    onSendQuery: handleSendQuery,
    onStopTyping: stopTyping,
    
    // UI handlers
    onQuickAction: handleQuickAction,
    onRemoveChip: removeChip,
    onToggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
    
    // Input state
    input,
    setInput,
    
    // Feedback handlers
    onFeedback: handleFeedback,
    getFeedback,
    isFeedbackLoading,
    
    // Scroll state
    userScrolledUp,
    scrollToBottom,
    setUserScrolledUp,
    messagesEndRef,
    messagesContainerRef,
    handleScroll,
  };

  // ==================== RENDER ====================
  
  return (
    <CareerAssistantProvider value={contextValue}>
      <CareerAssistantUI />
    </CareerAssistantProvider>
  );
};

/**
 * Career Assistant UI Component
 * Pure presentational component that consumes context
 */
const CareerAssistantUI: React.FC = () => {
  const {
    // UI state
    showWelcome,
    selectedChips,
    sidebarCollapsed,
    messages,
    loading,
    isTyping,
    input,
    
    // Handlers
    onToggleSidebar,
    onQuickAction,
    onRemoveChip,
    onSendMessage,
    setInput,
    
    // Scroll
    messagesContainerRef,
    messagesEndRef,
    handleScroll,
    userScrolledUp,
    scrollToBottom,
    onStopTyping,
    onSendQuery,
    onFeedback,
    getFeedback,
    isFeedbackLoading,
    setUserScrolledUp,
  } = useCareerAssistantContext();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const userInteractedRef = useRef(false);

  /**
   * Auto-focus input on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Conversation History Sidebar */}
      <ConversationSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto relative">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden absolute top-4 left-4 z-10">
          <button
            onClick={onToggleSidebar}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          {showWelcome && messages.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl font-bold text-gray-900 mb-4">
                  Welcome to Career AI
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Get personalized career guidance, job matching, skill analysis, and interview prep. Not sure where to start?
                </motion.p>
              </div>

              <CareerAIToolsGrid onAction={onQuickAction} variant="full" animated={true} />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-sm text-gray-500 mt-8">
                💡 Click a card above or type your question below to get started
              </motion.div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {selectedChips.length === 0 && messages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 text-center">Quick Actions:</p>
                  <CareerAIToolsGrid onAction={onQuickAction} variant="compact" animated={true} />
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
                          onFeedback={onFeedback}
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
                      userInteractedRef.current = false;
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
                      userInteractedRef.current = false;
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

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {selectedChips.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mb-3">
                {selectedChips.map((chip) => (
                  <motion.div
                    key={chip}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                  >
                    <span>{chip}</span>
                    <button onClick={() => onRemoveChip(chip)} className="hover:bg-gray-200 rounded-full p-0.5 transition-colors" aria-label={`Remove ${chip}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                placeholder={showWelcome ? "Ask me anything about your career..." : "Type your message..."}
                disabled={loading || isTyping}
                className="w-full px-5 py-4 pr-32 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" title="Attach file">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" title="Voice message">
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={onSendMessage}
                  disabled={loading || isTyping || !input.trim()}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 px-2">
              <p className="text-xs text-gray-500">
                Career AI may generate inaccurate information. Please verify important details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAssistantContainer;
