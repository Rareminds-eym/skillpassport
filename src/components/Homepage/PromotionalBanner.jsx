import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PromotionalBanner - Slim e-commerce style top banner
 * Features: Compact design, discount badge, countdown, smooth animation
 */
const PromotionalBanner = ({ event, isOpen, onClose, getTimeRemaining }) => {
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
    navigate('/register/plans');
  };

  if (!event) return null;

  // Format countdown for banner (compact)
  const formatCountdown = () => {
    if (!timeLeft) return '';
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
    if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
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
          {/* Banner Container */}
          <div className="bg-[#1B6B6B]">
            <div className="relative flex items-center justify-center px-3 py-2 sm:px-4">
              {/* Content Group */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Emoji */}
                <span className="text-sm sm:text-base">{event.banner_emoji || '🎉'}</span>

                {/* Event Text - Hidden on very small screens */}
                <span className="hidden text-xs font-medium text-white xs:inline sm:text-sm">
                  {event.event_name || 'Special Event'}
                </span>

                {/* Separator */}
                <span className="hidden text-white/40 sm:inline">•</span>

                {/* Discount Badge */}
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-gray-900 sm:text-xs">
                  50% OFF
                </span>

                {/* Separator */}
                <span className="hidden text-white/40 md:inline">•</span>

                {/* Countdown - Hidden on mobile */}
                {timeLeft && (
                  <span className="hidden text-xs text-white/80 md:inline">
                    Ends in {formatCountdown()}
                  </span>
                )}
              </div>

              {/* Right Side: CTA + Close */}
              <div className="absolute right-2 flex items-center gap-1.5 sm:right-4 sm:gap-2">
                {/* CTA Button - Desktop */}
                <motion.button
                  className="hidden items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1B6B6B] shadow-sm transition-all hover:bg-gray-50 sm:flex"
                  onClick={handleClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  View Offers
                  <ArrowRight className="h-3 w-3" />
                </motion.button>

                {/* CTA Button - Mobile */}
                <motion.button
                  className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#1B6B6B] sm:hidden"
                  onClick={handleClick}
                  whileTap={{ scale: 0.95 }}
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </motion.button>

                {/* Close Button */}
                <button
                  className="flex items-center justify-center rounded-full p-0.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
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

export default PromotionalBanner;
