import { GraduationCap, Flag } from 'lucide-react';

/**
 * Nike-style Learning Progress Bar
 * @param {Object} props
 * @param {number} props.progress - Progress percentage (0-100) for card variant
 * @param {number} props.total - Total courses for overview variant
 * @param {number} props.completed - Completed courses for overview variant
 * @param {"overview" | "card"} props.variant - "overview" for page-level, "card" for inside course cards
 */
const LearningProgressBar = ({
  progress = 0,
  total = 0,
  completed = 0,
  variant = 'overview',
  completedModules = 0,
  totalModules = 0,
}) => {
  // Calculate progress based on variant
  // For card variant: use modules if available, otherwise use progress prop
  const progressPercent =
    variant === 'card'
      ? totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : progress
      : total > 0
        ? Math.round((completed / total) * 100)
        : 0;

  // Card variant - compact Nike-style progress bar for inside course cards
  if (variant === 'card') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {/* Progress Bar Container - Added horizontal padding for icon visibility at edges */}
        <div className="relative pt-8 pb-4 px-4">
          {/* Track Background */}
          <div className="relative h-2 bg-gray-200 rounded-full">
            {/* Filled Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Learning Icon - Positioned at exact progress point */}
            <div
              className="absolute -top-8 transform -translate-x-1/2 transition-all duration-500 ease-out"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="relative">
                {/* Icon Container */}
                <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-500 shadow-md flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                {/* Connector line */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-blue-500" />
              </div>
            </div>
          </div>

          {/* Start and End Labels */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs font-medium text-gray-500">0%</span>
            <span className="text-xs font-medium text-gray-500">100%</span>
          </div>
        </div>

        {/* Current Progress - Centered */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
            <span className="text-sm font-bold text-blue-700">{progressPercent}%</span>
            <span className="text-xs text-blue-600">Complete</span>
          </span>
        </div>

        {/* Modules Info - Show if available */}
        {totalModules > 0 && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              {completedModules} of {totalModules} modules completed
            </span>
          </div>
        )}
      </div>
    );
  }

  // Overview variant - original page-level progress bar
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Progress Bar Container */}
      <div className="relative pt-8 pb-10">
        {/* Track Background */}
        <div className="relative h-2 bg-gray-200 rounded-full">
          {/* Filled Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Learning Icon - Positioned at progress point */}
          <div
            className="absolute -top-10 transform -translate-x-1/2 transition-all duration-500 ease-out"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="relative">
              {/* Icon Container */}
              <div className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 shadow-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              {/* Connector line */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-blue-500" />
            </div>
          </div>
        </div>

        {/* Start and End Labels */}
        <div className="flex justify-between items-center mt-4">
          {/* Start Label */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-600">0</span>
          </div>

          {/* End Label with Flag */}
          <div className="flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-600">{total} Courses</span>
          </div>
        </div>

        {/* Current Progress Badge - Centered below */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <span className="text-sm font-bold text-blue-700">{completed} Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningProgressBar;
