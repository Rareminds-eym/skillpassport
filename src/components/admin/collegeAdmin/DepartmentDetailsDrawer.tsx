import React, { useEffect, useState } from 'react';
import {
  XMarkIcon,
  ClockIcon,
  PencilSquareIcon,
  UserIcon,
  BookOpenIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import {
  departmentService,
  DepartmentWithStats,
} from '../../../services/college/departmentService';

interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  specialization?: string;
  employeeId?: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  degree_level: string;
  description?: string;
  status?: string;
}

interface Department extends DepartmentWithStats {
  hod?: string;
  email?: string;
  programs_offered?: Program[];
}

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
        config[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
};

interface DepartmentDetailsDrawerProps {
  department: Department | null;
  onClose: () => void;
  onEdit: (dept: Department) => void;
  onAssignFaculty: (dept: Department) => void;
  onAssignHOD: (dept: Department) => void;
}

const DepartmentDetailsDrawer: React.FC<DepartmentDetailsDrawerProps> = ({
  department,
  onClose,
  onEdit,
  onAssignFaculty,
  onAssignHOD,
}) => {
  const [assignedFaculty, setAssignedFaculty] = useState<Faculty[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  // Load assigned faculty when department changes
  useEffect(() => {
    if (department?.id) {
      setFacultyLoading(true);
      departmentService
        .getDepartmentFaculty(department.id)
        .then((faculty) => {
          setAssignedFaculty(faculty);
        })
        .catch((error) => {
          console.error('Error loading department faculty:', error);
          setAssignedFaculty([]);
        })
        .finally(() => {
          setFacultyLoading(false);
        });
    } else {
      setAssignedFaculty([]);
    }
  }, [department?.id]);

  if (!department) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div
        className="absolute inset-y-0 right-0 flex h-full w-full sm:max-w-2xl flex-col bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-start justify-between border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {department.name}
              </h2>
              <StatusBadge status={department.status || 'Active'} />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {department.code} • Department Details
            </p>
            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              <span className="text-gray-500">Head of Department:</span>
              <span className="font-medium text-gray-900 break-words">{department.hod}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Close drawer</span>
          </button>
        </div>

        {/* Stats Section - Fixed */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Faculty</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {assignedFaculty.length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Students</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {department.student_count || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Programs</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {department.programs_offered?.length || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
              <span className="mt-2 sm:mt-3 inline-flex items-center rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700">
                {department.status}
              </span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Updated recently
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(department)}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <PencilSquareIcon className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Edit
              </button>
              <button
                onClick={() => onAssignHOD(department)}
                className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                type="button"
              >
                <UserIcon className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Assign HOD
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Description */}
          {department.description && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">About Department</h3>
              <p className="text-sm text-gray-600">{department.description}</p>
            </section>
          )}

          {/* Programs Section */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Programs Offered ({department.programs_offered?.length || 0})
              </h3>
            </div>
            {department.programs_offered && department.programs_offered.length > 0 ? (
              <div className="space-y-2">
                {department.programs_offered.map((program) => (
                  <div key={program.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {program.code} - {program.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{program.degree_level}</p>
                        {program.description && (
                          <p className="text-xs text-gray-600 mt-1">{program.description}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {program.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No programs offered yet</p>
                <p className="text-xs text-gray-400 mt-1">Programs are managed separately</p>
              </div>
            )}
          </section>

          {/* Faculty Section */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Faculty Members ({assignedFaculty.length})
              </h3>
              <button
                onClick={() => onAssignFaculty(department)}
                className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
                type="button"
              >
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Manage Faculty
              </button>
            </div>
            {facultyLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading faculty...</p>
              </div>
            ) : assignedFaculty.length > 0 ? (
              <div className="space-y-2">
                {assignedFaculty.map((faculty) => (
                  <div key={faculty.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-700">
                          {faculty.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                        <p className="text-xs text-gray-500">
                          {faculty.designation} • {faculty.specialization || 'No specialization'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{faculty.email}</p>
                        {faculty.employeeId && (
                          <p className="text-xs text-gray-400">ID: {faculty.employeeId}</p>
                        )}
                      </div>
                      {faculty.designation === 'Head of Department' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            HOD
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No faculty assigned yet</p>
                <button
                  onClick={() => onAssignFaculty(department)}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  type="button"
                >
                  Assign Faculty
                </button>
              </div>
            )}
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
              Contact Information
            </h3>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Head of Department</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-words">
                    {department.hod}
                  </p>
                </div>
                {department.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a
                      href={`mailto:${department.email}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center break-all"
                    >
                      <EnvelopeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      {department.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsDrawer;
