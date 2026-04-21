import React from 'react';

const BAR_HEIGHTS = [60, 80, 45, 90, 55, 70, 40];

const ChartSkeleton = ({ className = "", type = "bar" }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      
      {type === 'bar' && (
        <div className="space-y-4">
          <div className="flex items-end space-x-2 h-40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-gray-200 rounded-t flex-1"
                style={{ height: `${BAR_HEIGHTS[i]}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-8"></div>
            ))}
          </div>
        </div>
      )}
      
      {type === 'line' && (
        <div className="h-40 bg-gray-200 rounded relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
        </div>
      )}
      
      {type === 'pie' && (
        <div className="flex items-center justify-center h-40">
          <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default ChartSkeleton;