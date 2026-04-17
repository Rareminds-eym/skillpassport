import React from 'react';
import CardSkeleton from './CardSkeleton';

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={5} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;