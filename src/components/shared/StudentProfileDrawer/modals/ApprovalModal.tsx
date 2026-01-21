import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Student } from '../types';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onApprove: (action: 'approve' | 'reject', reason?: string) => void;
  onReject: (action: 'approve' | 'reject', reason?: string) => void;
  loading: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  student,
  onApprove,
  onReject,
  loading,
}) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove('approve', reason);
    } else if (action === 'reject') {
      onReject('reject', reason);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Student Verification</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Review and verify the enrollment status for <strong>{student.name}</strong>
              </p>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value as 'approve')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                    Approve Enrollment
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value as 'reject')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                    Reject Enrollment
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason/Comments (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter reason for approval/rejection..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !action}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : action === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400'
              }`}
            >
              {loading
                ? 'Processing...'
                : action === 'approve'
                  ? 'Approve'
                  : action === 'reject'
                    ? 'Reject'
                    : 'Select Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
