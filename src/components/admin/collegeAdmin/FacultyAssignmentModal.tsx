import React, { useEffect, useState } from 'react';
import { XMarkIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  departmentService,
  DepartmentWithStats,
} from '../../../services/college/departmentService';

interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  specialization: string;
}

interface Department extends DepartmentWithStats {}

interface FacultyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allFaculty: Faculty[];
  facultyLoading: boolean;
  onSave: (deptId: string, facultyIds: string[]) => void;
}

const FacultyAssignmentModal: React.FC<FacultyAssignmentModalProps> = ({
  isOpen,
  onClose,
  department,
  allFaculty,
  facultyLoading,
  onSave,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (department && isOpen) {
      // Load currently assigned faculty for this department
      departmentService
        .getDepartmentFaculty(department.id)
        .then((assignedFaculty) => {
          setSelectedFaculty(assignedFaculty.map((f) => f.id));
        })
        .catch(console.error);
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

  const filteredFaculty = allFaculty.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFaculty = (facultyId: string) => {
    setSelectedFaculty((prev) =>
      prev.includes(facultyId) ? prev.filter((id) => id !== facultyId) : [...prev, facultyId]
    );
  };

  const handleSave = () => {
    onSave(department.id, selectedFaculty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-3xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                Assign Faculty to {department.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select faculty members for this department
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {facultyLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                Loading faculty...
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No faculty found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFaculty.map((faculty) => (
                  <label
                    key={faculty.id}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFaculty.includes(faculty.id)}
                      onChange={() => handleToggleFaculty(faculty.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                          <p className="text-xs text-gray-500">
                            {faculty.designation} • {faculty.specialization}
                          </p>
                          <p className="text-xs text-gray-400">{faculty.email}</p>
                        </div>
                        {selectedFaculty.includes(faculty.id) && (
                          <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedFaculty.length} faculty member{selectedFaculty.length !== 1 ? 's' : ''}{' '}
              selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                type="button"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyAssignmentModal;
