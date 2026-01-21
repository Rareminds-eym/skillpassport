import React from 'react';

export const CandidateCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            {/* Department */}
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            {/* College */}
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Score */}
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
          {/* Menu button */}
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-gray-200 rounded"></div>
        <div className="h-3 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export const ColumnLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <CandidateCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const PipelineLoadingSkeleton: React.FC = () => {
  const stages = 6;
  return (
    <div className="flex space-x-6 h-full p-6">
      {Array.from({ length: stages }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 min-w-80">
          {/* Column header */}
          <div className="flex items-center justify-between mb-4 animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
              <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
          </div>
          {/* Cards */}
          <ColumnLoadingSkeleton count={2} />
        </div>
      ))}
    </div>
  );
};
