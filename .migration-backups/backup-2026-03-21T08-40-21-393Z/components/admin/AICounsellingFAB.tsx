import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, MessageSquare, GraduationCap } from 'lucide-react';

const AICounsellingFAB: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show on university admin pages, but hide on the AI counselling page itself
  const shouldShow =
    location.pathname.startsWith('/university-admin') &&
    location.pathname !== '/university-admin/ai-counselling';

  if (!shouldShow) return null;

  const handleClick = () => {
    navigate('/university-admin/ai-counselling');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-8 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsExpanded(false);
        }}
      >
        {/* Main Button */}
        <motion.button
          onClick={handleClick}
          onMouseEnter={() => setIsExpanded(true)}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />

          {/* Button Container */}
          <div className="relative flex items-center gap-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:via-blue-500 hover:to-indigo-500 rounded-full shadow-2xl transition-all duration-300">
            {/* Icon Circle */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm">
              <div className="relative">
                <Bot className="w-7 h-7 text-white" />
                {/* Sparkle animation */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    rotate: [0, 180, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
              </div>
            </div>

            {/* Expanded Text */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden pr-6"
                >
                  <div className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-lg">
                        AI Counselling
                      </span>
                      <GraduationCap className="w-5 h-5 text-white/80" />
                    </div>
                    <p className="text-white/80 text-xs mt-0.5">
                      Get personalized guidance
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pulse Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-400"
            animate={{
              scale: [1, 1.4, 1.4],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.button>

        {/* Tooltip - Only show when not expanded */}
        <AnimatePresence>
          {isHovered && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 10, y: 10 }}
              animate={{ opacity: 1, x: -10, y: -10 }}
              exit={{ opacity: 0, x: 10, y: 10 }}
              className="absolute bottom-full right-0 mb-2 pointer-events-none"
            >
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Open AI Counselling</span>
                </div>
                {/* Arrow */}
                <div className="absolute top-full right-6 -mt-1">
                  <div className="w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AICounsellingFAB;