import React, { useEffect } from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface CandidateQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onFullView?: () => void;
  onSendEmail?: (candidate: any) => void;
  onScheduleCall?: (candidate: any) => void;
  onNextAction?: (candidate: any) => void;
}

export const CandidateQuickView: React.FC<CandidateQuickViewProps> = ({
  isOpen,
  onClose,
  candidate,
  onFullView,
  onSendEmail,
  onScheduleCall,
  onNextAction,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Candidate Profile</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Profile Section */}
            <div className="flex items-start space-x-4 mb-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getInitials(candidate.name || 'NA')}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{candidate.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    <span>{candidate.dept}</span>
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-2" />
                    <span>{candidate.college}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{candidate.location || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* AI Score */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 border-2 border-yellow-400">
                  <div className="text-center">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current mx-auto mb-0.5" />
                    <span className="text-lg font-bold text-yellow-700">
                      {candidate.ai_score_overall || 0}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">AI Score</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">{candidate.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">{candidate.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills & Expertise</h4>
              {candidate.skills && candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No skills listed</p>
              )}
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Current Stage</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {candidate.stage?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                {candidate.last_updated && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {new Date(candidate.last_updated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.source && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Source</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {candidate.source.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Action */}
            {candidate.next_action && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Next Action</h4>
                    <p className="text-sm text-blue-700">{candidate.next_action}</p>
                    {candidate.next_action_date && (
                      <p className="text-xs text-blue-600 mt-1">
                        Due: {new Date(candidate.next_action_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Action Buttons */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onFullView?.()}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View Full Profile →
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => onSendEmail?.(candidate)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => onScheduleCall?.(candidate)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call
                </button>
                <button
                  onClick={() => onNextAction?.(candidate)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Set Next Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
