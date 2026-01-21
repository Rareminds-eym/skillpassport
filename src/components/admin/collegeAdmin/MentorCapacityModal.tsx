import React, { useState } from 'react';
import { XMarkIcon, UserIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MentorAllocation {
  id: number;
  mentorId: number;
  students: any[];
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
  allocations: MentorAllocation[];
}

interface MentorCapacityModalProps {
  mentor: Mentor;
  allocation: MentorAllocation; // Specific allocation to configure
  onClose: () => void;
  onSave: (
    allocationId: number,
    config: {
      capacity: number;
      officeLocation: string;
      availableHours: string;
    }
  ) => void;
}

const MentorCapacityModal: React.FC<MentorCapacityModalProps> = ({
  mentor,
  allocation,
  onClose,
  onSave,
}) => {
  const [capacity, setCapacity] = useState(allocation.capacity);
  const [officeLocation, setOfficeLocation] = useState(allocation.officeLocation);
  const [availableHours, setAvailableHours] = useState(allocation.availableHours);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }
    if (capacity < allocation.students.length) {
      newErrors.capacity = `Capacity cannot be less than current students in this allocation (${allocation.students.length})`;
    }
    if (!officeLocation.trim()) {
      newErrors.officeLocation = 'Office location is required';
    }
    if (!availableHours.trim()) {
      newErrors.availableHours = 'Available hours are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(allocation.id, {
        capacity,
        officeLocation: officeLocation.trim(),
        availableHours: availableHours.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configure Allocation</h2>
              <p className="text-sm text-gray-600">
                {allocation.allocationPeriod.startDate} to {allocation.allocationPeriod.endDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Allocation Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mentor:</span>
                <p className="font-medium text-gray-900">
                  {mentor.name} ({mentor.designation})
                </p>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <p className="font-medium text-gray-900">{mentor.department}</p>
              </div>
              <div>
                <span className="text-gray-600">Allocation Period:</span>
                <p className="font-medium text-gray-900">
                  {allocation.allocationPeriod.startDate} to {allocation.allocationPeriod.endDate}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Academic Year:</span>
                <p className="font-medium text-gray-900">
                  {allocation.academicYear} • {allocation.semester}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Current Students:</span>
                <p className="font-medium text-gray-900">{allocation.students.length} students</p>
              </div>
            </div>
          </div>

          {/* Capacity Configuration */}
          <div className="space-y-4">
            {/* Student Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Student Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter maximum number of students"
              />
              {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Current students in this allocation: {allocation.students.length}
              </p>
            </div>

            {/* Office Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Office Location *
              </label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.officeLocation ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., CS Block, Room 301"
              />
              {errors.officeLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.officeLocation}</p>
              )}
            </div>

            {/* Available Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Available Hours *
              </label>
              <textarea
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.availableHours ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Mon-Fri 10:00-12:00, 14:00-16:00"
              />
              {errors.availableHours && (
                <p className="mt-1 text-sm text-red-600">{errors.availableHours}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                When the mentor is available for student consultations
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Save Allocation Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorCapacityModal;
