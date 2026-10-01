import { memo } from "react";

/**
 * Reusable skeleton loader for any tab content
 * Displays placeholder UI while tab data is loading
 * 
 * @param {Object} props
 * @param {('simple'|'form'|'list'|'grid')} props.variant - Skeleton layout variant
 * @param {number} props.rows - Number of content rows to show (default: 3)
 */
const TabSkeleton = memo(({ variant = 'form', rows = 3 }) => {
  const renderSimple = () => (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>

      {/* List Items */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 bg-white border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Grid Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows * 3 }).map((_, i) => (
          <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div role="status" aria-label="Loading section" className="animate-pulse">
      {variant === 'simple' && renderSimple()}
      {variant === 'form' && renderForm()}
      {variant === 'list' && renderList()}
      {variant === 'grid' && renderGrid()}
    </div>
  );
});

TabSkeleton.displayName = 'TabSkeleton';

export default TabSkeleton;
