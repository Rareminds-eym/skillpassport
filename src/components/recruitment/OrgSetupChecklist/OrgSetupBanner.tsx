import { CheckCircle2, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface OrgSetupBannerProps {
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  onOpenModal: () => void;
  onDismiss: () => void;
}

export const OrgSetupBanner: React.FC<OrgSetupBannerProps> = ({
  completedSteps,
  totalSteps,
  progressPercentage,
  onOpenModal,
  onDismiss,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm
        transition-all duration-300 ease-in-out
        ${isClosing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon + Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Complete Your Organization Setup
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {completedSteps === 0
                ? 'Get started by completing these simple steps to activate your recruitment workspace.'
                : completedSteps === totalSteps
                  ? '🎉 All done! Your organization is ready to go.'
                  : `You're ${progressPercentage}% there! Complete the remaining steps to unlock full features.`}
            </p>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
          </div>
        </div>

        {/* Right: CTA + Close */}
        <div className="flex items-start gap-2 flex-shrink-0">
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Continue Setup
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
