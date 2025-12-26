import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingAIButton: React.FC = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Stop pulsing after initial attention grab
    const timer = setTimeout(() => setIsPulsing(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Don't show on the Career AI page itself
  if (location.pathname === '/student/career-ai') {
    return null;
  }

  const handleClick = () => {
    navigate('/student/career-ai');
  };

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="fixed -bottom-4 -right-4 z-50 select-none">
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-full left-0 -mb-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-2xl shadow-2xl whitespace-nowrap -ml-11 md:-ml-7"
            style={{ 
              transform: 'translateX(-80%)',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Ask Career AI
            </div>
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-blue-600 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: isPulsing ? [0, -8, 0] : 0
        }}
        whileHover={{ 
          scale: 1.05
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          y: {
            duration: 2,
            repeat: isPulsing ? Infinity : 0,
            ease: "easeInOut"
          }
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        className="focus:outline-none p-0 m-0 border-0 bg-transparent"
        aria-label="Open Career AI Assistant"
        tabIndex={0}
      >
        {/* Plain GIF - Clean and minimal */}
        <img 
          src="/ai.gif" 
          alt="AI Assistant Animation"
          className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
          loading="lazy"
        />
      </motion.button>
    </div>
  );
};

export default FloatingAIButton;
