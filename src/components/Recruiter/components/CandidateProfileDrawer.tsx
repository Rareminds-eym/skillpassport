import React from 'react';
import { Candidate } from '../../../types/recruiter';

interface CandidateProfileDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateProfileDrawer: React.FC<CandidateProfileDrawerProps> = ({
  candidate,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Candidate Profile</h2>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close panel</span>
                {/* Add close icon here */}
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-500">{candidate.email}</p>
              </div>

              {/* Add more candidate details here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileDrawer;