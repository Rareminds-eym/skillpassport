import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingRecruiterAIButton: React.FC = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on the AI Copilot page itself
  if (location.pathname === '/recruitment/talent-scout') {
    return null;
  }

  const handleClick = () => {
    navigate('/recruitment/talent-scout');
  };

  return (
    <div className="fixed bottom-44 md:bottom-32 right-6 z-50">
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg whitespace-nowrap"
          >
            Ask Recruitment AI ✨
            <div className="absolute -bottom-1 right-6 w-3 h-3 bg-purple-600 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        {/* New feature badge (optional) */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-white text-xs font-bold">✨</span>
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingRecruiterAIButton;
