import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * AssessmentPromotionalBanner - Slim top banner for assessment promotion
 * Shows after user closes the assessment modal (clicks "Maybe later")
 */
const AssessmentPromotionalBanner = ({ isOpen, onClose, getTimeRemaining }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining?.() || null);

  // Update countdown every second
  useEffect(() => {
    if (!isOpen || !getTimeRemaining) return;

    setTimeLeft(getTimeRemaining());
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, getTimeRemaining]);

  const handleClick = () => {
    navigate('/register');
  };

  // Format countdown for banner (compact with seconds)
  const formatCountdown = () => {
    if (!timeLeft) return '';
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
    if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
    parts.push(`${timeLeft.seconds || 0}s`);
    return parts.join(' ');
  };

  // Animation variants
  const bannerVariants = {
    hidden: { y: -40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: {
      y: -40,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeInOut' },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed left-0 right-0 top-0 z-[60]"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={bannerVariants}
        >
          {/* Banner Container - Light blue/indigo gradient background */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            {/* Mobile Layout */}
            <div className="flex items-center justify-between px-3 py-2 sm:hidden">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-medium text-gray-700">
                  Career Assessment
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {timeLeft && (
                  <span className="text-[11px] font-medium text-blue-600">
                    {formatCountdown()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white"
                  onClick={handleClick}
                  whileTap={{ scale: 0.97 }}
                >
                  Start
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
                <button
                  className="flex items-center justify-center rounded-full p-0.5 text-gray-500 transition-colors hover:bg-blue-100 hover:text-gray-700"
                  onClick={onClose}
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden items-center justify-center gap-4 px-4 py-2 sm:flex">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Career Assessment - Discover Your Potential
                </span>
                {timeLeft && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs font-medium text-blue-600">
                      Offer ends in {formatCountdown()}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-blue-700"
                  onClick={handleClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Register
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
                <button
                  className="flex items-center justify-center rounded-full p-0.5 text-gray-500 transition-colors hover:bg-blue-100 hover:text-gray-700"
                  onClick={onClose}
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssessmentPromotionalBanner;
