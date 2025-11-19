import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Square
} from 'lucide-react';
import { careerIntelligenceEngine } from '../services/careerIntelligenceEngine';
import { useAuth } from '../../../context/AuthContext';
import { EnhancedMessage, SimpleMessage } from './EnhancedMessage';
import { EnhancedAIResponse } from '../types/interactive';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interactive?: EnhancedAIResponse['interactive'];
}

const CareerAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
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
    const threshold = 100; // More forgiving threshold - 100px from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const currentScrollTop = container.scrollTop;
    const scrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;
    
    // Check if content is actually scrollable
    const isScrollable = container.scrollHeight > container.clientHeight;
    
    // Immediately mark that user has manually interacted with scroll
    if (isTyping) {
      userInteractedRef.current = true;
      isScrollingRef.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Mark scrolling as finished after 150ms of no scroll
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    }
    
    // Only show button if content is scrollable, user scrolled up manually, and not at bottom
    if (isScrollable && isUserAtBottom()) {
      setUserScrolledUp(false);
    } else if (isScrollable && scrollingUp && !isUserAtBottom()) {
      setUserScrolledUp(true);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive, but respect user scroll position
    if (!userScrolledUp) {
      scrollToBottom();
    }
    
    // Check scroll position after content loads to hide button if at bottom
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

  // Cleanup any pending typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Detect user scroll interactions more aggressively
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

  // Removed fake typing animation - using real LLM streaming now

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
      
      // Create empty assistant message for streaming
      const aiMessage: Message = {
        id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      setIsTyping(true);

      // Stream response from LLM in real-time
      const result = await careerIntelligenceEngine.processQueryStream(
        userInput,
        studentId,
        (chunk: string) => {
          // Update message content as chunks arrive from LLM
          setMessages(prev => prev.map(m => 
            m.id === id ? { ...m, content: m.content + chunk } : m
          ));
          
          // Auto-scroll if user hasn't scrolled up
          if (!userInteractedRef.current) {
            requestAnimationFrame(() => {
              if (!userInteractedRef.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
              }
            });
          }
        }
      );

      // Update with interactive elements if any
      if (result.interactive) {
        setMessages(prev => prev.map(m => 
          m.id === id ? { ...m, interactive: result.interactive } : m
        ));
      }
    } catch (error) {
      console.error('Career AI Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please make sure your OpenAI API key is configured correctly in the .env file. Try again in a moment!",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      // Clear any pending typing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }
  };

  const handleQuickAction = (prompt: string, label: string) => {
    setInput(prompt);
    setShowWelcome(false);
    // Add chip if not already present
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

  const quickActions = [
    { 
      id: 'jobs', 
      label: 'Find Jobs', 
      icon: Briefcase, 
      prompt: 'What jobs match my skills and experience?',
      color: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
      iconBg: 'bg-amber-200'
    },
    { 
      id: 'skills', 
      label: 'Skill Gap Analysis', 
      icon: Target, 
      prompt: 'Analyze my skill gaps for my target career',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      iconBg: 'bg-blue-200'
    },
    { 
      id: 'interview', 
      label: 'Interview Prep', 
      icon: BookOpen, 
      prompt: 'Help me prepare for upcoming interviews',
      color: 'bg-green-100 hover:bg-green-200 text-green-700',
      iconBg: 'bg-green-200'
    },
    { 
      id: 'resume', 
      label: 'Resume Review', 
      icon: FileText, 
      prompt: 'Review my resume and suggest improvements',
      color: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
      iconBg: 'bg-purple-200'
    },
    { 
      id: 'learning', 
      label: 'Learning Path', 
      icon: GraduationCap, 
      prompt: 'Create a learning roadmap for my career goals',
      color: 'bg-pink-100 hover:bg-pink-200 text-pink-700',
      iconBg: 'bg-pink-200'
    },
    { 
      id: 'career', 
      label: 'Career Guidance', 
      icon: TrendingUp, 
      prompt: 'What career paths are best suited for me?',
      color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
      iconBg: 'bg-indigo-200'
    },
    { 
      id: 'network', 
      label: 'Networking Tips', 
      icon: Users, 
      prompt: 'Give me networking strategies for my field',
      color: 'bg-teal-100 hover:bg-teal-200 text-teal-700',
      iconBg: 'bg-teal-200'
    },
    { 
      id: 'advice', 
      label: 'Career Advice', 
      icon: Lightbulb, 
      prompt: 'I need career advice and guidance',
      color: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
      iconBg: 'bg-orange-200'
    },
  ];

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto bg-white relative">
      {/* Welcome Screen or Messages */}
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
            {/* Header */}
            <div className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-gray-900 mb-4"
              >
                Welcome to Career AI
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                Get personalized career guidance, job matching, skill analysis, and interview prep. 
                Not sure where to start?
              </motion.p>
            </div>

            {/* Quick Action Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
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

            {/* Hint */}
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
            {/* Show quick action cards if no chips selected */}
            {selectedChips.length === 0 && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
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
                  <SimpleMessage
                    key={message.id}
                    content={message.content}
                    timestamp={message.timestamp}
                    isUser={true}
                  />
                ) : message.interactive ? (
                  <EnhancedMessage
                    key={message.id}
                    response={{
                      success: true,
                      message: message.content,
                      interactive: message.interactive
                    }}
                    timestamp={message.timestamp}
                    onSendQuery={handleSendQuery}
                  />
                ) : message.content === '' && isTyping ? (
                  // Show typing indicator for empty streaming message
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start mb-6"
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
                ) : (
                  <SimpleMessage
                    key={message.id}
                    content={message.content}
                    timestamp={message.timestamp}
                    isUser={false}
                  />
                )
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

      {/* Floating Action Buttons - ChatGPT style */}
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

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Selected Chips */}
          {selectedChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {selectedChips.map((chip) => (
                <motion.div
                  key={chip}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                >
                  <span>{chip}</span>
                  <button
                    onClick={() => removeChip(chip)}
                    className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${chip}`}
                  >
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
            
            {/* Action Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Voice message"
              >
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

          {/* Disclaimer only */}
          <div className="mt-2 px-2">
            <p className="text-xs text-gray-500">
              Career AI may generate inaccurate information. Please verify important details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAssistant;
