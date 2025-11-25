import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { MessageWithInteractive, ActionButton, SuggestedAction } from '../types';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isUser: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, timestamp, isUser }) => {
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
        <div className="prose prose-sm max-w-none">
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>
        <p className={`text-xs mt-2 ${isUser ? 'text-gray-400' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

interface EnhancedMessageBubbleProps {
  message: MessageWithInteractive;
  onActionClick?: (action: ActionButton) => void;
  onSuggestionClick?: (suggestion: SuggestedAction) => void;
  renderCard?: (card: any, onAction: (action: ActionButton) => void) => React.ReactNode;
}

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  onActionClick,
  onSuggestionClick,
  renderCard
}) => {
  const { content, timestamp, interactive } = message;

  return (
    <div className="flex justify-start mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-[90%] rounded-2xl px-6 py-4 bg-gray-100 text-gray-900"
      >
        {/* Text Message */}
        {content && (
          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {/* Interactive Elements */}
        {interactive && (
          <div className="space-y-4">
            {/* Encouragement Message */}
            {interactive.metadata?.encouragement && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
              >
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                  {interactive.metadata.encouragement}
                </p>
              </motion.div>
            )}

            {/* Next Steps */}
            {interactive.metadata?.nextSteps && interactive.metadata.nextSteps.length > 0 && (
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
                  {interactive.metadata.nextSteps.map((step, idx) => (
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

            {/* Interactive Cards */}
            {interactive.cards && interactive.cards.length > 0 && renderCard && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {interactive.cards.map((card) => (
                  <div key={card.id}>
                    {renderCard(card, onActionClick || (() => {}))}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {interactive.quickActions && interactive.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {interactive.quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onActionClick?.(action)}
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
            {interactive.suggestions && interactive.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
                <div className="flex flex-wrap gap-2">
                  {interactive.suggestions.map((suggestion) => (
                    <motion.button
                      key={suggestion.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSuggestionClick?.(suggestion)}
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
          {interactive?.metadata?.intentHandled && (
            <span className="ml-2 text-gray-400">
              • {interactive.metadata.intentHandled}
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
};
