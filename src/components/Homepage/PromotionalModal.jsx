import { AnimatePresence, motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import discountAnimation from '../../assets/HomePage/DiscountIcon.json';

/**
 * PromotionalModal - Modern promotional modal with starburst badge
 * Features: Cream background, starburst discount badge, sparkle decorations, countdown timer
 */
const PromotionalModal = ({ event, isOpen, onClose, getTimeRemaining }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining?.() || null);
  const hasAnimated = useRef(false);

  // Track if modal has animated (reset when closed)
  useEffect(() => {
    if (!isOpen) {
      hasAnimated.current = false;
    } else {
      // Small delay to allow initial render, then mark as animated
      const timer = setTimeout(() => {
        hasAnimated.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Update countdown every second
  useEffect(() => {
    if (!isOpen || !getTimeRemaining) return;

    // Initial update
    setTimeLeft(getTimeRemaining());

    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, getTimeRemaining]);

  // Handle escape key and scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleExplore = () => {
    onClose();
    navigate('/signup/plans');
  };

  if (!event) return null;

  // Fixed 50% discount as requested
  const discountPercent = '50';

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  // Starburst Badge - Hero element with 50% discount
  const StarburstBadge = () => (
    <motion.div
      className="relative"
      initial={hasAnimated.current ? false : { scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: hasAnimated.current ? 0 : 0.2 }}
    >
      <svg viewBox="0 0 100 100" className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-lg">
        <path
          d="M50 0 L54 38 L65 5 L58 39 L78 15 L61 42 L88 28 L63 46 L95 45 L64 50 L95 55 L63 54 L88 72 L61 58 L78 85 L58 61 L65 95 L54 62 L50 100 L46 62 L35 95 L42 61 L22 85 L39 58 L12 72 L37 54 L5 55 L36 50 L5 45 L37 46 L12 28 L39 42 L22 15 L42 39 L35 5 L46 38 Z"
          fill="#0166cc"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white sm:text-3xl">{discountPercent}%</span>
      </div>
    </motion.div>
  );

  // Lottie tag icon for inline use with headline
  const DiscountTagIcon = () => {
    const lottieRef = useRef(null);

    useEffect(() => {
      if (lottieRef.current) {
        lottieRef.current.setSpeed(0.4);
      }
    }, []);

    return (
      <Lottie
        lottieRef={lottieRef}
        animationData={discountAnimation}
        loop={true}
        className="h-8 w-8 sm:h-10 sm:w-10"
      />
    );
  };

  // Sparkle/Star decoration - Left side
  const LeftDecoration = () => (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={hasAnimated.current ? false : { opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: hasAnimated.current ? 0 : 0.4, duration: 0.4 }}
    >
      {/* Curved arrow pointing to badge */}
      <svg viewBox="0 0 50 80" className="h-16 w-10 sm:h-20 sm:w-12">
        <path
          d="M40 10 C35 25, 20 35, 25 50 C30 65, 15 70, 10 75"
          fill="none"
          stroke="#E85D3B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M5 70 L10 75 L15 68" fill="none" stroke="#E85D3B" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {/* Small sparkle */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400">
        <path fill="currentColor" d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    </motion.div>
  );

  // Sparkle/Star decoration - Right side
  const RightDecoration = () => (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={hasAnimated.current ? false : { opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: hasAnimated.current ? 0 : 0.4, duration: 0.4 }}
    >
      {/* Celebration stars */}
      <svg viewBox="0 0 40 60" className="h-14 w-8 sm:h-18 sm:w-10">
        <path fill="#0166cc" d="M20 0L22 8L30 10L22 12L20 20L18 12L10 10L18 8Z" />
        <path fill="#0166cc" opacity="0.6" d="M30 25L31.5 30L37 31L31.5 32L30 37L28.5 32L23 31L28.5 30Z" />
        <path fill="#0166cc" opacity="0.4" d="M12 35L13 39L17 40L13 41L12 45L11 41L7 40L11 39Z" />
      </svg>
      {/* Small sparkle */}
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-400">
        <path fill="currentColor" d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    </motion.div>
  );

  // Countdown box with label - NO animation, just static
  const CountdownBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0166cc] text-xl font-bold text-white shadow-md">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[400px] overflow-hidden rounded-3xl bg-[#F5F0E8] shadow-2xl"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-400/80 text-white transition-colors hover:bg-gray-500"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-5 w-5" />
            </motion.button>

            {/* Header with decorations */}
            <div className="relative flex items-center justify-center px-6 pb-2 pt-10">
              {/* SALE watermark */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="select-none text-[80px] font-bold tracking-wider text-[#E8E3DB] sm:text-[100px]">
                  SALE
                </span>
              </div>

              {/* Decorative elements */}
              <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
                <LeftDecoration />
                <StarburstBadge />
                <RightDecoration />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 pt-4">
              {/* Event Badge */}
              <motion.div
                className="mb-3 flex justify-center"
                initial={hasAnimated.current ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated.current ? 0 : 0.25 }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0166cc]/10 px-3 py-1 text-xs font-semibold text-[#0166cc]">
                  {event.banner_emoji || '🎉'} {event.event_name || 'Special Event'}
                </span>
              </motion.div>

              {/* Headline with inline Lottie tag icon after 50 */}
              <motion.h2
                className="text-center text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-[28px]"
                initial={hasAnimated.current ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated.current ? 0 : 0.3 }}
              >
                <span className="inline-flex items-center">
                  Unlock {discountPercent}
                  <DiscountTagIcon />
                  OFF
                </span>
                <br />
                on Premium Plans
              </motion.h2>

              {/* Subtext - What user gets */}
              <motion.p
                className="mt-3 text-center text-sm leading-relaxed text-gray-600 sm:text-base"
                initial={hasAnimated.current ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated.current ? 0 : 0.35 }}
              >
                Get full access to all SkillPassport features.
                <br />
                <span className="font-medium text-gray-700">Limited time offer!</span>
              </motion.p>

              {/* Countdown Section */}
              {timeLeft && (
                <div className="mt-6">
                  {/* Countdown Label */}
                  <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Offer ends in
                  </p>
                  {/* Countdown Timer */}
                  <div className="flex items-start justify-center gap-2 sm:gap-3">
                    <CountdownBox value={timeLeft.days} label="Days" />
                    <span className="mt-3 text-lg font-bold text-[#0166cc] sm:text-xl">:</span>
                    <CountdownBox value={timeLeft.hours} label="Hrs" />
                    <span className="mt-3 text-lg font-bold text-[#0166cc] sm:text-xl">:</span>
                    <CountdownBox value={timeLeft.minutes} label="Min" />
                    <span className="mt-3 text-lg font-bold text-[#0166cc] sm:text-xl">:</span>
                    <CountdownBox value={timeLeft.seconds} label="Sec" />
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <motion.button
                className="mt-8 w-full rounded-xl bg-[#0166cc] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#0155aa] hover:shadow-xl"
                onClick={handleExplore}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={hasAnimated.current ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasAnimated.current ? 0 : 0.5 }}
              >
                Claim My {discountPercent}% Discount
              </motion.button>

              {/* Skip link */}
              <motion.button
                className="mt-4 w-full text-center text-sm text-gray-400 transition-colors hover:text-gray-600"
                onClick={onClose}
                initial={hasAnimated.current ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: hasAnimated.current ? 0 : 0.6 }}
              >
                Maybe later
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromotionalModal;
