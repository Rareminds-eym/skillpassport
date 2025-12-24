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
    <div className="fixed bottom-1 -right-1 z-50">
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-full right-12 -mb-7 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg whitespace-nowrap"
          >
            Ask Career AI
            <div className="absolute -bottom-1 right-8 w-3 h-3 bg-purple-600 transform rotate-45"></div>
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
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ width: '200px', height: '200px' }}
      >
        {/* <img 
          src="/ai.gif" 
          alt="Career AI" 
          className="drop-shadow-lg"
          style={{ width: '200px', height: '200px' }}
        /> */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <img src="/RMLogo.webp" alt="RareMinds Logo" className="w-16 h-16" />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default FloatingAIButton;
