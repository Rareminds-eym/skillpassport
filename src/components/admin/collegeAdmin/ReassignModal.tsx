import React, { useState } from 'react';
import {
  XMarkIcon,
  UserGroupIcon,
  UserIcon,
  ExclamationTriangleIcon,
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

interface MentorAllocation {
  id: number;
  mentorId: number;
  students: Student[];
  allocationPeriod: {
    startDate: string;
    endDate: string;
  };
  capacity: number;
  officeLocation: string;
  availableHours: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  academicYear: string;
  semester: string;
}

interface Mentor {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  specializations?: string[];
  contactNumber?: string;
  allocations: MentorAllocation[];
}

interface ReassignModalProps {
  student: Student;
  mentors: Mentor[];
  onClose: () => void;
  onReassign: (mentorId: number, periodId: number) => void;
  // Helper functions passed from parent
  getMentorCurrentLoad: (mentorId: number) => number;
  getMentorActiveAllocations: (mentorId: number) => MentorAllocation[];
}

const ReassignModal: React.FC<ReassignModalProps> = ({
  student,
  mentors,
  onClose,
  onReassign,
  getMentorCurrentLoad,
  getMentorActiveAllocations,
}) => {
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  // Get available periods for selected mentor
  const availablePeriods = selectedMentorId ? getMentorActiveAllocations(selectedMentorId) : [];

  const availableMentors = mentors.filter((m: Mentor) => {
    const activeAllocations = getMentorActiveAllocations(m.id);

    // Check if mentor doesn't already have this student
    const hasStudent = activeAllocations.some((allocation) =>
      allocation.students.some((s) => s.id === student.id)
    );

    return !hasStudent && activeAllocations.length > 0;
  });

  const selectedMentor = availableMentors.find((m: Mentor) => m.id === selectedMentorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Reassign Student</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Student Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Student to Reassign
              </label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      {student.rollNo} • {student.batch}
                    </p>
                    <p className="text-sm text-gray-600">CGPA: {student.cgpa}</p>
                  </div>
                  {student.atRisk && (
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-600">At-Risk</span>
                    </div>
                  )}
                </div>
                {student.riskFactors && student.riskFactors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.riskFactors.map((factor: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mentor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select New Mentor
              </label>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {availableMentors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No mentors available with capacity</p>
                  </div>
                ) : (
                  availableMentors.map((mentor: Mentor) => (
                    <label
                      key={mentor.id}
                      className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedMentorId === mentor.id
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="mentor"
                          value={mentor.id}
                          checked={selectedMentorId === mentor.id}
                          onChange={() => setSelectedMentorId(mentor.id)}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{mentor.name}</p>
                            <p className="text-sm text-gray-600">{mentor.designation}</p>
                            <p className="text-xs text-gray-500">{mentor.department}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Period Selection - Show only if mentor is selected */}
            {selectedMentorId && availablePeriods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Mentoring Period
                </label>
                <div className="space-y-3">
                  {availablePeriods.map((allocation: MentorAllocation) => {
                    const currentLoad = allocation.students.length;
                    const maxCapacity = allocation.capacity;
                    const hasCapacity = currentLoad < maxCapacity;
                    const isCurrentPeriod =
                      new Date() >= new Date(allocation.allocationPeriod.startDate) &&
                      new Date() <= new Date(allocation.allocationPeriod.endDate);

                    return (
                      <label
                        key={allocation.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          !hasCapacity ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        } ${
                          selectedPeriodId === allocation.id
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="radio"
                            name="period"
                            value={allocation.id}
                            checked={selectedPeriodId === allocation.id}
                            onChange={() => setSelectedPeriodId(allocation.id)}
                            disabled={!hasCapacity}
                            className="h-4 w-4 text-indigo-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{allocation.academicYear}</p>
                              {isCurrentPeriod && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(allocation.allocationPeriod.startDate).toLocaleDateString()}{' '}
                              - {new Date(allocation.allocationPeriod.endDate).toLocaleDateString()}
                            </p>
                            {allocation.officeLocation && (
                              <p className="text-xs text-gray-500 mt-1">
                                Office: {allocation.officeLocation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`text-sm font-medium ${hasCapacity ? 'text-gray-900' : 'text-red-600'}`}
                          >
                            {currentLoad}/{maxCapacity}
                          </p>
                          <p className="text-xs text-gray-500">Capacity</p>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                !hasCapacity
                                  ? 'bg-red-500'
                                  : currentLoad >= maxCapacity * 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min((currentLoad / maxCapacity) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          {!hasCapacity && <p className="text-xs text-red-600 mt-1">Full</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                selectedMentorId &&
                selectedPeriodId &&
                onReassign(selectedMentorId, selectedPeriodId)
              }
              disabled={!selectedMentorId || !selectedPeriodId}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reassign Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReassignModal;
