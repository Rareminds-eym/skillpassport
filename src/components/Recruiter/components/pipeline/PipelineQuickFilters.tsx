import React from 'react';
import {
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface PipelineQuickFiltersProps {
  showAIRecommendedOnly: boolean;
  setShowAIRecommendedOnly: (value: boolean) => void;
  totalCandidates: number;
  totalAIRecommended: number;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  onShowToast: (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string
  ) => void;
}

export const PipelineQuickFilters: React.FC<PipelineQuickFiltersProps> = ({
  showAIRecommendedOnly,
  setShowAIRecommendedOnly,
  totalCandidates,
  totalAIRecommended,
  globalSearch,
  setGlobalSearch,
  onShowToast,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Quick Filters:
        </span>
        <button
          onClick={() => {
            setShowAIRecommendedOnly(false);
            onShowToast('info', 'Filter', 'Showing all candidates');
          }}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !showAIRecommendedOnly
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <CheckIcon className="h-3 w-3 mr-1" />
          All Candidates ({totalCandidates})
        </button>
        {/* AI Recommended Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200">
          <SparklesIcon className="h-3 w-3 mr-1 text-purple-500" />
          AI Recommended ({totalAIRecommended})
        </div>
        <button
          onClick={() =>
            onShowToast('info', 'Coming Soon', 'Overdue actions filter will be available soon')
          }
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ClockIcon className="h-3 w-3 mr-1 text-orange-500" />
          Overdue Actions
        </button>
        <button
          onClick={() =>
            onShowToast('info', 'Coming Soon', 'Needs attention filter will be available soon')
          }
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-yellow-500" />
          Needs Attention
        </button>
        <button
          onClick={() =>
            onShowToast('info', 'Coming Soon', 'High priority filter will be available soon')
          }
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <StarIcon className="h-3 w-3 mr-1 text-red-500" />
          High Priority
        </button>
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch('')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
            Search: "{globalSearch}"
            <XMarkIcon className="h-3 w-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PipelineQuickFilters;
