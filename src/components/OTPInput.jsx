/**
 * OTPInput - Professional 6-digit OTP Component
 * 
 * Features:
 * - Individual digit boxes with auto-focus
 * - Countdown timer with visual progress
 * - Paste support (auto-fills all boxes)
 * - Keyboard navigation (Arrow keys, Backspace)
 * - Auto-submit when complete
 * - Accessible (ARIA labels, keyboard support)
 * - Modern animations and micro-interactions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const OTPInput = ({
  length = 6,
  onComplete,
  onResend,
  email,
  expirySeconds = 600, // 10 minutes default
  error = '',
  isVerifying = false,
  isSuccess = false,
}) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Reset timer when expirySeconds changes (new OTP sent)
  useEffect(() => {
    setTimeLeft(expirySeconds);
    setCanResend(false);
  }, [expirySeconds]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((expirySeconds - timeLeft) / expirySeconds) * 100;

  // Handle input change
  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    // Check if OTP is complete
    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  // Handle keydown events
  const handleKeyDown = (index, e) => {
    // Backspace: clear current and move to previous
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    }

    // Arrow Left
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }

    // Arrow Right
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(new Array(length).fill('')).slice(0, length);
    setOtp(newOtp);

    // Focus last filled input or first empty
    const lastFilledIndex = newOtp.findIndex((digit) => digit === '');
    const focusIndex = lastFilledIndex === -1 ? length - 1 : lastFilledIndex;
    inputRefs.current[focusIndex]?.focus();
    setActiveIndex(focusIndex);

    // Check if complete
    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  // Handle resend
  const handleResend = () => {
    if (!canResend) return;
    setOtp(new Array(length).fill(''));
    setTimeLeft(expirySeconds);
    setCanResend(false);
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
    onResend();
  };

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full"
    >
      {/* Header with email and timer */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-1 w-full overflow-hidden">
            <p className="text-xs sm:text-sm text-gray-700 font-medium mb-1">
              Enter verification code
            </p>
            <p className="text-xs text-gray-500 break-words">
              Sent to <span className="font-semibold text-gray-700 break-all">{email}</span>
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg ${
              timeLeft <= 60 
                ? 'bg-red-50 text-red-700' 
                : 'bg-blue-50 text-blue-700'
            }`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-semibold font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              timeLeft <= 60 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* OTP Input Boxes */}
      <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-center mb-4 sm:mb-6 w-full">
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex-1 max-w-[48px] sm:max-w-[56px] md:max-w-[64px]"
          >
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => setActiveIndex(index)}
              disabled={isVerifying || isSuccess}
              className={`
                w-full aspect-square text-center text-lg sm:text-xl md:text-2xl font-bold rounded-lg sm:rounded-xl
                border-2 outline-none transition-all duration-200
                ${isSuccess
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : error
                    ? 'border-red-400 bg-red-50 text-red-700 animate-shake'
                    : activeIndex === index
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg shadow-blue-100 scale-105'
                      : digit
                        ? 'border-gray-300 bg-white text-gray-900 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }
                ${isVerifying || isSuccess ? 'cursor-not-allowed opacity-60' : 'cursor-text'}
                focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:outline-none
              `}
              aria-label={`Digit ${index + 1}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {isVerifying && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center justify-center gap-2 text-blue-600 mb-3 sm:mb-4"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs sm:text-sm font-medium">Verifying code...</span>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-2 text-emerald-600 mb-3 sm:mb-4"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-semibold">Verified successfully!</span>
          </motion.div>
        )}

        {error && !isVerifying && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center justify-center gap-2 text-red-600 mb-3 sm:mb-4 px-2"
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium break-words text-center">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resend Button */}
      <div className="text-center w-full overflow-hidden">
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isVerifying || isSuccess}
          className={`
            inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl
            text-xs sm:text-sm font-semibold transition-all duration-200
            ${canResend && !isVerifying && !isSuccess
              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer'
              : 'text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${canResend && !isVerifying && !isSuccess ? 'hover:rotate-180 transition-transform duration-500' : ''}`} />
          <span className="whitespace-nowrap">{canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}</span>
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-center text-xs text-gray-500 mt-3 sm:mt-4 px-2 break-words">
        Didn't receive the code? Check your spam folder or try resending.
      </p>
    </motion.div>
  );
};

export default OTPInput;
