import React from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  ClockIcon,
  FlagIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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
  interventionType:
    | 'academic'
    | 'personal'
    | 'career'
    | 'attendance'
    | 'behavioral'
    | 'financial'
    | 'other';
  isPrivateNote: boolean;
  noteStatus: 'pending' | 'in-progress' | 'completed' | 'escalated';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  followUpRequired?: boolean;
  followUpDate?: string;
  onNoteChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onInterventionTypeChange: (value: string) => void;
  onPrivateChange: (value: boolean) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange?: (value: string) => void;
  onFollowUpRequiredChange?: (value: boolean) => void;
  onFollowUpDateChange?: (value: string) => void;
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
  priority = 'medium',
  followUpRequired = false,
  followUpDate = '',
  onNoteChange,
  onOutcomeChange,
  onInterventionTypeChange,
  onPrivateChange,
  onStatusChange,
  onPriorityChange,
  onFollowUpRequiredChange,
  onFollowUpDateChange,
  onClose,
  onSave,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Mentoring Note</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Document intervention and follow-up actions
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{student?.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {student?.rollNo} • {student?.batch}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {student?.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Semester</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {student?.semester}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CGPA</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{student?.cgpa}</p>
                    </div>
                  </div>

                  {student?.atRisk && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">At-Risk Student</span>
                      {student?.riskFactors && student.riskFactors.length > 0 && (
                        <span className="text-xs">• {student.riskFactors.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Intervention Configuration */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Intervention Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={interventionType}
                    onChange={(e) => onInterventionTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => onPriorityChange?.(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* STATUS DROPDOWN REMOVED - Admin-created notes always start with status='pending' */}
                {/* The workflow is: pending → acknowledged → in_progress → completed */}
                {/* Status is auto-managed by the system based on mentor/admin actions */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Follow-up
                  </label>
                  <div className="flex items-center h-[38px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={followUpRequired}
                        onChange={(e) => onFollowUpRequiredChange?.(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Requires follow-up</span>
                    </label>
                  </div>
                </div>

                {followUpRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Follow-up Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => onFollowUpDateChange?.(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Intervention Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Intervention Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => onNoteChange(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                  placeholder="Describe the intervention, discussion points, student response, and any observations..."
                />
                <p className="text-xs text-gray-500 mt-1">{noteText.length} characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expected Outcome / Action Plan
                </label>
                <input
                  type="text"
                  value={noteOutcome}
                  onChange={(e) => onOutcomeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Improved study plan created, Referred to counselor"
                />
              </div>
            </div>

            {/* Privacy Settings - COMMENTED OUT: Not needed as admin creates notes for educator to see
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <input
                type="checkbox"
                id="privateNote"
                checked={isPrivateNote}
                onChange={(e) => onPrivateChange(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="privateNote" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  Private Note
                </label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Only visible to administrators. The educator will not see this note.
                </p>
              </div>
            </div>
            */}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!noteText || (followUpRequired && !followUpDate)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterventionModal;
