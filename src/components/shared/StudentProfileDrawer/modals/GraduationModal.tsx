import React from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Trophy } from 'lucide-react';
import { Student } from '../types';

interface GraduationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onGraduate: () => void;
  loading: boolean;
}

const GraduationModal: React.FC<GraduationModalProps> = ({
  isOpen,
  onClose,
  student,
  onGraduate,
  loading,
}) => {
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
            <h3 className="text-lg font-medium text-gray-900">Mark as Graduate</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
              <Trophy className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Mark <strong>{student.name}</strong> as Graduate
                </p>
                <p className="text-sm text-gray-600">
                  {student.dept || student.branch_field || 'Course'} - Final Semester Completed
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Graduation Confirmation</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      This action will mark the student as graduated and update their enrollment
                      status. This action cannot be easily undone.
                    </p>
                  </div>
                </div>
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
              onClick={onGraduate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark as Graduate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraduationModal;
