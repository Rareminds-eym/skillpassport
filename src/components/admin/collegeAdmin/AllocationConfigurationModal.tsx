import React, { useState } from 'react';
import { XMarkIcon, CalendarIcon, UserIcon, CogIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
  allocations: MentorAllocation[];
}

interface AllocationConfigurationModalProps {
  selectedStudents: Student[];
  selectedMentor: Mentor;
  onClose: () => void;
  onBack: () => void;
  onAllocate: (
    mentorId: number, 
    studentIds: number[], 
    allocationPeriod: {startDate: string; endDate: string},
    capacityConfig: {capacity: number; officeLocation: string; availableHours: string}
  ) => void;
  // Helper functions passed from parent
  getMentorCurrentLoad: (mentorId: number) => number;
  getMentorActiveAllocations: (mentorId: number) => MentorAllocation[];
  // All allocations for period checking
  allAllocations: MentorAllocation[];
}

const AllocationConfigurationModal: React.FC<AllocationConfigurationModalProps> = ({
  selectedStudents,
  selectedMentor,
  onClose,
  onBack,
  onAllocate,
  getMentorCurrentLoad,
  getMentorActiveAllocations,
  allAllocations,
}) => {
  const currentLoad = getMentorCurrentLoad(selectedMentor.id);
  const activeAllocations = getMentorActiveAllocations(selectedMentor.id);
  const latestAllocation = activeAllocations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  
  // Allocation Period State
  const [allocationPeriod, setAllocationPeriod] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months from now
  });
  const [periodError, setPeriodError] = useState("");

  // Capacity Configuration State
  const [capacityConfig, setCapacityConfig] = useState({
    capacity: latestAllocation?.capacity || 15,
    officeLocation: latestAllocation?.officeLocation || '',
    availableHours: latestAllocation?.availableHours || '',
  });
  const [capacityErrors, setCapacityErrors] = useState<{[key: string]: string}>({});

  const validatePeriod = () => {
    if (!allocationPeriod.startDate || !allocationPeriod.endDate) {
      setPeriodError("Both start and end dates are required");
      return false;
    }

    if (new Date(allocationPeriod.startDate) >= new Date(allocationPeriod.endDate)) {
      setPeriodError("End date must be after start date");
      return false;
    }

    if (new Date(allocationPeriod.endDate) < new Date()) {
      setPeriodError("End date cannot be in the past");
      return false;
    }

    // Check for overlapping periods for this mentor
    const newStartDate = new Date(allocationPeriod.startDate);
    const newEndDate = new Date(allocationPeriod.endDate);
    
    const overlappingAllocation = allAllocations.find(allocation => {
      if (allocation.mentorId !== selectedMentor.id || allocation.status !== 'active') {
        return false;
      }
      
      const existingStartDate = new Date(allocation.allocationPeriod.startDate);
      const existingEndDate = new Date(allocation.allocationPeriod.endDate);
      
      // Check if periods overlap: start1 <= end2 && start2 <= end1
      return newStartDate <= existingEndDate && existingStartDate <= newEndDate;
    });

    if (overlappingAllocation) {
      setPeriodError(`This period overlaps with an existing allocation (${overlappingAllocation.allocationPeriod.startDate} to ${overlappingAllocation.allocationPeriod.endDate}). Please choose a different date range.`);
      return false;
    }

    setPeriodError("");
    return true;
  };

  const validateCapacity = () => {
    const newErrors: {[key: string]: string} = {};

    if (capacityConfig.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }
    if (capacityConfig.capacity < currentLoad + selectedStudents.length) {
      newErrors.capacity = `Capacity cannot be less than current allocation (${currentLoad + selectedStudents.length})`;
    }
    if (!capacityConfig.officeLocation.trim()) {
      newErrors.officeLocation = 'Office location is required';
    }
    if (!capacityConfig.availableHours.trim()) {
      newErrors.availableHours = 'Available hours are required';
    }

    setCapacityErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePeriodChange = (field: 'startDate' | 'endDate', value: string) => {
    setAllocationPeriod(prev => ({
      ...prev,
      [field]: value
    }));
    setPeriodError(""); // Clear error when user makes changes
  };

  const handleCapacityChange = (field: string, value: string | number) => {
    setCapacityConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setCapacityErrors({}); // Clear errors when user makes changes
  };

  const handleAllocate = () => {
    const isPeriodValid = validatePeriod();
    const isCapacityValid = validateCapacity();

    if (isPeriodValid && isCapacityValid) {
      onAllocate(
        selectedMentor.id, 
        selectedStudents.map(s => s.id), 
        allocationPeriod,
        capacityConfig // Always pass capacity config since it's now mandatory
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configure Allocation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Set allocation period and mentor capacity details
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Selected Students */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Selected Students ({selectedStudents.length})</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{student.name}</span>
                  <span className="text-gray-500">{student.rollNo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Mentor */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Selected Mentor</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedMentor.name}</p>
                <p className="text-sm text-gray-600">{selectedMentor.designation}</p>
                <p className="text-xs text-gray-500">{selectedMentor.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Period Configuration */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Allocation Period</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={allocationPeriod.startDate}
                onChange={(e) => handlePeriodChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={allocationPeriod.endDate}
                onChange={(e) => handlePeriodChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {periodError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {periodError}
            </div>
          )}
          <p className="text-xs text-blue-600 mt-2">
            This mentoring period will be assigned to all {selectedStudents.length} selected students. Each unique period creates a separate allocation card.
          </p>
        </div>

        {/* Mentor Capacity Configuration */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CogIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Mentor Capacity Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Student Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={capacityConfig.capacity}
                onChange={(e) => handleCapacityChange('capacity', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  capacityErrors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {capacityErrors.capacity && (
                <p className="mt-1 text-sm text-red-600">{capacityErrors.capacity}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Current allocation: {currentLoad} students, After allocation: {currentLoad + selectedStudents.length} students
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Location *
              </label>
              <input
                type="text"
                value={capacityConfig.officeLocation}
                onChange={(e) => handleCapacityChange('officeLocation', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  capacityErrors.officeLocation ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., CS Block, Room 301"
              />
              {capacityErrors.officeLocation && (
                <p className="mt-1 text-sm text-red-600">{capacityErrors.officeLocation}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Hours *
              </label>
              <textarea
                value={capacityConfig.availableHours}
                onChange={(e) => handleCapacityChange('availableHours', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  capacityErrors.availableHours ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Mon-Fri 10:00-12:00, 14:00-16:00"
              />
              {capacityErrors.availableHours && (
                <p className="mt-1 text-sm text-red-600">{capacityErrors.availableHours}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Specify when the mentor is available for student consultations
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Mentor Selection
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAllocate}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Complete Allocation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationConfigurationModal;