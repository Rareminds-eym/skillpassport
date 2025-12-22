import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingAIButton: React.FC = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on the Career AI page itself
  if (location.pathname === '/student/career-ai') {
    return null;
  }

  const handleClick = () => {
    navigate('/student/career-ai');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg whitespace-nowrap"
          >
            Ask Career AI ✨
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
        className="relative w-16 h-16 rounded-full bg-white border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gray-200"
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
        <div className="relative z-10">
          <img src="/ai.png" alt="Career AI" className="w-10 h-10 object-contain" />
        </div>

        {/* Notification badge (optional - can be activated when there are new features) */}
        {/* <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div> */}
      </motion.button>
    </div>
  );
};

export default FloatingAIButton;
