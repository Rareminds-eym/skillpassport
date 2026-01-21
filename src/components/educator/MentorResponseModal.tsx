import React, { useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ShieldExclamationIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface MentorResponseModalProps {
  note: {
    id: string;
    title?: string;
    note_text: string;
    intervention_type: string;
    status: string;
    priority?: string;
    note_date: string;
    outcome?: string;
    admin_feedback?: string;
    educator_response?: string;
    action_taken?: string;
    next_steps?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
  };
  studentName: string;
  onClose: () => void;
  onSave: (response: {
    educator_response: string;
    action_taken?: string;
    next_steps?: string;
  }) => Promise<void>;
}

const MentorResponseModal: React.FC<MentorResponseModalProps> = ({
  note,
  studentName,
  onClose,
  onSave,
}) => {
  const [educatorResponse, setEducatorResponse] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [saving, setSaving] = useState(false);

  const canRespond = note.status === 'pending' && !note.educator_response;
  const isReadOnly = !canRespond;

  const handleSubmit = async () => {
    if (!educatorResponse.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        educator_response: educatorResponse.trim(),
        action_taken: actionTaken.trim() || undefined,
        next_steps: nextSteps.trim() || undefined,
      });
    } catch (error) {
      setSaving(false);
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[note.priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = () => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      acknowledged: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      escalated: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      colors[note.status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200'
    );
  };

  const getStatusLabel = () => {
    const labels = {
      pending: 'Pending',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      completed: 'Completed',
      escalated: 'Escalated',
    };
    return labels[note.status as keyof typeof labels] || note.status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: '75rem', maxHeight: '90vh' }}
      >
        {/* Header - Clean and Professional */}
        <div className="bg-white border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Student Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{studentName}</h2>
                  <p className="text-sm text-gray-600">Intervention Note</p>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusColor()}`}>
                    {getStatusLabel()}
                  </span>
                </div>
                {note.priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Priority:</span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${getPriorityBadge()}`}
                    >
                      {note.priority.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Type:</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold capitalize">
                    {note.intervention_type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(note.note_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            {/* LEFT COLUMN - Admin's Information */}
            <div className="bg-white border-r border-gray-200 p-6 space-y-6">
              {/* Section Header */}
              <div className="pb-3 border-b-2 border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-700">
                  <DocumentTextIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold uppercase tracking-wide">Admin's Request</h3>
                </div>
              </div>

              {/* Follow-up Alert */}
              {note.follow_up_required && note.follow_up_date && note.status !== 'completed' && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                  <div className="flex items-start gap-3">
                    <ClockIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Follow-up Required</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Due:{' '}
                        {new Date(note.follow_up_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin's Note */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Intervention Note
                  </h4>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {note.note_text}
                  </p>
                </div>
              </div>

              {/* Expected Outcome */}
              {note.outcome && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Expected Outcome
                    </h4>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {note.outcome}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Feedback */}
              {note.admin_feedback && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Admin's Feedback
                    </h4>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {note.admin_feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Mentor's Response */}
            <div className="bg-gray-50 p-6 space-y-6">
              {/* Section Header */}
              <div className="pb-3 border-b-2 border-purple-100">
                <div className="flex items-center gap-2 text-purple-700">
                  <PencilSquareIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold uppercase tracking-wide">Your Response</h3>
                </div>
              </div>

              {/* Status Alert - Only for Read-Only */}
              {isReadOnly && (
                <div
                  className={`border-l-4 p-4 ${
                    note.educator_response
                      ? 'bg-green-50 border-green-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {note.educator_response ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          note.educator_response ? 'text-green-900' : 'text-yellow-900'
                        }`}
                      >
                        {note.educator_response ? 'Response Submitted' : 'Response Not Available'}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          note.educator_response ? 'text-green-700' : 'text-yellow-700'
                        }`}
                      >
                        {note.educator_response
                          ? 'Your response has been submitted and locked.'
                          : `Status is "${getStatusLabel()}" - you can only respond when status is "Pending".`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Form or Display */}
              {canRespond ? (
                <div className="space-y-5">
                  {/* Response Field */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Your Response <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={educatorResponse}
                      onChange={(e) => setEducatorResponse(e.target.value)}
                      rows={7}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm bg-white"
                      placeholder="Describe your understanding, observations, and initial thoughts about this intervention..."
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {educatorResponse.length} characters
                    </p>
                  </div>

                  {/* Action Taken Field */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Action Taken <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm bg-white"
                      placeholder="What specific actions have you taken with this student?"
                      disabled={saving}
                    />
                  </div>

                  {/* Next Steps Field */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Next Steps <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm bg-white"
                      placeholder="What are your planned next steps and follow-up actions?"
                      disabled={saving}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Read-Only Response */}
                  {note.educator_response && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <LockClosedIcon className="h-4 w-4 text-gray-500" />
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          Your Response
                        </h4>
                      </div>
                      <div className="bg-white border border-gray-300 rounded-lg p-4">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {note.educator_response}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Read-Only Action Taken */}
                  {note.action_taken && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                        Action Taken
                      </h4>
                      <div className="bg-white border border-gray-300 rounded-lg p-4">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {note.action_taken}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Read-Only Next Steps */}
                  {note.next_steps && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                        Next Steps
                      </h4>
                      <div className="bg-white border border-gray-300 rounded-lg p-4">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {note.next_steps}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="bg-white border-t-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {canRespond && (
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Review carefully before submitting</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 font-semibold text-sm"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {canRespond && (
                <button
                  onClick={handleSubmit}
                  disabled={saving || !educatorResponse.trim()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 flex items-center gap-2 font-semibold text-sm shadow-sm"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Submit Response</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorResponseModal;
