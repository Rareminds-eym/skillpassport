import React from 'react';

const ListSkeleton = ({ rows = 5, showAvatar = false, className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
          {showAvatar && (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;