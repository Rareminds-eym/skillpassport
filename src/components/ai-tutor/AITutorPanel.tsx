import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Brain,
  Sparkles,
  BookOpen,
  Send,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  RefreshCw,
  History,
  Plus,
  LogIn,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorChat } from '../../hooks/useTutorChat';
// @ts-ignore - AuthContext is a JSX file
import { useAuth } from '../../context/AuthContext';

interface LessonContext {
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
}

interface AITutorPanelProps {
  courseId: string;
  courseName?: string;
  lessonContext?: LessonContext;
  defaultExpanded?: boolean;
}

const AITutorPanel: React.FC<AITutorPanelProps> = ({
  courseId,
  courseName = 'Course',
  lessonContext,
  defaultExpanded = false
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 1 | -1>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const isAuthenticated = !!user;

  const {
    messages,
    isLoading,
    isStreaming,
    isReasoning,
    currentReasoning,
    error,
    conversationId,
    conversations,
    suggestedQuestions,
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    submitFeedback,
    refreshConversations,
    refreshSuggestions
  } = useTutorChat({ 
    courseId, 
    lessonId: lessonContext?.lessonId 
  });

  // Keyboard shortcut: Cmd/Ctrl + K to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReasoning]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded, showHistory]);

  // Refresh suggestions when lesson changes
  useEffect(() => {
    if (lessonContext?.lessonId) {
      refreshSuggestions();
    }
  }, [lessonContext?.lessonId, refreshSuggestions]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (index: number, rating: 1 | -1) => {
    await submitFeedback(index, rating);
    setFeedbackGiven(prev => ({ ...prev, [index]: rating }));
  };

  const handleDeleteConversation = async (convId: string) => {
    setIsDeleting(true);
    try {
      await deleteConversation(convId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Collapsed state - Icon strip
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex flex-col items-center gap-2 bg-gradient-to-b from-violet-600 to-purple-700 text-white px-3 py-4 rounded-l-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:px-4"
          aria-label="Open AI Tutor"
        >
          <div className="relative">
            <Brain className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-violet-600 animate-pulse" />
          </div>
          <span className="text-xs font-medium writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
            AI Tutor
          </span>
          <Sparkles className="w-4 h-4 opacity-60" />
        </button>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            <p className="font-medium">AI Course Tutor</p>
            <p className="text-gray-400 text-xs">Press ⌘K to open</p>
          </div>
        </div>
      </motion.div>
    );
  }


  // History view
  if (showHistory) {
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
      >
        {/* History Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
          <button
            onClick={() => setShowHistory(false)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-800">Conversation History</h3>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            className="w-full p-3 mb-3 border-2 border-dashed border-violet-300 rounded-xl text-violet-600 hover:border-violet-500 hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>

          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-gray-400 text-sm">Start chatting to create history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => (
                <div key={conv.id} className="relative">
                  {deleteConfirmId === conv.id ? (
                    <div className="p-3 rounded-xl border border-red-300 bg-red-50">
                      <p className="text-sm text-red-700 mb-2">Delete this conversation permanently?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteConversation(conv.id)}
                          disabled={isDeleting}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          loadConversation(conv.id);
                          setShowHistory(false);
                        }}
                        className={`flex-1 min-w-0 p-3 text-left rounded-xl border transition-all ${
                          conversationId === conv.id
                            ? 'border-violet-500 bg-violet-50 shadow-sm'
                            : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-gray-800 truncate text-sm">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conv.messages.length} messages · {conv.updatedAt.toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Expanded chat panel
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Course Tutor</h3>
              <p className="text-xs text-violet-200">Powered by Grok</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                refreshConversations();
                setShowHistory(true);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Collapse (Esc)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Indicator */}
        {lessonContext?.lessonTitle && (
          <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-violet-200">Currently viewing:</span>
            </div>
            <p className="text-sm font-medium truncate mt-0.5">{lessonContext.lessonTitle}</p>
            {lessonContext.moduleTitle && (
              <p className="text-xs text-violet-200 truncate">{lessonContext.moduleTitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!isAuthenticated ? (
          /* Login Required State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Login Required</h4>
            <p className="text-sm text-gray-600 mb-6 max-w-xs">
              Please log in to use the AI Tutor and get personalized help with your course.
            </p>
            <a
              href="/login"
              className="px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium text-sm"
            >
              Log In
            </a>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Hi! I'm your AI Tutor</h4>
            <p className="text-sm text-gray-600 mb-6 max-w-xs">
              I'm here to help you understand {courseName}. Ask me anything about the course material!
            </p>

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2 font-medium">Try asking:</p>
                <div className="space-y-2">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="w-full p-3 text-left text-sm bg-white border border-gray-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all group"
                    >
                      <span className="text-gray-700 group-hover:text-violet-700">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = !isUser && index === messages.length - 1;

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-violet-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      
                      {/* Reasoning indicator */}
                      {isReasoning && isLastAssistant && !msg.content && (
                        <div className="flex items-center gap-2 text-violet-400">
                          <Brain className="w-4 h-4 animate-pulse" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      )}
                      
                      {/* Loading dots */}
                      {isStreaming && isLastAssistant && !msg.content && !isReasoning && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                      
                      {/* Feedback buttons */}
                      {!isUser && msg.content && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(index, 1)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                              feedbackGiven[index] === 1 ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(index, -1)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                              feedbackGiven[index] === -1 ? 'text-red-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reasoning Preview */}
      <AnimatePresence>
        {isReasoning && currentReasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-violet-50 border-t border-violet-200 overflow-hidden"
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-violet-700 mb-1">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-medium">AI is reasoning...</span>
              </div>
              <p className="text-xs text-violet-600 line-clamp-2 italic">
                {currentReasoning.slice(-150)}...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => window.location.reload()} className="p-1 hover:bg-red-100 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Ask about this lesson..." : "Please log in to chat"}
            disabled={isStreaming || !isAuthenticated}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !isAuthenticated}
            className="w-11 h-11 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press ⌘K to toggle • Enter to send
        </p>
      </div>
    </motion.div>
  );
};

export default AITutorPanel;
