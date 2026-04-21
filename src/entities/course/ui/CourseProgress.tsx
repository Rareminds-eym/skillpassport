/**
 * Course Entity - CourseProgress Component
 * Displays course progress bar and status
 */

import React from 'react';
import { getCourseProgressStatus } from '../model/utils';

interface CourseProgressProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const CourseProgress: React.FC<CourseProgressProps> = ({
  progress,
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const { status, label } = getCourseProgressStatus(progress);
  
  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'in-progress') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-semibold text-gray-900">{progress}%</span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${getProgressColor()} ${sizeClasses[size]} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
