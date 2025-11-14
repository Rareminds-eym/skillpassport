import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, ArrowDown, Square } from 'lucide-react';
import { recruiterIntelligenceEngine } from '../services/recruiterIntelligenceEngine';
import { recruiterWelcomeConfig, recruiterChatConfig } from '../config/recruiterConfig';
import { useAuth } from '../../../context/AuthContext';
import { CandidateInsightCard } from './RecruiterCards';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interactive?: any;
}

const RecruiterCopilot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);

  const scrollToBottom = (force = false) => {
    if (force || !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
      isScrollingRef.current = true;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
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
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleWheel = () => {
      if (isTyping) {
        userInteractedRef.current = true;
        isScrollingRef.current = true;
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      }
    };

    const handleTouchMove = () => {
      if (isTyping) {
        userInteractedRef.current = true;
        isScrollingRef.current = true;
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isTyping]);

  const stopTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
    setLoading(false);
    setAutoScrollEnabled(true);
    userInteractedRef.current = false;
    isScrollingRef.current = false;
  };

  const typeText = (fullText: string, messageId: string) => new Promise<void>((resolve) => {
    setIsTyping(true);
    setAutoScrollEnabled(true);
    userInteractedRef.current = false;
    isScrollingRef.current = false;
    let i = 0;
    const baseDelay = 14;
    let stopped = false;

    const step = () => {
      if (stopped || typingTimerRef.current === null) {
        setIsTyping(false);
        resolve();
        return;
      }

      i = Math.min(i + 1, fullText.length);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullText.slice(0, i) } : m));
      
      if (!userInteractedRef.current && !isScrollingRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        });
      }

      if (i < fullText.length) {
        const prevChar = fullText[i - 1];
        let delay = baseDelay;
        if (prevChar === '.' || prevChar === '!' || prevChar === '?') delay = 140;
        else if (prevChar === ',' || prevChar === ';' || prevChar === ':') delay = 80;
        else if (prevChar === '\n') delay = 60;
        typingTimerRef.current = window.setTimeout(step, delay);
      } else {
        setIsTyping(false);
        typingTimerRef.current = null;
        resolve();
      }
    };

    typingTimerRef.current = window.setTimeout(step, baseDelay);
  });

  const handleSend = async (customQuery?: string) => {
    const queryToSend = customQuery || input.trim();
    if (!queryToSend || loading) return;

    setShowWelcome(false);
    setInput('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setUserScrolledUp(false);

    try {
      // Get recruiter ID from user context
      const recruiterId = user?.id || 'demo-recruiter';
      
      const response = await recruiterIntelligenceEngine.processQuery(
        queryToSend,
        recruiterId
      );

      const fullText = response.message || 'I apologize, but I could not generate a response.';
      const id = (Date.now() + 1).toString();
      
      const assistantMessage: Message = {
        id,
        role: 'assistant',
        content: fullText,
        timestamp: new Date().toISOString(),
        interactive: response.interactive
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUserScrolledUp(false);
      setLoading(false);

      // Skip typing animation if we have interactive elements
      if (!response.interactive?.cards || response.interactive.cards.length === 0) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: '' } : m));
        await typeText(fullText, id);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowWelcome(true);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            💼 Talent Scout
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered talent discovery assistant
          </p>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 pb-40 space-y-6"
      >
        {showWelcome && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {recruiterWelcomeConfig.title}
              </h2>
              <p className="text-gray-600 text-lg">
                {recruiterWelcomeConfig.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {recruiterWelcomeConfig.quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.query)}
                  className={`p-4 rounded-xl ${action.gradient} transition-all hover:scale-105 shadow-sm hover:shadow-md text-left`}
                >
                  <action.icon size={24} className="mb-2" />
                  <span className="text-sm font-semibold block">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-md'
                } px-6 py-4`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Render interactive cards */}
                {message.role === 'assistant' && message.interactive?.cards && (
                  <div className="mt-4 space-y-3">
                    {message.interactive.cards.map((card: any, idx: number) => {
                      // Only render candidate insight cards
                      if (card.type === 'candidate-insight') {
                        return <CandidateInsightCard key={idx} card={card.data} />;
                      }
                      // Skip unsupported card types for now
                      return null;
                    })}
                  </div>
                )}

                {/* Suggestions */}
                {message.role === 'assistant' && message.interactive?.suggestions && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.interactive.suggestions.map((suggestion: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(suggestion)}
                        className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-bl-sm shadow-md px-6 py-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Buttons - ChatGPT style */}
      <AnimatePresence>
        {messages.length > 0 && !showWelcome && (
          <div className="fixed bottom-44 md:bottom-32 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-2">
              {/* Scroll Down Button - Shows when user scrolled up during typing */}
              {userScrolledUp && (loading || isTyping) && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.15,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  onClick={() => {
                    setUserScrolledUp(false);
                    setAutoScrollEnabled(true);
                    userInteractedRef.current = false;
                    scrollToBottom(true);
                  }}
                  className="p-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 ease-out flex items-center justify-center group"
                  title="Scroll to bottom"
                >
                  <ArrowDown className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors duration-150" />
                </motion.button>
              )}

              {/* Stop Generating Button - Shows during loading/typing */}
              {(loading || isTyping) && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.15,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  onClick={stopTyping}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 ease-out flex items-center gap-2 group"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-gray-700 group-hover:fill-gray-900 transition-all duration-150" />
                  <span className="text-sm font-medium">Stop generating</span>
                </motion.button>
              )}

              {/* Scroll to Bottom Only - Shows when scrolled up but NOT typing */}
              {userScrolledUp && !loading && !isTyping && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.15,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  onClick={() => {
                    setUserScrolledUp(false);
                    setAutoScrollEnabled(true);
                    userInteractedRef.current = false;
                    scrollToBottom(true);
                  }}
                  className="p-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-150 ease-out flex items-center justify-center"
                  title="Scroll to bottom"
                >
                  <ArrowDown className="w-5 h-5 transition-transform duration-150" />
                </motion.button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 px-4 md:px-6 py-4 z-30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={recruiterChatConfig.placeholder}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
              disabled={loading || isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || isTyping}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {recruiterChatConfig.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCopilot;
