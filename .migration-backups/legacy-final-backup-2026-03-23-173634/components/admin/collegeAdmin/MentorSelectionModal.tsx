import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import SearchBar from '../../common/SearchBar';

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

interface MentorSelectionModalProps {
  selectedStudents: Student[];
  mentors: Mentor[];
  onClose: () => void;
  onBack: () => void;
  onNext: (mentorId: number) => void;
  initialSelectedMentorId?: number | null;
  // Helper functions passed from parent
  getMentorCurrentLoad: (mentorId: number) => number;
  getMentorActiveAllocations: (mentorId: number) => MentorAllocation[];
}

const MentorSelectionModal: React.FC<MentorSelectionModalProps> = ({
  selectedStudents,
  mentors,
  onClose,
  onBack,
  onNext,
  initialSelectedMentorId = null,
  getMentorCurrentLoad,
  getMentorActiveAllocations,
}) => {
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(initialSelectedMentorId);
  const [searchTerm, setSearchTerm] = useState("");

  const availableMentors = mentors.filter((m: Mentor) => {
    const currentLoad = getMentorCurrentLoad(m.id);
    const activeAllocations = getMentorActiveAllocations(m.id);
    
    // For mentors with no allocations, assume default capacity of 15
    const maxCapacity = activeAllocations.length > 0 
      ? Math.max(...activeAllocations.map(a => a.capacity))
      : 15; // Default capacity for new mentors
    
    // Allow mentors with sufficient capacity (including new mentors with no allocations)
    return currentLoad + selectedStudents.length <= maxCapacity;
  });

  const filteredMentors = availableMentors.filter((m: Mentor) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNext = () => {
    if (selectedMentorId) {
      onNext(selectedMentorId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Select Mentor for {selectedStudents.length} Student(s)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a mentor with sufficient capacity
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 p-6">
          {/* Selected Students Summary */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Students</h3>
            <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-y-auto min-h-0">
              <div className="space-y-3">
                {selectedStudents.map((student: Student) => (
                  <div key={student.id} className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                      {student.atRisk && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          At Risk
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {student.rollNo} • {student.department}
                    </p>
                    <p className="text-xs text-gray-500">CGPA: {student.cgpa}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mentor Selection */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Available Mentors ({filteredMentors.length})</h3>
              <div className="flex-1 max-w-md ml-4">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search mentors..."
                  size="md"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded-lg">
              <div className="space-y-3 p-4">
                {filteredMentors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No mentors available with sufficient capacity</p>
                    <p className="text-sm mt-1">Required capacity: {selectedStudents.length} students</p>
                  </div>
                ) : (
                  filteredMentors.map((mentor: Mentor) => {
                    return (
                      <label
                        key={mentor.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedMentorId === mentor.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mentor"
                          value={mentor.id}
                          checked={selectedMentorId === mentor.id}
                          onChange={() => setSelectedMentorId(mentor.id)}
                          className="h-4 w-4 text-indigo-600 mt-1"
                        />
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{mentor.name}</p>
                            <p className="text-sm text-gray-600">{mentor.designation} • {mentor.department}</p>
                            {mentor.specializations && mentor.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {mentor.specializations.slice(0, 3).map((spec, index) => (
                                  <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                    {spec}
                                  </span>
                                ))}
                                {mentor.specializations.length > 3 && (
                                  <span className="text-xs text-gray-500">+{mentor.specializations.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Students
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedMentorId}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Set Allocation Period →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorSelectionModal;