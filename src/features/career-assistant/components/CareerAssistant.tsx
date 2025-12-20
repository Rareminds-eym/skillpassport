import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Send,
  Briefcase, 
  Target, 
  BookOpen, 
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  Lightbulb,
  Plus,
  Mic,
  Paperclip,
  X,
  ArrowDown,
  Square,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { streamCareerChat } from '../services/careerEdgeFunctionService';
import { useAuth } from '../../../context/AuthContext';
import { useCareerConversations, ConversationMessage } from '../hooks/useCareerConversations';
import { useAIFeedback, AIFeedback } from '../hooks/useAIFeedback';
import { ConversationSidebar } from './ConversationSidebar';
import { EnhancedMessage, SimpleMessage } from './EnhancedMessage';
import { EnhancedAIResponse } from '../types/interactive';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interactive?: EnhancedAIResponse['interactive'];
  intent?: string;
  intentConfidence?: string;
  phase?: string;
}

const CareerAssistant: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
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
  } = useCareerConversations();

  // AI Feedback hook
  const {
    submitFeedback,
    loadFeedback,
    getFeedback,
    isLoading: isFeedbackLoading
  } = useAIFeedback();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [autoSendQuery, setAutoSendQuery] = useState(false);
  // Start with sidebar expanded on desktop, collapsed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    if (currentConversation?.messages) {
      const loadedMessages: Message[] = currentConversation.messages.map((msg: ConversationMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
      setShowWelcome(false);
    }
  }, [currentConversation]);

  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [userScrolledUp]);

  const isUserAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const currentScrollTop = container.scrollTop;
    const scrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;
    
    const isScrollable = container.scrollHeight > container.clientHeight;
    
    if (isTyping) {
      userInteractedRef.current = true;
    }
    
    if (isScrollable && isUserAtBottom()) {
      setUserScrolledUp(false);
    } else if (isScrollable && scrollingUp && !isUserAtBottom()) {
      setUserScrolledUp(true);
    }
  };

  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom();
    }
    const timer = setTimeout(() => {
      if (isUserAtBottom()) {
        setUserScrolledUp(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom, userScrolledUp]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const state = location.state as { query?: string } | null;
    if (state?.query && messages.length === 0) {
      setInput(state.query);
      setAutoSendQuery(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, messages.length]);

  useEffect(() => {
    if (autoSendQuery && input && !loading) {
      setAutoSendQuery(false);
      const timer = setTimeout(() => {
        handleSend();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoSendQuery, input, loading]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const stopTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
    setLoading(false);
    userInteractedRef.current = false;
  };


  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);
    setShowWelcome(false);
    setUserScrolledUp(false);
    userInteractedRef.current = false;

    try {
      const studentId = user?.id;
      if (!studentId) {
        throw new Error('Please log in to use Career AI');
      }

      const id = (Date.now() + 1).toString();
      
      const aiMessage: Message = {
        id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      setIsTyping(true);

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
        }
      );
      
      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      if (result.conversationId && result.conversationId !== currentConversationId) {
        setCurrentConversationId(result.conversationId);
        fetchConversations();
      }

      // Update message with backend's messageId, interactive content and metadata
      // This ensures feedback is saved with the correct ID that matches the database
      setMessages(prev => prev.map(m => 
        m.id === id ? { 
          ...m, 
          id: result.messageId || m.id, // Use backend's messageId for feedback matching
          interactive: result.interactive,
          intent: result.intent,
          intentConfidence: result.intentConfidence,
          phase: result.phase
        } : m
      ));
    } catch (error: any) {
      console.error('Career AI Error:', error);
      
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
    }
  };

  const handleQuickAction = (prompt: string, label: string) => {
    setInput(prompt);
    setShowWelcome(false);
    if (!selectedChips.includes(label)) {
      setSelectedChips(prev => [...prev, label]);
    }
    inputRef.current?.focus();
  };

  const removeChip = (label: string) => {
    setSelectedChips(prev => prev.filter(chip => chip !== label));
  };

  const handleSendQuery = (query: string) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  const handleNewConversation = () => {
    createNewConversation();
    setMessages([]);
    setShowWelcome(true);
    setSelectedChips([]);
  };

  // Handle feedback submission
  const handleFeedback = useCallback(async (
    messageId: string, 
    thumbsUp: boolean,
    rating?: number,
    feedbackText?: string
  ) => {
    if (!currentConversationId) return;

    // Find the message and its preceding user message
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

  // Load feedback when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadFeedback(currentConversationId);
    }
  }, [currentConversationId, loadFeedback]);

  const handleSelectConversation = async (id: string) => {
    await loadConversation(id);
  };

  const quickActions = [
    { id: 'jobs', label: 'Find Jobs', icon: Briefcase, prompt: 'What jobs match my skills and experience?', color: 'bg-amber-100 hover:bg-amber-200 text-amber-700', iconBg: 'bg-amber-200' },
    { id: 'skills', label: 'Skill Gap Analysis', icon: Target, prompt: 'Analyze my skill gaps for my target career', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700', iconBg: 'bg-blue-200' },
    { id: 'interview', label: 'Interview Prep', icon: BookOpen, prompt: 'Help me prepare for upcoming interviews', color: 'bg-green-100 hover:bg-green-200 text-green-700', iconBg: 'bg-green-200' },
    { id: 'resume', label: 'Resume Review', icon: FileText, prompt: 'Review my resume and suggest improvements', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700', iconBg: 'bg-purple-200' },
    { id: 'learning', label: 'Learning Path', icon: GraduationCap, prompt: 'Create a learning roadmap for my career goals', color: 'bg-pink-100 hover:bg-pink-200 text-pink-700', iconBg: 'bg-pink-200' },
    { id: 'career', label: 'Career Guidance', icon: TrendingUp, prompt: 'What career paths are best suited for me?', color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700', iconBg: 'bg-indigo-200' },
    { id: 'network', label: 'Networking Tips', icon: Users, prompt: 'Give me networking strategies for my field', color: 'bg-teal-100 hover:bg-teal-200 text-teal-700', iconBg: 'bg-teal-200' },
    { id: 'advice', label: 'Career Advice', icon: Lightbulb, prompt: 'I need career advice and guidance', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700', iconBg: 'bg-orange-200' },
  ];


  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Conversation History Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        loading={conversationsLoading}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto relative">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden absolute top-4 left-4 z-10">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.prompt, action.label)}
                    className={`${action.color} rounded-2xl p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md group relative overflow-hidden`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${action.iconBg} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <Plus className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{action.label}</h3>
                  </motion.button>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-sm text-gray-500">
                💡 Click a card above or type your question below to get started
              </motion.div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {selectedChips.length === 0 && messages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 text-center">Quick Actions:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action.prompt, action.label)}
                        className={`${action.color} rounded-xl p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`${action.iconBg} w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="font-semibold text-sm">{action.label}</h3>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message) => (
                  message.role === 'user' ? (
                    <SimpleMessage key={message.id} content={message.content} timestamp={message.timestamp} isUser={true} />
                  ) : message.interactive ? (
                    <EnhancedMessage key={message.id} response={{ success: true, message: message.content, interactive: message.interactive }} timestamp={message.timestamp} onSendQuery={handleSendQuery} />
                  ) : message.content === '' && isTyping ? (
                    <motion.div key={message.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-6">
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
                      key={message.id} 
                      content={message.content} 
                      timestamp={message.timestamp} 
                      isUser={false}
                      messageId={message.id}
                      onFeedback={handleFeedback}
                      feedbackData={getFeedback(message.id)}
                      feedbackLoading={isFeedbackLoading(message.id)}
                    />
                  )
                ))}
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
                    onClick={stopTyping}
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
                    <button onClick={() => removeChip(chip)} className="hover:bg-gray-200 rounded-full p-0.5 transition-colors" aria-label={`Remove ${chip}`}>
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
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
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
                  onClick={handleSend}
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

export default CareerAssistant;
