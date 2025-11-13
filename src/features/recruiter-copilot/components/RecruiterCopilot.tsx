import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, ArrowDown } from 'lucide-react';
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
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    const isScrollable = container.scrollHeight > container.clientHeight;
    if (isScrollable && isUserAtBottom()) {
      setUserScrolledUp(false);
    } else if (isScrollable && !isUserAtBottom()) {
      setUserScrolledUp(true);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

    try {
      // Get recruiter ID from user context
      const recruiterId = user?.id || 'demo-recruiter';
      
      const response = await recruiterIntelligenceEngine.processQuery(
        queryToSend,
        recruiterId
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date().toISOString(),
        interactive: response.interactive
      };

      setMessages(prev => [...prev, assistantMessage]);
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

      {/* Scroll to Bottom Button */}
      {userScrolledUp && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-44 md:bottom-32 right-4 md:right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        >
          <ArrowDown size={20} />
        </button>
      )}

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
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
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
