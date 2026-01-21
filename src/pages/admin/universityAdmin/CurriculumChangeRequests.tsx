/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { curriculumChangeRequestService } from '../../../services/curriculumChangeRequestService';

interface ChangeRequest {
  curriculum_id: string;
  curriculum_name: string;
  college_name: string;
  change_id: string;
  change_type: string;
  timestamp: string;
  requester_name: string;
  request_message: string;
  change_data: any;
}

const CurriculumChangeRequests: React.FC = () => {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<ChangeRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchPendingChanges();
  }, []);

  const fetchPendingChanges = async () => {
    setLoading(true);
    try {
      // Get university ID from current user
      // For now, we'll fetch all - you should filter by university_id
      const result = await curriculumChangeRequestService.getAllPendingChangesForUniversity(
        'your-university-id' // Replace with actual university ID
      );

      if (result.success && result.data) {
        setChanges(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending changes:', error);
      toast.error('Failed to load pending changes');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (change: ChangeRequest, action: 'approve' | 'reject') => {
    setSelectedChange(change);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedChange) return;

    if (reviewAction === 'reject' && !reviewNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const result =
        reviewAction === 'approve'
          ? await curriculumChangeRequestService.approveChange(
              selectedChange.curriculum_id,
              selectedChange.change_id,
              reviewNotes
            )
          : await curriculumChangeRequestService.rejectChange(
              selectedChange.curriculum_id,
              selectedChange.change_id,
              reviewNotes
            );

      if (result.success) {
        toast.success(`Change ${reviewAction}d successfully!`);
        setShowReviewModal(false);
        setReviewNotes('');
        setSelectedChange(null);
        fetchPendingChanges();
      } else {
        toast.error(result.error || `Failed to ${reviewAction} change`);
      }
    } catch (error) {
      console.error(`Error ${reviewAction}ing change:`, error);
      toast.error(`Failed to ${reviewAction} change`);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'unit_add':
        return '➕';
      case 'unit_edit':
        return '📝';
      case 'unit_delete':
        return '🗑️';
      case 'outcome_add':
        return '➕';
      case 'outcome_edit':
        return '📝';
      case 'outcome_delete':
        return '🗑️';
      case 'curriculum_edit':
        return '📋';
      default:
        return '📄';
    }
  };

  const getChangeColor = (changeType: string) => {
    if (changeType.includes('delete')) return 'text-red-600 bg-red-50 border-red-200';
    if (changeType.includes('edit')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (changeType.includes('add')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading pending changes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Curriculum Change Requests</h1>
          <p className="text-gray-600">Review and approve changes from affiliated colleges</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{changes.length}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Changes List */}
        {changes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Changes</h3>
            <p className="text-gray-600">All curriculum change requests have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <div
                key={change.change_id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{getChangeIcon(change.change_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getChangeColor(change.change_type)}`}
                        >
                          {change.change_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{change.college_name}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {change.curriculum_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Requested by {change.requester_name} •{' '}
                        {new Date(change.timestamp).toLocaleDateString()}
                      </p>
                      {change.request_message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {change.request_message}
                          </p>
                        </div>
                      )}
                      {/* Show change details */}
                      {change.change_data.before && change.change_data.after && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-red-50 rounded p-3">
                            <p className="font-medium text-red-900 mb-2">Before:</p>
                            <pre className="text-xs text-red-700 whitespace-pre-wrap">
                              {JSON.stringify(change.change_data.before, null, 2)}
                            </pre>
                          </div>
                          <div className="bg-green-50 rounded p-3">
                            <p className="font-medium text-green-900 mb-2">After:</p>
                            <pre className="text-xs text-green-700 whitespace-pre-wrap">
                              {JSON.stringify(change.change_data.after, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleReview(change, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(change, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowReviewModal(false)}
            />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {reviewAction === 'approve' ? 'Approve' : 'Reject'} Change Request
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{selectedChange.curriculum_name}</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div
                  className={`mb-4 p-4 rounded-lg border ${
                    reviewAction === 'approve'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {reviewAction === 'approve' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div
                      className={`text-sm ${
                        reviewAction === 'approve' ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      <p className="font-medium mb-1">
                        {reviewAction === 'approve'
                          ? 'Approving this change will apply it to the published curriculum'
                          : 'Rejecting this change will notify the college admin'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes{' '}
                    {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Add any notes about this approval (optional)...'
                        : 'Explain why this change is being rejected...'
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewAction === 'reject' && !reviewNotes.trim()}
                    className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {reviewAction === 'approve' ? 'Approve Change' : 'Reject Change'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumChangeRequests;
