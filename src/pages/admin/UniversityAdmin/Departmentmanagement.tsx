/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import Pagination from "../../../components/educator/Pagination";

// Types
interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

interface Faculty {
  id: number;
  name: string;
  email: string;
  designation: string;
  specialization: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  hod: string;
  hodId?: number;
  email: string;
  facultyCount: number;
  studentCount: number;
  status: string;
  courses?: Course[];
  faculty?: Faculty[];
  description?: string;
}

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        type="button"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => (
  <>
    {options.map((opt: any) => (
      <label key={opt.value} className="flex items-center text-sm text-gray-700">
        <input
          type="checkbox"
          checked={selectedValues.includes(opt.value)}
          onChange={(e) => {
            if (e.target.checked)
              onChange([...selectedValues, opt.value]);
            else onChange(selectedValues.filter((v: string) => v !== opt.value));
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span className="ml-2">{opt.label}</span>
        {opt.count !== undefined && (
          <span className="ml-auto text-xs text-gray-500">({opt.count})</span>
        )}
      </label>
    ))}
  </>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
        config[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

// Course Mapping Modal
const CourseMappingModal = ({
  isOpen,
  onClose,
  department,
  allCourses,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allCourses: Course[];
  onSave: (deptId: number, courses: Course[]) => void;
}) => {
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (department) {
      // Always sync selected courses from department
      setSelectedCourses(department.courses?.map((c) => c.id) || []);
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

  const filteredCourses = allCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCourse = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSave = () => {
    const mappedCourses = allCourses.filter((c) =>
      selectedCourses.includes(c.id)
    );
    onSave(department.id, mappedCourses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
              Map Courses — {department.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select or remove courses for this department.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses..."
          className="w-full mb-4 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No courses found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCourses.map((course) => {
                const checked = selectedCourses.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                      checked ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCourse(course.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.code} — {course.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.credits} Credits • Semester {course.semester}
                        </p>
                      </div>
                    </div>
                    {checked && <CheckCircleIcon className="h-5 w-5 text-indigo-600" />}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedCourses.length} course
            {selectedCourses.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              Save Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Faculty Assignment Modal
const FacultyAssignmentModal = ({
  isOpen,
  onClose,
  department,
  allFaculty,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allFaculty: Faculty[];
  onSave: (deptId: number, faculty: Faculty[]) => void;
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<number[]>(
    department?.faculty?.map((f) => f.id) || []
  );
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !department) return null;

  const filteredFaculty = allFaculty.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFaculty = (facultyId: number) => {
    setSelectedFaculty((prev) =>
      prev.includes(facultyId)
        ? prev.filter((id) => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const handleSave = () => {
    const assignedFaculty = allFaculty.filter((f) =>
      selectedFaculty.includes(f.id)
    );
    onSave(department.id, assignedFaculty);
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
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
            {filteredFaculty.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No faculty found
              </div>
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
                          <p className="text-sm font-medium text-gray-900">
                            {faculty.name}
                          </p>
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
              {selectedFaculty.length} faculty member{selectedFaculty.length !== 1 ? "s" : ""} selected
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

const DepartmentDetailsDrawer = ({
  department,
  onClose,
  onEdit,
  onMapCourses,
  onAssignFaculty,
  onAssignHOD,
}: {
  department: Department | null;
  onClose: () => void;
  onEdit: (dept: Department) => void;
  onMapCourses: (dept: Department) => void;
  onAssignFaculty: (dept: Department) => void;
  onAssignHOD: (dept: Department) => void;
}) => {
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
              <StatusBadge status={department.status} />
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
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Faculty
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {department.faculty?.length || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Students
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {department.studentCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Courses
              </p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-gray-900">
                {department.courses?.length || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Status
              </p>
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                About Department
              </h3>
              <p className="text-sm text-gray-600">{department.description}</p>
            </section>
          )}

          {/* Courses Section */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Mapped Courses ({department.courses?.length || 0})
              </h3>
              <button
                onClick={() => onMapCourses(department)}
                className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
                type="button"
              >
                <BookOpenIcon className="h-4 w-4 mr-1" />
                Manage Courses
              </button>
            </div>
            {department.courses && department.courses.length > 0 ? (
              <div className="space-y-2">
                {department.courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.code} - {course.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {course.credits} Credits • Semester {course.semester}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No courses mapped yet</p>
                <button
                  onClick={() => onMapCourses(department)}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  type="button"
                >
                  Map Courses
                </button>
              </div>
            )}
          </section>

          {/* Faculty Section */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Faculty Members ({department.faculty?.length || 0})
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
            {department.faculty && department.faculty.length > 0 ? (
              <div className="space-y-2">
                {department.faculty.map((faculty) => (
                  <div
                    key={faculty.id}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {faculty.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {faculty.designation} • {faculty.specialization}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{faculty.email}</p>
                      </div>
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

// HOD Assignment Modal
const HODAssignmentModal = ({
  isOpen,
  onClose,
  department,
  allFaculty,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allFaculty: Faculty[];
  onSave: (deptId: number, hodId: number, hodName: string) => void;
}) => {
  const [selectedHOD, setSelectedHOD] = useState<number | null>(
    department?.hodId || null
  );
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !department) return null;

  const departmentFaculty = allFaculty.filter((f) =>
    department.faculty?.some((df) => df.id === f.id)
  );

  const filteredFaculty = departmentFaculty.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (selectedHOD) {
      const hod = allFaculty.find((f) => f.id === selectedHOD);
      if (hod) {
        onSave(department.id, selectedHOD, hod.name);
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {departmentFaculty.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                No faculty assigned to this department
              </p>
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
                  <div className="text-center py-8 text-gray-500">
                    No faculty found
                  </div>
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
                              <p className="text-sm font-medium text-gray-900">
                                {faculty.name}
                              </p>
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

const AddDepartmentModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (dept: Department) => void;
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hod, setHod] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !code.trim() || !hod.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newDept: Department = {
        id: Date.now(),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        hod: hod.trim(),
        email: email.trim(),
        description: description.trim(),
        facultyCount: 0,
        studentCount: 0,
        status,
        courses: [],
        faculty: [],
      };
      onCreated(newDept);
      setSubmitting(false);
      onClose();
      // Reset form
      setName("");
      setCode("");
      setHod("");
      setEmail("");
      setDescription("");
      setStatus("Active");
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Department
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter department details to add it to your institution.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Department Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science & Engineering"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Department Code *
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="CSE"
                maxLength={10}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Head of Department *
              </label>
              <input
                value={hod}
                onChange={(e) => setHod(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dr. Anil Kumar"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="hod.cse@example.edu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the department..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={submitting}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={submitting}
              type="button"
            >
              {submitting ? "Adding..." : "Add Department"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditDepartmentModal = ({
  isOpen,
  onClose,
  department,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  onUpdated: (dept: Department) => void;
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hod, setHod] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (department && isOpen) {
      setName(department.name || "");
      setCode(department.code || "");
      setHod(department.hod || "");
      setEmail(department.email || "");
      setDescription(department.description || "");
      setStatus(department.status || "Active");
      setError(null);
      setSubmitting(false);
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

  const handleSubmit = () => {
    if (!name.trim() || !code.trim() || !hod.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const updated: Department = {
        ...department,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        hod: hod.trim(),
        email: email.trim(),
        description: description.trim(),
        status,
      };
      onUpdated(updated);
      setSubmitting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Department</h2>
              <p className="mt-1 text-sm text-gray-500">Update department details.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Department Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science & Engineering"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Department Code *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="CSE"
                maxLength={10}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Head of Department *</label>
              <input
                value={hod}
                onChange={(e) => setHod(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dr. Anil Kumar"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="hod.cse@example.edu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the department..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" disabled={submitting} type="button">
              Cancel
            </button>
            <button onClick={handleSubmit} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300" disabled={submitting} type="button">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-gray-300 rounded-lg p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <BuildingOffice2Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        No departments yet
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        No departments found. Create a new department to get started with your
        institution management.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          type="button"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>
    </div>
  );
};

const DepartmentManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [detailDepartment, setDetailDepartment] = useState<Department | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCourseMappingModal, setShowCourseMappingModal] = useState(false);
  const [showFacultyAssignmentModal, setShowFacultyAssignmentModal] = useState(false);
  const [showHODAssignmentModal, setShowHODAssignmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Sample data - In real app, this would come from API
  const [allCourses] = useState<Course[]>([
    { id: 1, code: "CS101", name: "Introduction to Programming", credits: 4, semester: 1 },
    { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
    { id: 3, code: "CS201", name: "Algorithms", credits: 4, semester: 3 },
    { id: 4, code: "CS202", name: "Database Systems", credits: 3, semester: 4 },
    { id: 5, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
    { id: 6, code: "EC102", name: "Digital Electronics", credits: 4, semester: 2 },
    { id: 7, code: "ME101", name: "Engineering Mechanics", credits: 4, semester: 1 },
    { id: 8, code: "ME102", name: "Thermodynamics", credits: 4, semester: 2 },
  ]);

  const [allFaculty] = useState<Faculty[]>([
    { id: 1, name: "Dr. Anil Kumar", email: "anil.kumar@example.edu", designation: "Professor", specialization: "AI & ML" },
    { id: 2, name: "Dr. Priya Nair", email: "priya.nair@example.edu", designation: "Associate Professor", specialization: "VLSI Design" },
    { id: 3, name: "Dr. Rajesh Sharma", email: "rajesh.sharma@example.edu", designation: "Professor", specialization: "Thermal Engineering" },
    { id: 4, name: "Dr. Sunita Reddy", email: "sunita.reddy@example.edu", designation: "Assistant Professor", specialization: "Data Science" },
    { id: 5, name: "Dr. Vikram Singh", email: "vikram.singh@example.edu", designation: "Associate Professor", specialization: "Computer Networks" },
    { id: 6, name: "Dr. Anita Desai", email: "anita.desai@example.edu", designation: "Assistant Professor", specialization: "Signal Processing" },
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 1,
      name: "Computer Science & Engineering",
      code: "CSE",
      hod: "Dr. Anil Kumar",
      hodId: 1,
      email: "cse@example.edu",
      description: "Leading department in software development, AI, and computer systems.",
      facultyCount: 18,
      studentCount: 420,
      status: "Active",
      courses: [
        { id: 1, code: "CS101", name: "Introduction to Programming", credits: 4, semester: 1 },
        { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
      ],
      faculty: [
        { id: 1, name: "Dr. Anil Kumar", email: "anil.kumar@example.edu", designation: "Professor", specialization: "AI & ML" },
        { id: 4, name: "Dr. Sunita Reddy", email: "sunita.reddy@example.edu", designation: "Assistant Professor", specialization: "Data Science" },
        { id: 5, name: "Dr. Vikram Singh", email: "vikram.singh@example.edu", designation: "Associate Professor", specialization: "Computer Networks" },
      ],
    },
    {
      id: 2,
      name: "Electronics & Communication",
      code: "ECE",
      hod: "Dr. Priya Nair",
      hodId: 2,
      email: "ece@example.edu",
      description: "Specializing in electronics, telecommunications, and embedded systems.",
      facultyCount: 14,
      studentCount: 385,
      status: "Active",
      courses: [
        { id: 5, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
      ],
      faculty: [
        { id: 2, name: "Dr. Priya Nair", email: "priya.nair@example.edu", designation: "Associate Professor", specialization: "VLSI Design" },
        { id: 6, name: "Dr. Anita Desai", email: "anita.desai@example.edu", designation: "Assistant Professor", specialization: "Signal Processing" },
      ],
    },
    {
      id: 3,
      name: "Mechanical Engineering",
      code: "MECH",
      hod: "Dr. Rajesh Sharma",
      hodId: 3,
      email: "mech@example.edu",
      description: "Focused on design, manufacturing, and thermal systems.",
      facultyCount: 20,
      studentCount: 330,
      status: "Inactive",
      courses: [],
      faculty: [
        { id: 3, name: "Dr. Rajesh Sharma", email: "rajesh.sharma@example.edu", designation: "Professor", specialization: "Thermal Engineering" },
      ],
    },
  ]);

  const [filters, setFilters] = useState({ status: [] as string[] });

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.hod.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filters.status.length === 0 ||
        filters.status.includes(dept.status.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchQuery, filters]);

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    departments.forEach((d) => {
      const key = d.status.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value[0].toUpperCase() + value.slice(1),
      count,
    }));
  }, [departments]);

  const totalFilters = filters.status.length;
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({ status: [] });
  };

  const handleViewDetails = (dept: Department) => {
    setDetailDepartment(dept);
  };

  const handleMapCourses = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowCourseMappingModal(true);
  };

  const handleAssignFaculty = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowFacultyAssignmentModal(true);
  };

  const handleAssignHOD = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowHODAssignmentModal(true);
  };

  const handleSaveCourseMapping = (deptId: number, courses: Course[]) => {
    setDepartments(prev =>
      prev.map(dept =>
        dept.id === deptId ? { ...dept, courses } : dept
      )
    );
    if (detailDepartment?.id === deptId) {
      setDetailDepartment(prev => prev ? { ...prev, courses } : null);
    }
  };

  const handleSaveFacultyAssignment = (deptId: number, faculty: Faculty[]) => {
    setDepartments(prev =>
      prev.map(dept =>
        dept.id === deptId ? { ...dept, faculty, facultyCount: faculty.length } : dept
      )
    );
    if (detailDepartment?.id === deptId) {
      setDetailDepartment(prev => prev ? { ...prev, faculty, facultyCount: faculty.length } : null);
    }
  };

  const handleSaveHODAssignment = (deptId: number, hodId: number, hodName: string) => {
    setDepartments(prev =>
      prev.map(dept =>
        dept.id === deptId ? { ...dept, hodId, hod: hodName } : dept
      )
    );
    if (detailDepartment?.id === deptId) {
      setDetailDepartment(prev => prev ? { ...prev, hodId, hod: hodName } : null);
    }
  };

  const handleDeleteDepartment = (deptId: number) => {
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    if (detailDepartment?.id === deptId) setDetailDepartment(null);
    if (selectedDepartment?.id === deptId) setSelectedDepartment(null);
  };

  const isEmpty = paginatedDepartments.length === 0 && !searchQuery && totalFilters === 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">
          Department Management
        </h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">
          Manage departments, courses, faculty assignments, and HOD appointments.
        </p>
      </div>

      {/* Desktop Header Bar */}
      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({departments.length} total)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by department, code, or HOD..."
              size="md"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
          <span className="text-sm text-gray-500">
            {filteredDepartments.length} results
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search departments"
            size="md"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Filter Sidebar */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-xl lg:static lg:inset-auto lg:z-auto lg:h-full lg:flex-shrink-0 lg:shadow-none">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-gray-900">Filters</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                      type="button"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                      type="button"
                      aria-label="Close filters"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-0">
                  <FilterSection title="Status" defaultOpen>
                    <CheckboxGroup
                      options={statusOptions}
                      selectedValues={filters.status}
                      onChange={(values: string[]) =>
                        setFilters((prev) => ({ ...prev, status: values }))
                      }
                    />
                  </FilterSection>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col ">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredDepartments.length}</span>{" "}
              result{filteredDepartments.length === 1 ? "" : "s"}
              {searchQuery && (
                <span className="text-gray-500"> for "{searchQuery}"</span>
              )}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              type="button"
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add Department
            </button>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {isEmpty && <EmptyState onCreate={() => setShowAddModal(true)} />}

            {!isEmpty && viewMode === "grid" && paginatedDepartments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-3 gap-6">
                {paginatedDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header with gradient background */}
                    <div className="relative bg-blue-700 p-6">
                      <div className="absolute top-4 right-4">
                        <StatusBadge status={dept.status} />
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <BuildingOffice2Icon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-blue-100">{dept.code}</p>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      {/* HOD Info */}
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700">
                              {dept.hod.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Head of Department
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                              {dept.hod}
                            </p>
                            {dept.email && (
                              <a
                                href={`mailto:${dept.email}`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center gap-1 group/email"
                              >
                                <EnvelopeIcon className="h-3 w-3" />
                                <span className="group-hover/email:underline">{dept.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="relative group/stat">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative bg-gray-50 rounded-xl p-3 border border-gray-100 group-hover/stat:border-indigo-200 transition-colors duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-indigo-100 rounded-lg">
                                <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                              </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {dept.faculty?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Faculty</p>
                          </div>
                        </div>

                        <div className="relative group/stat">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative bg-gray-50 rounded-xl p-3 border border-gray-100 group-hover/stat:border-amber-200 transition-colors duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-amber-100 rounded-lg">
                                <AcademicCapIcon className="h-4 w-4 text-amber-600" />
                              </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {dept.studentCount}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Students</p>
                          </div>
                        </div>

                        <div className="relative group/stat">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative bg-gray-50 rounded-xl p-3 border border-gray-100 group-hover/stat:border-green-200 transition-colors duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-green-100 rounded-lg">
                                <BookOpenIcon className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {dept.courses?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Courses</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(dept)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                          type="button"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleMapCourses(dept)}
                          className="inline-flex items-center justify-center p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                          type="button"
                          title="Map Courses"
                        >
                          <BookOpenIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAssignFaculty(dept)}
                          className="inline-flex items-center justify-center p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                          type="button"
                          title="Assign Faculty"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="inline-flex items-center justify-center p-2 border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
                          type="button"
                          title="Delete Department"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isEmpty && viewMode === "table" && paginatedDepartments.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          HOD
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Courses
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {dept.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {dept.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {dept.hod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {dept.faculty?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {dept.studentCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {dept.courses?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge status={dept.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleViewDetails(dept)}
                                className="text-indigo-600 hover:text-indigo-900"
                                type="button"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleMapCourses(dept)}
                                className="text-indigo-600 hover:text-indigo-900"
                                type="button"
                                title="Map Courses"
                              >
                                Courses
                              </button>
                              <button
                                onClick={() => handleAssignFaculty(dept)}
                                className="text-indigo-600 hover:text-indigo-900"
                                type="button"
                                title="Assign Faculty"
                              >
                                Faculty
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="text-red-600 hover:text-red-900"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!isEmpty &&
              paginatedDepartments.length === 0 &&
              (searchQuery || totalFilters > 0) && (
                <div className="text-center py-10 text-sm text-gray-500">
                  No departments match your current filters. Try adjusting
                  filters or clearing them.
                  <div className="mt-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      type="button"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Pagination */}
          {!isEmpty && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={(newDept) => {
          setDepartments([...departments, newDept]);
          setShowAddModal(false);
        }}
      />

      <EditDepartmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onUpdated={(updated) => {
          setDepartments(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
          if (detailDepartment?.id === updated.id) {
            setDetailDepartment(prev => prev ? { ...prev, ...updated } : null);
          }
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
      />

      <CourseMappingModal
        isOpen={showCourseMappingModal}
        onClose={() => {
          setShowCourseMappingModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        allCourses={allCourses}
        onSave={handleSaveCourseMapping}
      />

      <FacultyAssignmentModal
        isOpen={showFacultyAssignmentModal}
        onClose={() => {
          setShowFacultyAssignmentModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        allFaculty={allFaculty}
        onSave={handleSaveFacultyAssignment}
      />

      <HODAssignmentModal
        isOpen={showHODAssignmentModal}
        onClose={() => {
          setShowHODAssignmentModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        allFaculty={allFaculty}
        onSave={handleSaveHODAssignment}
      />

      <DepartmentDetailsDrawer
        department={detailDepartment}
        onClose={() => setDetailDepartment(null)}
        onEdit={(dept) => {
          setSelectedDepartment(dept);
          setShowEditModal(true);
        }}
        onMapCourses={handleMapCourses}
        onAssignFaculty={handleAssignFaculty}
        onAssignHOD={handleAssignHOD}
      />
    </div>
  );
};

export default DepartmentManagement;