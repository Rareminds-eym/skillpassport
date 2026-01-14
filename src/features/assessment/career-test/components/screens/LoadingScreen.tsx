/**
 * LoadingScreen Component
 * 
 * Displays a loading indicator while assessment data is being fetched.
 * 
 * @module features/assessment/career-test/components/screens/LoadingScreen
 */

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Simple loading screen with spinner
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
