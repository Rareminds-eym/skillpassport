import React, { useMemo } from 'react';
import { UserPlusIcon, ClipboardDocumentCheckIcon, PhoneIcon, DocumentTextIcon, CheckBadgeIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { getRandomQuote } from '@/utils/emptyStateQuotes';

interface EmptyStateProps {
  stage: string;
  onAddClick: () => void;
}

export const PipelineEmptyState: React.FC<EmptyStateProps> = ({ stage, onAddClick }) => {
  // Get a random motivational quote
  const quote = useMemo(() => getRandomQuote('pipelines'), []);

  const stageConfig = {
    sourced: {
      icon: UserPlusIcon,
      actionText: 'Add from Talent Pool',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    },
    screened: {
      icon: ClipboardDocumentCheckIcon,
      actionText: 'Add Candidates',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    interview_1: {
      icon: PhoneIcon,
      actionText: 'Add Candidates',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    interview_2: {
      icon: DocumentTextIcon,
      actionText: 'Add Candidates',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    offer: {
      icon: CheckBadgeIcon,
      actionText: 'Add Candidates',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    hired: {
      icon: TrophyIcon,
      actionText: 'Add Candidates',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    }
  };

  const config = stageConfig[stage] || stageConfig.sourced;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className={`${config.bgColor} rounded-full p-3 mb-3`}>
        <Icon className={`h-8 w-8 ${config.color}`} />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-4 max-w-xs">{quote}</p>
      <button
        onClick={onAddClick}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <UserPlusIcon className="h-3.5 w-3.5 mr-1.5" />
        {config.actionText}
      </button>
    </div>
  );
};

