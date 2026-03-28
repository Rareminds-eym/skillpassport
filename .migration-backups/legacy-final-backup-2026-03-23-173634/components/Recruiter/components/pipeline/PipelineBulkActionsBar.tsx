import React from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PipelineBulkActionsBarProps {
  selectedCandidates: number[];
  onBulkEmail: () => void;
  onBulkWhatsApp: () => void;
  onAssignInterviewer: () => void;
  onBulkReject: () => void;
  onClearSelection: () => void;
}

export const PipelineBulkActionsBar: React.FC<PipelineBulkActionsBarProps> = ({
  selectedCandidates,
  onBulkEmail,
  onBulkWhatsApp,
  onAssignInterviewer,
  onBulkReject,
  onClearSelection
}) => {
  const hasSelection = selectedCandidates.length > 0;

  return (
    <div className={`bg-white border-t-2 px-6 py-3 transition-colors ${
      hasSelection ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${
            hasSelection ? 'text-primary-700' : 'text-gray-500'
          }`}>
            {hasSelection 
              ? `${selectedCandidates.length} selected` 
              : 'No candidates selected'
            }
          </span>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkEmail}
              disabled={!hasSelection}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                hasSelection
                  ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
              }`}
            >
              <EnvelopeIcon className="h-4 w-4 mr-1.5" />
              Email
            </button>
            <button
              onClick={onBulkWhatsApp}
              disabled={!hasSelection}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                hasSelection
                  ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
              }`}
            >
              <PhoneIcon className="h-4 w-4 mr-1.5" />
              WhatsApp
            </button>
            <button
              onClick={onAssignInterviewer}
              disabled={!hasSelection}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                hasSelection
                  ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
              }`}
            >
              <UserIcon className="h-4 w-4 mr-1.5" />
              Assign
            </button>
            <button
              onClick={onBulkReject}
              disabled={!hasSelection}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                hasSelection
                  ? 'text-red-700 hover:bg-red-50 bg-white border border-red-200'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
              }`}
            >
              <XCircleIcon className="h-4 w-4 mr-1.5" />
              Reject
            </button>
            {hasSelection && (
              <button
                onClick={onClearSelection}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white border border-gray-300 transition-colors"
              >
                <XMarkIcon className="h-4 w-4 mr-1.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineBulkActionsBar;
