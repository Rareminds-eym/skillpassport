import { memo } from "react";

/**
 * Skeleton loader for the Profile tab
 * Displays placeholder UI while profile data is loading
 */
const ProfileSkeleton = memo(() => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Sub-tab Navigation Skeleton */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-4 border-b border-gray-200">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 rounded-lg flex-shrink-0"></div>
        ))}
      </div>

      {/* Profile Content Skeleton */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-gray-100 rounded-lg space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* List Items (for education, experience, etc.) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileSkeleton.displayName = 'ProfileSkeleton';

export default ProfileSkeleton;
