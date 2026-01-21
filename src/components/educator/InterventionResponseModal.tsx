import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface InterventionResponseModalProps {
  note: {
    id: string;
    title?: string;
    note_text: string;
    intervention_type: string;
    status: string;
    priority?: string;
    note_date: string;
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
    educator_response?: string;
    action_taken?: string;
    next_steps?: string;
    status?: string;
  }) => Promise<void>;
}

const InterventionResponseModal: React.FC<InterventionResponseModalProps> = ({
  note,
  studentName,
  onClose,
  onSave,
}) => {
  const [educatorResponse, setEducatorResponse] = useState(note.educator_response || '');
  const [actionTaken, setActionTaken] = useState(note.action_taken || '');
  const [nextSteps, setNextSteps] = useState(note.next_steps || '');
  const [status, setStatus] = useState(note.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!educatorResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        educator_response: educatorResponse,
        action_taken: actionTaken || undefined,
        next_steps: nextSteps || undefined,
        status,
      });
      onClose();
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response. Please try again.');
    } finally {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Respond to Intervention</h2>
              <p className="text-gray-600 text-sm mt-0.5 flex items-center gap-1.5">
                <UserCircleIcon className="h-4 w-4" />
                {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Original Note from Admin */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 text-lg">Admin's Intervention Note</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {note.priority && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge()}`}
                  >
                    {note.priority.toUpperCase()}
                  </span>
                )}
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium capitalize">
                  {note.intervention_type}
                </span>
              </div>
            </div>

            {note.title && (
              <h4 className="font-semibold text-gray-900 mb-3 text-base">{note.title}</h4>
            )}

            <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
              {note.note_text}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600 pt-3 border-t border-blue-200">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                {new Date(note.note_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {note.follow_up_required && note.follow_up_date && (
                <span className="flex items-center gap-1.5 text-orange-700 font-medium bg-orange-50 px-2 py-1 rounded">
                  <ClockIcon className="h-4 w-4" />
                  Follow-up:{' '}
                  {new Date(note.follow_up_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Admin Feedback (if exists) */}
          {note.admin_feedback && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-purple-900 text-base">Admin's Feedback</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {note.admin_feedback}
              </p>
            </div>
          )}

          {/* Educator Response Form */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Response <span className="text-red-500">*</span>
              </label>
              <textarea
                value={educatorResponse}
                onChange={(e) => setEducatorResponse(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                placeholder="Describe your understanding, observations, and initial thoughts about this intervention..."
              />
              <p className="text-xs text-gray-500 mt-1.5">{educatorResponse.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Action Taken</label>
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                placeholder="What specific actions have you taken or plan to take with this student?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Next Steps</label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                placeholder="What are your planned next steps and follow-up actions?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Update Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm font-medium"
              >
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="action_taken">Action Taken</option>
                <option value="escalated">Escalated</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Update the status to reflect your current progress on this intervention
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !educatorResponse.trim()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Save Response
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterventionResponseModal;
