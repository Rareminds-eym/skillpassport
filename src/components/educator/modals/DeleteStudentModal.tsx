import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { softDeleteStudent } from '../../../services/studentService';
import { getCurrentEducatorId } from '../../../services/educatorService';
import { usePermission } from '../../../hooks/usePermissions';

interface Student {
  id: string;
  name: string;
  email?: string;
  dept?: string;
  college?: string;
}

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: () => void;
}

const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  // Permission check
  const {
    allowed: canDeleteStudents,
    reason: deleteReason,
    loading: permissionLoading,
  // @ts-expect-error - Auto-suppressed for migration
  } = usePermission('Students', 'edit');

  // Show access denied if user doesn't have permission
  if (!permissionLoading && !canDeleteStudents) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XMarkIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">
                {deleteReason || "You don't have permission to delete students."}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current educator's ID
      const educatorId = await getCurrentEducatorId();

      if (!educatorId) {
        setError('Could not identify the educator. Please try logging in again.');
        setLoading(false);
        return;
      }

      // Perform soft delete with educator ID
      const result = await softDeleteStudent(student.id, educatorId);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header with Warning Icon */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-gray-900">{student?.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action will soft delete the student from the system. The record will be
                  marked as deleted but can be restored later if needed.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-auto"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Student Info Card */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{student?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-900">{student?.dept || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">College:</span>
                <span className="font-medium text-gray-900">{student?.college || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder="Type DELETE"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Warning Note */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This is a soft delete. The student data will not be permanently
              removed from the database and can be restored by an administrator if needed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText.toLowerCase() !== 'delete'}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudentModal;
