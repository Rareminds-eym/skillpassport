import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { X, Star } from 'lucide-react';
import { InteractiveCardRenderer } from './InteractiveCards';
import { VisualizationContainer } from './Visualizations';
import {
  EnhancedAIResponse,
  ActionButton,
  SuggestedAction
} from '../types/interactive';

interface EnhancedMessageProps {
  response: EnhancedAIResponse;
  timestamp: string;
  onSendQuery: (query: string) => void;
}

export const EnhancedMessage: React.FC<EnhancedMessageProps> = ({
  response,
  timestamp,
  onSendQuery
}) => {
  const navigate = useNavigate();

  const handleAction = (button: ActionButton) => {
    switch (button.action.type) {
      case 'query':
        onSendQuery(button.action.value);
        break;
      case 'navigate':
        navigate(button.action.value);
        break;
      case 'external':
        window.open(button.action.value, '_blank', 'noopener,noreferrer');
        break;
      case 'function':
        console.log('Function action:', button.action.value, button.action.data);
        break;
    }
  };

  const handleSuggestion = (suggestion: SuggestedAction) => {
    onSendQuery(suggestion.query);
  };

  return (
    <div className="flex justify-start mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-[90%] rounded-2xl px-6 py-4 bg-gray-100 text-gray-900"
      >
        {response.message && (
          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown>{response.message}</ReactMarkdown>
          </div>
        )}

        {response.interactive && (
          <div className="space-y-4">
            {response.interactive.metadata?.encouragement && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
              >
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                  {response.interactive.metadata.encouragement}
                </p>
              </motion.div>
            )}

            {response.interactive.metadata?.nextSteps && response.interactive.metadata.nextSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  Next Steps:
                </h4>
                <ul className="space-y-2">
                  {response.interactive.metadata.nextSteps.map((step, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.05) }}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">•</span>
                      <span>{step}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {response.interactive.visualData && (
              <VisualizationContainer data={response.interactive.visualData} />
            )}

            {response.interactive.cards && response.interactive.cards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {response.interactive.cards.map((card) => (
                  <InteractiveCardRenderer
                    key={card.id}
                    card={card}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}

            {response.interactive.quickActions && response.interactive.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {response.interactive.quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                      action.variant === 'primary'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : action.variant === 'secondary'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        : 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                    } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}

            {response.interactive.suggestions && response.interactive.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
                <div className="flex flex-wrap gap-2">
                  {response.interactive.suggestions.map((suggestion) => (
                    <motion.button
                      key={suggestion.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestion(suggestion)}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-1.5"
                    >
                      {suggestion.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {response.interactive?.metadata && (
            <span className="ml-2 text-gray-400">
              • {response.interactive.metadata.intentHandled}
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
};

// Simple text message component (for user messages and AI responses)
interface FeedbackData {
  thumbsUp: boolean | null;
  rating: number | null;
  feedback: string | null;
}

interface SimpleMessageProps {
  content: string;
  timestamp: string;
  isUser?: boolean;
  messageId?: string;
  onFeedback?: (messageId: string, thumbsUp: boolean, rating?: number, feedback?: string) => void;
  feedbackData?: FeedbackData | null;
  feedbackLoading?: boolean;
}

export const SimpleMessage: React.FC<SimpleMessageProps> = ({
  content,
  timestamp,
  isUser = false,
  messageId,
  onFeedback,
  feedbackData,
  feedbackLoading = false
}) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Get thumbs state from feedbackData
  const feedbackState = feedbackData?.thumbsUp ?? null;
  const savedRating = feedbackData?.rating ?? null;
  const savedFeedback = feedbackData?.feedback ?? null;

  const handleThumbsUp = () => {
    if (messageId && onFeedback) {
      onFeedback(messageId, true);
    }
  };

  const handleThumbsDown = () => {
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (messageId && onFeedback) {
      onFeedback(messageId, false, rating || undefined, feedbackText || undefined);
    }
    setShowFeedbackModal(false);
    setRating(0);
    setFeedbackText('');
  };

  const handleSkipFeedback = () => {
    if (messageId && onFeedback) {
      onFeedback(messageId, false);
    }
    setShowFeedbackModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div
          className={`max-w-[80%] rounded-2xl px-6 py-4 ${
            isUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-li:text-gray-800 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }: any) {
                    return !inline ? (
                      <pre className="bg-gray-800 text-gray-100 rounded-lg p-4 overflow-x-auto my-3">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    ) : (
                      <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
                    );
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>;
                  },
                  h1({ children }) {
                    return <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>;
                  },
                  p({ children }) {
                    return <p className="my-2 leading-relaxed">{children}</p>;
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full border border-gray-200 rounded-lg">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 py-2 bg-gray-100 border-b border-gray-200 text-left text-sm font-semibold">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return <td className="px-3 py-2 border-b border-gray-100 text-sm">{children}</td>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Timestamp and Feedback */}
          <div className={`flex items-center justify-between mt-2 ${isUser ? '' : 'border-t border-gray-200 pt-2'}`}>
            <p className={`text-xs ${isUser ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            
            {/* Feedback buttons for AI messages only */}
            {!isUser && messageId && onFeedback && (
              <div className="flex items-center gap-1">
                {feedbackLoading ? (
                  <span className="text-xs text-gray-400">Saving...</span>
                ) : (
                  <>
                    <button
                      onClick={handleThumbsUp}
                      disabled={feedbackLoading}
                      className={`p-1.5 rounded-lg transition-all ${
                        feedbackState === true
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title="Good response"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                    </button>
                    <button
                      onClick={handleThumbsDown}
                      disabled={feedbackLoading}
                      className={`p-1.5 rounded-lg transition-all ${
                        feedbackState === false
                          ? 'bg-red-100 text-red-600'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Bad response - Click to give feedback"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Display saved rating and feedback */}
          {!isUser && (savedRating || savedFeedback) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              {savedRating && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-gray-500">Your rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= savedRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {savedFeedback && (
                <p className="text-xs text-gray-500 italic">
                  "{savedFeedback}"
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Help us improve</h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Star Rating */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">How would you rate this response?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredStar || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">What could be improved? (optional)</p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what went wrong or how we can do better..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipFeedback}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
