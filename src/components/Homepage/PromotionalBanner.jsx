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
          {/* Banner Container - Light grey background */}
          <div className="bg-gray-100 border-b border-gray-200">
            {/* Mobile Layout: Left-Center-Right */}
            <div className="flex items-center justify-between px-3 py-2 sm:hidden">
              {/* Left: Emoji + 50% OFF badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm">{event.banner_emoji || '🎉'}</span>
                <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-[11px] font-bold text-gray-900">
                  50% OFF
                </span>
              </div>

              {/* Center: Countdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">•</span>
                {timeLeft && (
                  <span className="text-[11px] font-medium text-gray-600">
                    Ends in {formatCountdown()}
                  </span>
                )}
              </div>

              {/* Right: CTA + Close */}
              <div className="flex items-center gap-1.5">
                <motion.button
                  className="flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-1 text-[10px] font-semibold text-white"
                  onClick={handleClick}
                  whileTap={{ scale: 0.97 }}
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
                <button
                  className="flex items-center justify-center rounded-full p-0.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                  onClick={onClose}
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Layout: Centered content */}
            <div className="hidden items-center justify-center gap-4 px-4 py-2 sm:flex">
              {/* Content Group */}
              <div className="flex items-center gap-3">
                <span className="text-base">{event.banner_emoji || '🎉'}</span>
                <span className="rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-gray-900">
                  50% OFF
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-gray-700">
                  {event.event_name || 'Special Event'}
                </span>
                <span className="text-gray-400">•</span>
                {timeLeft && (
                  <span className="text-xs font-medium text-gray-600">
                    Ends in {formatCountdown()}
                  </span>
                )}
              </div>

              {/* CTA + Close */}
              <div className="flex items-center gap-2">
                <motion.button
                  className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-gray-700"
                  onClick={handleClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  View Offers
                  <ArrowRight className="h-3 w-3" />
                </motion.button>
                <button
                  className="flex items-center justify-center rounded-full p-0.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
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
