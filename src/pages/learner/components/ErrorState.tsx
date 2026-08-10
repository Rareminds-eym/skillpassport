/**
 * ErrorState Component
 * 
 * Reusable error state component with retry functionality and user-friendly error messages.
 * Distinguishes between network, timeout, server, and generic errors with appropriate messaging.
 * 
 * **Task 17.3**: Create ErrorState component
 * **Validates Requirements**: 13.1-13.10
 * 
 * @module pages/learner/components/ErrorState
 */

import React from 'react';

// ===== Type Definitions =====

/**
 * Props for ErrorState component
 */
interface ErrorStateProps {
    /** Error object with message */
    error: Error;
    /** Callback function to retry loading */
    onRetry: () => void;
}

/**
 * Supported error types for user-friendly messaging
 */
type ErrorType = 'network' | 'timeout' | 'server' | 'generic';

// ===== Error Type Detection =====

/**
 * Detect error type from error object for user-friendly messaging
 * 
 * @param error - Error object to analyze
 * @returns ErrorType classification
 */
const detectErrorType = (error: Error): ErrorType => {
    const message = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Network errors - connection issues
    if (
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        errorName.includes('networkerror') ||
        message.includes('connection') ||
        message.includes('offline')
    ) {
        return 'network';
    }

    // Timeout errors
    if (
        message.includes('timeout') ||
        message.includes('timed out') ||
        errorName.includes('timeout')
    ) {
        return 'timeout';
    }

    // Server errors (5xx)
    if (
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('server error') ||
        message.includes('internal server')
    ) {
        return 'server';
    }

    // Generic fallback
    return 'generic';
};

/**
 * Get user-friendly error message based on error type
 * 
 * @param errorType - Detected error type
 * @param originalMessage - Original error message for generic errors
 * @returns User-friendly error message
 */
const getUserFriendlyMessage = (errorType: ErrorType, originalMessage: string): string => {
    switch (errorType) {
        case 'network':
            return 'Connection failed. Please check your internet connection and try again.';

        case 'timeout':
            return 'The request timed out. Please try again.';

        case 'server':
            return "We're experiencing server issues. Our team is working on it. Please try again in a moment.";

        case 'generic':
        default:
            // Use original message if it's user-friendly, otherwise use generic fallback
            return originalMessage || 'An unexpected error occurred. Please try again.';
    }
};

/**
 * Get error title based on error type
 * 
 * @param errorType - Detected error type
 * @returns Error title
 */
const getErrorTitle = (errorType: ErrorType): string => {
    switch (errorType) {
        case 'network':
            return 'Connection Issue';

        case 'timeout':
            return 'Request Timeout';

        case 'server':
            return 'Server Error';

        case 'generic':
        default:
            return 'Something Went Wrong';
    }
};

// ===== Main Component =====

/**
 * ErrorState Component
 * 
 * Displays user-friendly error messages with retry functionality.
 * Automatically detects error type and shows appropriate messaging.
 * 
 * Features:
 * - Error type detection (network, timeout, server, generic)
 * - User-friendly error messages
 * - Retry button with callback
 * - Optional "Contact Support" link
 * - Professional, non-alarming design
 * - Responsive layout
 * 
 * @param props - ErrorStateProps
 * @returns Error state UI
 */
const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
    const errorType = detectErrorType(error);
    const errorTitle = getErrorTitle(errorType);
    const errorMessage = getUserFriendlyMessage(errorType, error.message);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Error Card */}
                <div
                    className="bg-white border-2 border-red-300 rounded-2xl shadow-lg p-8"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Error Icon */}
                        <div
                            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                            aria-hidden="true"
                        >
                            <svg
                                className="w-10 h-10 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Title & Message */}
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {errorTitle}
                            </h2>
                            <p className="text-gray-700 text-lg max-w-md mx-auto">
                                {errorMessage}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            {/* Retry Button */}
                            <button
                                onClick={onRetry}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label="Retry loading"
                            >
                                <span className="flex items-center space-x-2">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    <span>Try Again</span>
                                </span>
                            </button>

                            {/* Contact Support Link */}
                            <a
                                href="mailto:support@skillpassport.com?subject=Dashboard Error"
                                className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                aria-label="Contact support"
                            >
                                <span className="flex items-center space-x-2">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>Contact Support</span>
                                </span>
                            </a>
                        </div>

                        {/* Technical Details (for developers/support) */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-6 text-left w-full max-w-md">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
                                    Technical Details
                                </summary>
                                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 font-mono break-words">
                                        <strong>Error Type:</strong> {errorType}
                                    </p>
                                    <p className="text-xs text-gray-600 font-mono break-words mt-2">
                                        <strong>Error Name:</strong> {error.name}
                                    </p>
                                    <p className="text-xs text-gray-600 font-mono break-words mt-2">
                                        <strong>Original Message:</strong> {error.message}
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>
                </div>

                {/* Additional Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        If the problem persists, please contact our support team for assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ErrorState;
