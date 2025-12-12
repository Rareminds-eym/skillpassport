import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
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

  // Handle action button clicks
  const handleAction = (button: ActionButton) => {
    switch (button.action.type) {
      case 'query':
        // Send new query
        onSendQuery(button.action.value);
        break;
      case 'navigate':
        // Navigate to internal route
        navigate(button.action.value);
        break;
      case 'external':
        // Open external link
        window.open(button.action.value, '_blank', 'noopener,noreferrer');
        break;
      case 'function':
        // Custom function (e.g., save course)
        console.log('Function action:', button.action.value, button.action.data);
        // TODO: Implement custom action handlers
        break;
    }
  };

  // Handle suggested action clicks
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
        {/* Text Message (if any) */}
        {response.message && (
          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown>{response.message}</ReactMarkdown>
          </div>
        )}

        {/* Interactive Elements */}
        {response.interactive && (
          <div className="space-y-4">
            {/* Encouragement Message */}
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

            {/* Next Steps */}
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

            {/* Visualizations */}
            {response.interactive.visualData && (
              <VisualizationContainer data={response.interactive.visualData} />
            )}

            {/* Interactive Cards */}
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

            {/* Quick Actions */}
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

            {/* Suggested Follow-up Queries */}
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

        {/* Timestamp */}
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
interface SimpleMessageProps {
  content: string;
  timestamp: string;
  isUser?: boolean;
}

export const SimpleMessage: React.FC<SimpleMessageProps> = ({
  content,
  timestamp,
  isUser = false
}) => {
  return (
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
                // Custom code block rendering
                code({ inline, className, children, ...props }: any) {
                  return !inline ? (
                    <pre className="bg-gray-800 text-gray-100 rounded-lg p-4 overflow-x-auto my-3">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom list rendering
                ul({ children }) {
                  return <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>;
                },
                // Custom heading rendering
                h1({ children }) {
                  return <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>;
                },
                // Custom paragraph
                p({ children }) {
                  return <p className="my-2 leading-relaxed">{children}</p>;
                },
                // Custom link
                a({ href, children }) {
                  return (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
                // Custom blockquote
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
                      {children}
                    </blockquote>
                  );
                },
                // Custom table
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        {children}
                      </table>
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
                  return (
                    <td className="px-3 py-2 border-b border-gray-100 text-sm">
                      {children}
                    </td>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
        <p className={`text-xs mt-2 ${isUser ? 'text-gray-400' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

