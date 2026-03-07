import { useEffect } from 'react';
import { useErrorNotification, useAuthActions } from '../stores';

/**
 * TokenRefreshErrorNotification Component
 * 
 * Displays error notifications for token refresh failures.
 * Integrates with authStore to show user-friendly error messages.
 */
export const TokenRefreshErrorNotification = () => {
  const errorNotification = useErrorNotification();
  const { dismissErrorNotification } = useAuthActions();

  // Auto-dismiss info notifications after 5 seconds
  useEffect(() => {
    if (errorNotification && errorNotification.type === 'info') {
      const timer = setTimeout(() => {
        dismissErrorNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorNotification, dismissErrorNotification]);

  if (!errorNotification) {
    return null;
  }

  const { title, message, type, action } = errorNotification;

  // Determine styling based on notification type
  const bgColor = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }[type] || 'bg-gray-50 border-gray-200';

  const textColor = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }[type] || 'text-gray-800';

  const iconColor = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }[type] || 'text-gray-400';

  const buttonColor = {
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }[type] || 'bg-gray-600 hover:bg-gray-700';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div className={`${bgColor} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            {type === 'error' && (
              <svg
                className={`h-6 w-6 ${iconColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {type === 'warning' && (
              <svg
                className={`h-6 w-6 ${iconColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {type === 'info' && (
              <svg
                className={`h-6 w-6 ${iconColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
            <p className={`mt-1 text-sm ${textColor} opacity-90`}>{message}</p>

            {/* Action buttons */}
            {action && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    action.handler();
                    dismissErrorNotification();
                  }}
                  className={`${buttonColor} text-white px-3 py-1.5 rounded text-sm font-medium transition-colors`}
                >
                  {action.label}
                </button>
                <button
                  onClick={dismissErrorNotification}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Dismiss button (if no action) */}
            {!action && (
              <button
                onClick={dismissErrorNotification}
                className="mt-2 text-sm underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={dismissErrorNotification}
            className={`ml-3 flex-shrink-0 ${textColor} opacity-50 hover:opacity-100 transition-opacity`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenRefreshErrorNotification;
