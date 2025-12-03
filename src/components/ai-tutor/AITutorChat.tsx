import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Brain,
  Trash2
} from 'lucide-react';
import { useTutorChat } from '../../hooks/useTutorChat';
import { ChatMessage } from '../../services/tutorService';

interface AITutorChatProps {
  courseId: string;
  lessonId?: string;
  onClose: () => void;
}

const AITutorChat: React.FC<AITutorChatProps> = ({ courseId, lessonId, onClose }) => {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 1 | -1>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    refreshConversations
  } = useTutorChat({ courseId, lessonId });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleFeedback = async (messageIndex: number, rating: 1 | -1) => {
    await submitFeedback(messageIndex, rating);
    setFeedbackGiven(prev => ({ ...prev, [messageIndex]: rating }));
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


  // Render message bubble
  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';
    const isLastAssistant = !isUser && index === messages.length - 1;

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`px-4 py-2 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            {/* Reasoning indicator - AI is thinking */}
            {isReasoning && isLastAssistant && (
              <div className="flex items-center gap-2 text-purple-600">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}
            {/* Loading indicator - waiting for content */}
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
            
            {/* Feedback buttons for assistant messages */}
            {!isUser && msg.content && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(index, 1)}
                  className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                    feedbackGiven[index] === 1 ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleFeedback(index, -1)}
                  className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                    feedbackGiven[index] === -1 ? 'text-red-600' : 'text-gray-400'
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Conversation history sidebar
  if (showHistory) {
    return (
      <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
          <button
            onClick={() => setShowHistory(false)}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-gray-800">Conversation History</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            className="w-full p-3 mb-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
          
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div key={conv.id} className="relative mb-2">
                {deleteConfirmId === conv.id ? (
                  <div className="p-3 rounded-xl border border-red-300 bg-red-50">
                    <p className="text-sm text-red-700 mb-2">Delete this conversation permanently?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteConversation(conv.id)}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <button
                      onClick={() => {
                        loadConversation(conv.id);
                        setShowHistory(false);
                      }}
                      className={`flex-1 p-3 text-left rounded-xl border transition-colors ${
                        conversationId === conv.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-800 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.messages.length} messages · {conv.updatedAt.toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(conv.id);
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }


  // Main chat view
  return (
    <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Course Tutor</h3>
            <p className="text-xs text-blue-100">Ask me anything about this course</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshConversations();
              setShowHistory(true);
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Conversation history"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Welcome to AI Tutor!</h4>
            <p className="text-sm text-gray-600 mb-6">
              I'm here to help you understand the course material. Ask me anything!
            </p>
            
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q)}
                      className="w-full p-2 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, index) => renderMessage(msg, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reasoning Preview - Shows AI thinking process */}
      {isReasoning && currentReasoning && (
        <div className="px-4 py-2 bg-purple-50 border-t border-purple-200">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-medium">AI is reasoning...</span>
          </div>
          <p className="text-xs text-purple-600 line-clamp-2 italic">
            {currentReasoning.slice(-200)}...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="p-1 hover:bg-red-100 rounded"
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutorChat;
