import React from 'react';

const PageSkeleton = ({ hasHeader = true, hasSidebar = false }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {hasHeader && (
        <div className="bg-white border-b border-gray-200 p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      )}
      
      <div className={`p-6 ${hasSidebar ? 'flex gap-6' : ''}`}>
        {hasSidebar && (
          <div className="w-64 space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        )}
        
        <div className="flex-1 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;