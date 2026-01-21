import React, { useState } from 'react';
import { XMarkIcon, UserIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { DepartmentWithStats } from '../../../services/college/departmentService';

interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  specialization: string;
}

interface Department extends DepartmentWithStats {
  hodId?: string;
}

interface HODAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allFaculty: Faculty[];
  assignedFaculty: Faculty[];
  onSave: (deptId: string, hodId: string, hodName: string, hodEmail: string) => void;
}

const HODAssignmentModal: React.FC<HODAssignmentModalProps> = ({
  isOpen,
  onClose,
  department,
  allFaculty,
  assignedFaculty,
  onSave,
}) => {
  const [selectedHOD, setSelectedHOD] = useState<string | null>(department?.hodId || null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !department) return null;

  const departmentFaculty = assignedFaculty;

  const filteredFaculty = departmentFaculty.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (selectedHOD) {
      const hod = allFaculty.find((f) => f.id === selectedHOD);
      if (hod) {
        onSave(department.id, selectedHOD, hod.name, hod.email);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-6 w-6 text-indigo-600" />
                Assign Head of Department
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a faculty member from {department.name} to be HOD
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {departmentFaculty.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">No faculty assigned to this department</p>
              <p className="text-xs text-gray-500">
                Please assign faculty members first before selecting HOD
              </p>
            </div>
          ) : (
            <>
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
                {filteredFaculty.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No faculty found</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredFaculty.map((faculty) => (
                      <label
                        key={faculty.id}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="hod"
                          checked={selectedHOD === faculty.id}
                          onChange={() => setSelectedHOD(faculty.id)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
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
                            {selectedHOD === faculty.id && (
                              <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedHOD}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  Assign as HOD
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HODAssignmentModal;
