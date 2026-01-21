import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Square } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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
  );
};

interface ScrollButtonsProps {
  userScrolledUp: boolean;
  isTyping: boolean;
  loading: boolean;
  onScrollToBottom: () => void;
  onStopGenerating: () => void;
}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  userScrolledUp,
  isTyping,
  loading,
  onScrollToBottom,
  onStopGenerating,
}) => {
  return (
    <AnimatePresence>
      {((userScrolledUp && (loading || isTyping)) ||
        (userScrolledUp && !loading && !isTyping) ||
        loading ||
        isTyping) && (
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
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={onScrollToBottom}
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
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={onStopGenerating}
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
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={onScrollToBottom}
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
  );
};
