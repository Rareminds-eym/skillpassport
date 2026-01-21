import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, ArrowDown, Square, Bot, User, Sparkles } from 'lucide-react';
import { universityCounsellingService } from '../services/counsellingService';
import { universityAIConfig } from '../config/universityAIConfig';
import { Message, CounsellingTopic, StudentContext } from '../types';

const UniversityCounselling: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<CounsellingTopic>('general');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userInteractedRef = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);

  // Mock student context (replace with actual data in production)
  const studentContext: StudentContext = {
    name: 'Demo Student',
    department: 'Computer Science',
    year: 3,
    gpa: 3.5,
    courses: ['Data Structures', 'Web Development', 'Database Systems'],
    interests: ['AI/ML', 'Web Development', 'Cloud Computing'],
    goals: ['Software Engineer', 'Tech Entrepreneur'],
  };

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
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const stopTyping = () => {
    setIsTyping(false);
    setLoading(false);
    userInteractedRef.current = false;
    isScrollingRef.current = false;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);
    setShowWelcome(false);
    setUserScrolledUp(false);

    // Detect topic from query
    const detectedTopic = universityCounsellingService.detectTopic(userInput);
    setCurrentTopic(detectedTopic);

    try {
      const id = (Date.now() + 1).toString();

      // Create empty assistant message for streaming
      const aiMessage: Message = {
        id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        topic: detectedTopic,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
      setIsTyping(true);

      // Stream response from LLM
      const result = await universityCounsellingService.processQueryStream(
        userInput,
        detectedTopic,
        studentContext,
        messages,
        (chunk: string) => {
          // Update message content as chunks arrive
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m))
          );

          // Auto-scroll if user hasn't scrolled up
          if (!userInteractedRef.current && !isScrollingRef.current) {
            requestAnimationFrame(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            });
          }
        }
      );

      // Update with suggestions
      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('University AI Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly in your .env file.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
    setShowWelcome(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-6 shadow-lg"
              >
                <Bot className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3"
              >
                {universityAIConfig.welcome.title}
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {universityAIConfig.welcome.subtitle}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            >
              {universityAIConfig.welcome.quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.5 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.query)}
                    className={`${action.gradient} rounded-2xl p-6 text-left transition-all duration-200 shadow-sm hover:shadow-lg group`}
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
              transition={{ delay: 0.8 }}
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
                    className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`rounded-2xl px-6 py-4 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>

                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {message.topic && (
                          <span className="ml-2">• {message.topic} counselling</span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Suggestions */}
            {suggestions.length > 0 && !loading && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}

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
              {userScrolledUp && (loading || isTyping) && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ y: -1 }}
                  onClick={() => {
                    setUserScrolledUp(false);
                    userInteractedRef.current = false;
                    scrollToBottom(true);
                  }}
                  className="p-3 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all"
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
                  onClick={stopTyping}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">Stop generating</span>
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
              placeholder={universityAIConfig.chat.placeholder}
              disabled={loading || isTyping}
              className="w-full px-5 py-4 pr-16 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                onClick={handleSend}
                disabled={loading || isTyping || !input.trim()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 px-2">
            <p className="text-xs text-gray-500">{universityAIConfig.chat.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityCounselling;
