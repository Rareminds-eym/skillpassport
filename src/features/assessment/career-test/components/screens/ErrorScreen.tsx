/**
 * ErrorScreen Component
 * 
 * Displays user-friendly error messages for various failure scenarios
 * in the assessment test (network issues, server errors, session problems, etc.)
 * 
 * @module features/assessment/career-test/components/screens/ErrorScreen
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  WifiOff, 
  ServerCrash, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';
import { Button } from '../../../../../components/Students/components/ui/button';

export type ErrorType = 'network' | 'server' | 'session' | 'loading' | 'generic';

interface ErrorScreenProps {
  errorType?: ErrorType;
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
  onBackToDashboard?: () => void;
  showContactSupport?: boolean;
  autoRetrySeconds?: number; // Optional countdown for auto-retry
}

/**
 * Get error configuration based on error type
 */
const getErrorConfig = (errorType: ErrorType) => {
  switch (errorType) {
    case 'network':
      return {
        icon: WifiOff,
        color: 'orange',
        bgGradient: 'from-orange-50 via-amber-50/30 to-orange-50',
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
        defaultTitle: 'Connection Problem',
        defaultMessage: 'We\'re having trouble connecting to the server. This might be due to a slow or unstable internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try moving closer to your WiFi router',
          'Disable VPN if you\'re using one',
          'Try switching between WiFi and mobile data'
        ]
      };
    case 'server':
      return {
        icon: ServerCrash,
        color: 'red',
        bgGradient: 'from-red-50 via-pink-50/30 to-red-50',
        iconBg: 'bg-gradient-to-br from-red-500 to-pink-600',
        defaultTitle: 'Server Error',
        defaultMessage: 'Our servers are experiencing issues. This is not your fault - we\'re working to fix it.',
        suggestions: [
          'Wait a few minutes and try again',
          'The issue is on our end, not yours',
          'Your progress has been saved',
          'Contact support if this persists'
        ]
      };
    case 'session':
      return {
        icon: Clock,
        color: 'purple',
        bgGradient: 'from-purple-50 via-indigo-50/30 to-purple-50',
        iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        defaultTitle: 'Session Expired',
        defaultMessage: 'Your session has expired due to inactivity. Please refresh the page to continue.',
        suggestions: [
          'Click "Refresh Page" to log back in',
          'Your progress has been saved',
          'You can resume from where you left off'
        ]
      };
    case 'loading':
      return {
        icon: AlertCircle,
        color: 'blue',
        bgGradient: 'from-blue-50 via-indigo-50/30 to-blue-50',
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        defaultTitle: 'Loading Failed',
        defaultMessage: 'We couldn\'t load the assessment questions. This might be a temporary issue.',
        suggestions: [
          'Click "Try Again" to reload',
          'Check your internet connection',
          'Clear your browser cache if issue persists'
        ]
      };
    default:
      return {
        icon: AlertCircle,
        color: 'gray',
        bgGradient: 'from-gray-50 via-slate-50/30 to-gray-50',
        iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
        defaultTitle: 'Something Went Wrong',
        defaultMessage: 'An unexpected error occurred. Don\'t worry - your progress has been saved.',
        suggestions: [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the problem continues'
        ]
      };
  }
};

/**
 * Error screen with animated elements and helpful suggestions
 */
export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  errorType = 'generic',
  title,
  message,
  technicalDetails,
  onRetry,
  onRefresh,
  onBackToDashboard,
  showContactSupport = false,
  autoRetrySeconds
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState(autoRetrySeconds || 0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const config = getErrorConfig(errorType);
  const Icon = config.icon;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-retry countdown
  useEffect(() => {
    if (countdown > 0 && onRetry) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && autoRetrySeconds && onRetry) {
      onRetry();
    }
  }, [countdown, autoRetrySeconds, onRetry]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br ${config.bgGradient}`}
    >
      {/* Icon with Glassmorphism */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 p-5 relative overflow-hidden backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl" />
        
        <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center relative z-10 shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      {/* Offline Badge */}
      {!isOnline && errorType === 'network' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold mb-4 shadow-md"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are offline</span>
        </motion.div>
      )}

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.2 }}
        className="text-3xl font-bold text-gray-800 mb-4"
      >
        {title || config.defaultTitle}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.3 }}
        className="text-gray-600 mb-6 max-w-lg leading-relaxed text-lg"
      >
        {message || config.defaultMessage}
      </motion.p>

      {/* Suggestions Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.4 }}
        className="p-5 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60 shadow-lg mb-6 max-w-lg w-full"
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-3 text-left">What you can do:</h3>
        <ul className="space-y-2 text-left">
          {config.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Technical Details (Collapsible) */}
      {technicalDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="mb-6 max-w-lg w-full"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mx-auto"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showDetails ? 'Hide' : 'Show'} technical details</span>
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 bg-gray-100 rounded-lg border border-gray-200 text-left"
            >
              <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-mono">
                {technicalDetails}
              </pre>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        {onRetry && (
          <Button
            onClick={onRetry}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-6 rounded-xl"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {countdown > 0 ? `Try Again (${countdown}s)` : 'Try Again'}
          </Button>
        )}

        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-base border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 py-6 rounded-xl"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh Page
        </Button>
      </motion.div>

      {/* Secondary Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 mt-3 w-full max-w-md"
      >
        {onBackToDashboard && (
          <Button
            onClick={onBackToDashboard}
            variant="ghost"
            className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors py-3 rounded-lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        {showContactSupport && (
          <Button
            onClick={() => window.location.href = 'mailto:support@skillpassport.com'}
            variant="ghost"
            className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors py-3 rounded-lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ErrorScreen;
