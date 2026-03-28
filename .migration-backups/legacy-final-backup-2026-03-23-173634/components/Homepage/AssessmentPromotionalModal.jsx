import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Sparkles, X } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AssessmentPromotionalModal - Promotional modal for taking assessment
 * Features: Clean card design with skill analysis badge and benefits section
 */
const AssessmentPromotionalModal = ({ isOpen, onClose, getTimeRemaining }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining?.() || null);
  const hasAnimated = useRef(false);

  // Track if modal has animated (reset when closed)
  useEffect(() => {
    if (!isOpen) {
      hasAnimated.current = false;
    } else {
      const timer = setTimeout(() => {
        hasAnimated.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Update countdown every second
  useEffect(() => {
    if (!isOpen || !getTimeRemaining) return;

    setTimeLeft(getTimeRemaining());

    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, getTimeRemaining]);

  // Handle escape key
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

  const handleTakeAssessment = () => {
    onClose();
    navigate('/signup');
  };

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

  // Countdown box - compact with white labels
  const CountdownBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/30 text-base font-bold text-white">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-white/80">{label}</span>
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
            className="relative w-full max-w-[420px] rounded-2xl bg-gradient-to-b from-blue-50 to-white shadow-2xl"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Countdown Section - Compact at Top */}
            {timeLeft && (
              <div className="relative rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5">
                {/* Close button - top right */}
                <button
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                  onClick={onClose}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/90">
                  Limited Time Offer
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <CountdownBox value={timeLeft.days} label="Days" />
                  <span className="text-base font-bold text-white/70">:</span>
                  <CountdownBox value={timeLeft.hours} label="Hrs" />
                  <span className="text-base font-bold text-white/70">:</span>
                  <CountdownBox value={timeLeft.minutes} label="Min" />
                  <span className="text-base font-bold text-white/70">:</span>
                  <CountdownBox value={timeLeft.seconds} label="Sec" />
                </div>
              </div>
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                  <DotLottieReact
                    src="https://lottie.host/d2e9c81b-68e5-4817-8cdb-232a1a4d96d1/IrCaxvOj5s.lottie"
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Assessment Test</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10">
                  <DotLottieReact
                    src="https://lottie.host/d2e9c81b-68e5-4817-8cdb-232a1a4d96d1/IrCaxvOj5s.lottie"
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <motion.button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
                  aria-label="Close modal"
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 pt-3">
              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed">
                Take our comprehensive assessment to discover your strengths and get a personalized career roadmap.
              </p>

              {/* Skill Analysis Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  </span>
                  Skill Analysis
                </span>
              </div>

              {/* CTA Button */}
              <motion.button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                onClick={handleTakeAssessment}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Register
                <ChevronRight className="h-4 w-4" />
              </motion.button>

              {/* Divider */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Extended Description */}
              <p className="text-xs text-gray-600 leading-relaxed">
                Uncover your strengths, identify areas for growth, and explore opportunities tailored to you.
              </p>

              {/* Why Take This Assessment Section */}
              <div className="mt-4 rounded-xl border-l-4 border-blue-500 bg-blue-50/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Why Take This Assessment?</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-[11px] text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Understand your unique strengths and skills</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Identify opportunities for growth</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Get insights to guide your career goals</span>
                  </div>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-4 rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] italic text-gray-600">
                  💡 <em>Simple, quick, and tailored for you—discover more about yourself today!</em>
                </p>
              </div>

              {/* Skip link */}
              <button
                className="mt-3 w-full text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
                onClick={onClose}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssessmentPromotionalModal;
