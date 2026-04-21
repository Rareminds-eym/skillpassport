import React from 'react';
import { motion } from 'framer-motion';

interface AIThinkingBubbleProps {
  status?: string;
  showStatusPill?: boolean;
}

/**
 * ChatGPT-style thinking bubble with animated dots
 * 
 * @param status - Optional status message to display above the bubble (e.g., "Searching database...")
 * @param showStatusPill - Whether to show the status pill above the bubble (default: true if status is provided)
 */
export const AIThinkingBubble: React.FC<AIThinkingBubbleProps> = ({ 
  status, 
  showStatusPill = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-start gap-2"
    >
      {/* Status pill - shows what the AI is doing */}
      {status && showStatusPill && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 shadow-sm ml-1"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute w-2 h-2 bg-blue-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-medium text-blue-700">{status}</span>
        </motion.div>
      )}
      
      {/* Thinking bubble with tail */}
      <div className="relative">
        {/* Tail for chat bubble effect */}
        <div className="absolute bottom-1 left-2 w-3 h-3 bg-white transform rotate-45 shadow-sm" />
        
        {/* Main bubble */}
        <div className="relative bg-white rounded-2xl rounded-bl-sm shadow-md px-6 py-4">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.15
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AIStatusPillProps {
  status: string;
  variant?: 'default' | 'searching' | 'processing' | 'running';
}

/**
 * Standalone status pill for showing AI activity
 * Can be used separately from the thinking bubble
 */
export const AIStatusPill: React.FC<AIStatusPillProps> = ({ 
  status, 
  variant = 'default' 
}) => {
  const variantStyles = {
    default: 'from-blue-50 to-purple-50 border-blue-100/50 text-blue-700',
    searching: 'from-green-50 to-emerald-50 border-green-100/50 text-green-700',
    processing: 'from-amber-50 to-yellow-50 border-amber-100/50 text-amber-700',
    running: 'from-purple-50 to-pink-50 border-purple-100/50 text-purple-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r border shadow-sm ${variantStyles[variant]}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
        <div className="absolute w-2 h-2 bg-current rounded-full animate-ping opacity-75" />
      </div>
      <span className="text-xs font-medium">{status}</span>
    </motion.div>
  );
};

interface AISkeletonMessageProps {
  lines?: number;
}

/**
 * Skeleton message placeholder for streaming responses
 * Shows animated skeleton lines that gradually appear
 */
export const AISkeletonMessage: React.FC<AISkeletonMessageProps> = ({ lines = 3 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl rounded-bl-sm shadow-md px-6 py-4 space-y-3"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: `${70 + Math.random() * 30}%` }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="h-3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"
        />
      ))}
    </motion.div>
  );
};

interface AITypingIndicatorProps {
  text: string;
  variant?: 'bubble' | 'inline';
}

/**
 * Minimal typing indicator showing just the dots
 * Good for compact spaces or inline use
 */
export const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({ 
  text = 'Typing',
  variant = 'bubble' 
}) => {
  const dots = (
    <div className="flex items-center gap-1.5">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-gray-600">{text}</span>
        {dots}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl rounded-bl-sm shadow-md px-6 py-4">
      {dots}
    </div>
  );
};

// Add shimmer animation to Tailwind config or use inline style
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

