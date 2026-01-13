import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
}

interface InterventionModalProps {
  student: Student | null;
  noteText: string;
  noteOutcome: string;
  interventionType: 'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other';
  isPrivateNote: boolean;
  noteStatus: 'pending' | 'in-progress' | 'completed' | 'escalated';
  onNoteChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onInterventionTypeChange: (value: string) => void;
  onPrivateChange: (value: boolean) => void;
  onStatusChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const InterventionModal: React.FC<InterventionModalProps> = ({
  student,
  noteText,
  noteOutcome,
  interventionType,
  isPrivateNote,
  noteStatus,
  onNoteChange,
  onOutcomeChange,
  onInterventionTypeChange,
  onPrivateChange,
  onStatusChange,
  onClose,
  onSave,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Mentoring Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-900 font-medium">{student?.name}</p>
                <p className="text-sm text-gray-600">{student?.rollNo} • {student?.batch}</p>
                <p className="text-sm text-gray-600">CGPA: {student?.cgpa}</p>
              </div>
              <div>
                {student?.atRisk && (
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">At-Risk Student</span>
                  </div>
                )}
                {student?.riskFactors && student.riskFactors.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.riskFactors.map((factor: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Intervention Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervention Type *
              </label>
              <select
                value={interventionType}
                onChange={(e) => onInterventionTypeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="academic">Academic Support</option>
                <option value="personal">Personal Counseling</option>
                <option value="career">Career Guidance</option>
                <option value="attendance">Attendance Issues</option>
                <option value="behavioral">Behavioral Concerns</option>
                <option value="financial">Financial Support</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={noteStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervention Notes *
            </label>
            <textarea
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the intervention, discussion points, student response, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome/Action Taken
            </label>
            <input
              type="text"
              value={noteOutcome}
              onChange={(e) => onOutcomeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Improved study plan created, Referred to counselor, Career path discussed"
            />
          </div>

          {/* Privacy Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="privateNote"
                checked={isPrivateNote}
                onChange={(e) => onPrivateChange(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <label htmlFor="privateNote" className="text-sm text-gray-700">
                Mark as private note (visible only to mentor and admin)
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!noteText}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterventionModal;