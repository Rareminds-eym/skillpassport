import React, { useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { ConfirmModal } from '../../shared/ConfirmModal';

interface InterventionFeedbackModalProps {
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
    outcome?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
    created_at: string;
    last_updated_at?: string;
  };
  studentName: string;
  mentorName: string;
  onClose: () => void;
  onSave: (feedback: {
    admin_feedback?: string;
    status?: string;
    priority?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
  }) => Promise<void>;
  onResolve?: () => Promise<void>;
}

const InterventionFeedbackModal: React.FC<InterventionFeedbackModalProps> = ({
  note,
  studentName,
  mentorName,
  onClose,
  onSave,
  onResolve,
}) => {
  const [adminFeedback, setAdminFeedback] = useState(note.admin_feedback || '');
  const [priority, setPriority] = useState(note.priority || 'medium');
  const [followUpRequired, setFollowUpRequired] = useState(note.follow_up_required || false);
  const [followUpDate, setFollowUpDate] = useState(note.follow_up_date || '');
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Determine if admin can give feedback (only when status = 'acknowledged')
  const canGiveFeedback = note.status === 'acknowledged';

  // Determine if admin can resolve (only when status = 'in_progress')
  const canResolve = note.status === 'in_progress';

  // Check if educator has responded
  const hasEducatorResponse = note.educator_response || note.action_taken || note.next_steps;

  const handleSave = async () => {
    // Validate that we can give feedback
    if (!canGiveFeedback) {
      alert(
        `Cannot give feedback: Note must be in 'acknowledged' status (current: '${note.status}')`
      );
      return;
    }

    setSaving(true);
    try {
      // Server will auto-transition status from 'acknowledged' to 'in_progress'
      await onSave({
        admin_feedback: adminFeedback || undefined,
        priority,
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired ? followUpDate : undefined,
      });
      onClose();
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      const errorMessage = error?.message || 'Failed to save feedback. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!onResolve) return;

    // Validate that we can resolve
    if (!canResolve) {
      alert(`Cannot resolve: Note must be in 'in_progress' status (current: '${note.status}')`);
      return;
    }

    // Show confirmation modal instead of native confirm
    setShowConfirmModal(true);
  };

  const handleConfirmResolve = async () => {
    setSaving(true);
    try {
      // Server will validate status and transition to 'completed'
      await onResolve!();
      onClose();
    } catch (error: any) {
      console.error('Error resolving note:', error);
      const errorMessage = error?.message || 'Failed to resolve note. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priorityLevel: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priorityLevel as keyof typeof colors] || colors.medium;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      acknowledged: 'bg-cyan-100 text-cyan-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      escalated: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pending',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      completed: 'Completed',
      escalated: 'Escalated',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Intervention Conversation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Student: {studentName} • Mentor: {mentorName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Admin Note */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Your Original Note</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(note.priority || 'medium')}`}
                >
                  {(note.priority || 'medium').toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                  {note.intervention_type}
                </span>
              </div>
            </div>

            {note.title && <h4 className="font-medium text-gray-900 mb-2">{note.title}</h4>}

            <p className="text-gray-700 text-sm mb-3">{note.note_text}</p>

            {note.outcome && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Initial Outcome:</p>
                <p className="text-gray-700 text-sm">{note.outcome}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {new Date(note.note_date).toLocaleDateString()}
              </span>
              {note.follow_up_required && note.follow_up_date && note.status !== 'completed' && (
                <span className="flex items-center gap-1 text-orange-600">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  Follow-up: {new Date(note.follow_up_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Educator's Response Section */}
          {hasEducatorResponse ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <UserIcon className="h-5 w-5" />
                <h3 className="font-semibold">Educator's Response</h3>
              </div>

              {note.educator_response && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-2">Response:</p>
                  <p className="text-gray-700 text-sm">{note.educator_response}</p>
                </div>
              )}

              {note.action_taken && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-2">Action Taken:</p>
                  <p className="text-gray-700 text-sm">{note.action_taken}</p>
                </div>
              )}

              {note.next_steps && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-900 mb-2">Next Steps:</p>
                  <p className="text-gray-700 text-sm">{note.next_steps}</p>
                </div>
              )}

              {note.last_updated_at && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(note.last_updated_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : note.status === 'pending' ? (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Educator has not responded yet. They will be notified to review this intervention.
                </p>
              </div>
            </div>
          ) : null}

          {/* Current Status Display */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Status</p>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(note.status)}`}
            >
              {getStatusLabel(note.status)}
            </span>
          </div>

          {/* Workflow Guidance - Only show if not completed */}
          {note.status !== 'completed' && !canGiveFeedback && !canResolve && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Workflow Status</p>
                  <p className="text-sm text-blue-800 mt-1">
                    {note.status === 'pending' &&
                      'Waiting for educator to respond. You can give feedback once they acknowledge this note.'}
                    {note.status === 'escalated' &&
                      'This note has been escalated. Please review and take appropriate action.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Previous Admin Feedback (if exists) */}
          {note.admin_feedback && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Your Previous Feedback:</p>
              <p className="text-gray-700 text-sm">{note.admin_feedback}</p>
            </div>
          )}

          {/* Admin Feedback Form */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Provide Feedback to Educator</h3>
              {canGiveFeedback && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ Ready for feedback
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback</label>
              <textarea
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                rows={4}
                disabled={!canGiveFeedback}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={
                  canGiveFeedback
                    ? 'Provide guidance, acknowledgment, or additional instructions...'
                    : 'Feedback can be provided once educator responds'
                }
              />
              {canGiveFeedback && (
                <p className="text-xs text-gray-500 mt-1">
                  After saving, status will automatically change to "In Progress"
                </p>
              )}
            </div>

            {/* Show administrative controls only if no educator response yet */}
            {!hasEducatorResponse && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={!canGiveFeedback}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Follow-up Section */}
                {note.status !== 'completed' && (
                  <>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={followUpRequired}
                          onChange={(e) => setFollowUpRequired(e.target.checked)}
                          disabled={!canGiveFeedback}
                          className="h-4 w-4 text-indigo-600 rounded disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Requires follow-up
                        </span>
                      </label>
                    </div>

                    {followUpRequired && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={!canGiveFeedback}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {canResolve && onResolve && (
              <button
                onClick={handleResolve}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Mark as Resolved
              </button>
            )}
            {!canResolve && note.status !== 'completed' && (
              <div className="text-sm text-gray-500">
                {note.status === 'pending' && 'Waiting for educator response'}
                {note.status === 'acknowledged' && 'Give feedback to proceed'}
                {note.status === 'escalated' && 'Note is escalated'}
              </div>
            )}
            {note.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Intervention Completed</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {note.status === 'completed' ? 'Close' : 'Cancel'}
            </button>
            {canGiveFeedback && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Feedback'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmResolve}
        title="Mark as Resolved"
        message="Mark this intervention as resolved? This will set the status to completed."
        confirmText="Mark as Resolved"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
};

export default InterventionFeedbackModal;
