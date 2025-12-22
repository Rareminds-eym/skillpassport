import React from 'react';
import { XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { Student } from '../types';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onPromote: () => void;
  loading: boolean;
  currentSemester: number;
  nextSemester: number;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onPromote, 
  loading, 
  currentSemester, 
  nextSemester 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Promote to Next Semester</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <ArrowUpIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Promote <strong>{student.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  From Semester {currentSemester} → Semester {nextSemester}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Confirm Promotion
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This action will promote the student to the next semester. Make sure all current semester requirements are completed.</p>
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
              onClick={onPromote}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Promoting...' : 'Promote Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;