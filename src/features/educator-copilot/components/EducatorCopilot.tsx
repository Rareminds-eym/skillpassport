import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, ArrowDown, Square } from 'lucide-react';
import { educatorIntelligenceEngine } from '../services/educatorIntelligenceEngine';
import { educatorWelcomeConfig, educatorChatConfig } from '../config/educatorConfig';
import { useAuth } from '../../../context/AuthContext';
import { StudentInsightCard } from './EducatorCards';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interactive?: any;
}

const EducatorCopilot: React.FC = () => {
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

    try {
      const educatorId = user?.id || 'demo-educator';
      
      const result = await educatorIntelligenceEngine.processQuery(
        userInput,
        educatorId
      );

      const fullText = result.success ? (result.message || 'No response') : (result.error || 'An error occurred');
      const id = (Date.now() + 1).toString();
      
      const aiMessage: Message = {
        id,
        role: 'assistant',
        content: fullText,
        timestamp: new Date().toISOString(),
        interactive: result.interactive
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setUserScrolledUp(false);
      setLoading(false);

      // Skip typing animation if we have interactive elements
      if (!result.interactive?.cards || result.interactive.cards.length === 0) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: '' } : m));
        await typeText(fullText, id);
      }
    } catch (error) {
      console.error('Educator AI Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly.",
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

  const handleQuickAction = (query: string) => {
    setInput(query);
    setShowWelcome(false);
    inputRef.current?.focus();
  };

  const handleSendQuery = (query: string) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto bg-white relative">
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        {showWelcome && messages.length === 0 ? (
          // Welcome Screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-gray-900 mb-4"
              >
                {educatorWelcomeConfig.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {educatorWelcomeConfig.subtitle}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {educatorWelcomeConfig.quickActions.map((action, index) => {
                const IconComponent = action.icon as any;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.query)}
                    className={`${action.gradient} rounded-2xl p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md group`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform bg-black/10">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <Plus className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{action.label}</h3>
                  </motion.button>
                );
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-gray-500"
            >
              💡 Click a card above or type your question below to get started
            </motion.div>
          </motion.div>
        ) : (
          // Messages View
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                      message.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Student Insight Cards */}
                    {message.interactive?.cards && message.interactive.cards.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {message.interactive.cards.map((card: any, idx: number) => (
                          <StudentInsightCard
                            key={card.data.studentId || idx}
                            studentId={card.data.studentId}
                            studentName={card.data.studentName}
                            insightType={card.data.insightType}
                            title={card.data.title}
                            description={card.data.description}
                            recommendation={card.data.recommendation}
                            priority={card.data.priority}
                            actionItems={card.data.actionItems}
                            onViewProfile={() => {
                              console.log('View profile:', card.data.studentId);
                              // TODO: Navigate to student profile
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Interactive Elements for AI responses */}
                    {message.interactive?.metadata && (
                      <div className="mt-4 space-y-3">
                        {message.interactive.metadata.encouragement && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-blue-800 text-sm">{message.interactive.metadata.encouragement}</p>
                          </div>
                        )}
                        
                        {message.interactive.metadata.nextSteps && message.interactive.metadata.nextSteps.length > 0 && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">🎯 Next Steps:</h4>
                            <ul className="space-y-1">
                              {message.interactive.metadata.nextSteps.map((step: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {message.interactive?.suggestions && message.interactive.suggestions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.interactive.suggestions.map((suggestion: any) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSendQuery(suggestion.query)}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.interactive?.metadata?.intentHandled && (
                        <span className="ml-2">• {message.interactive.metadata.intentHandled}</span>
                      )}
                    </p>
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
                <div className="bg-gray-100 rounded-2xl px-6 py-4">
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
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

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={educatorChatConfig.placeholder}
              disabled={loading || isTyping}
              className="w-full px-5 py-4 pr-16 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                onClick={handleSend}
                disabled={loading || isTyping || !input.trim()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 px-2">
            <p className="text-xs text-gray-500">{educatorChatConfig.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducatorCopilot;
