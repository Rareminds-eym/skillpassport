/**
 * Error Boundary for Profile Completion Modal
 * 
 * Provides graceful error handling specifically for the profile completion prompt feature.
 * Handles modal render errors and provides appropriate fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ProfileCompletionErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ProfileCompletionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for ProfileCompletionModal
 * Provides a fallback UI that matches the modal's design
 */
export class ProfileCompletionErrorBoundary extends Component<
  ProfileCompletionErrorBoundaryProps,
  ProfileCompletionErrorBoundaryState
> {
  constructor(props: ProfileCompletionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ProfileCompletionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      console.error('[ProfileCompletionErrorBoundary] Modal render error:', error, errorInfo);
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ProfileCompletionErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for profile completion modal errors
 * Matches the modal's visual design and provides retry functionality
 */
interface ProfileCompletionErrorFallbackProps {
  onRetry?: () => void;
}

const ProfileCompletionErrorFallback: React.FC<ProfileCompletionErrorFallbackProps> = ({
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Error Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Unable to load profile completion prompt
              </p>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            An error occurred while loading the profile completion prompt. 
            You can continue using your Digital Passport normally.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionErrorBoundary;