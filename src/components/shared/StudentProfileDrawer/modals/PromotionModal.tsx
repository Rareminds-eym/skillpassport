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

          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <ArrowUpIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {student.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Student ID: {student.student_id || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Promotion Flow */}
              <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-gray-700">{currentSemester}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Current</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-green-400"></div>
                    <ArrowUpIcon className="h-5 w-5 text-green-500 mx-2" />
                    <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-green-400"></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 border-2 border-green-400 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-white">{nextSemester}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-2 font-medium">Next</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Important Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-amber-800">
                    Ready for Promotion
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Please ensure all current semester requirements and assessments are completed before proceeding with the promotion.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onPromote}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Promoting...
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-2" />
                  Promote Student
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;