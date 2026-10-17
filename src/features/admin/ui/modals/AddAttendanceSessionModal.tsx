/* eslint-disable @typescript-eslint/no-explicit-any */
import { Learner } from '@/features/college-admin';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

// Add Attendance Session Modal
const AddAttendanceSessionModal = ({
  isOpen,
  onClose,
  onCreateSession,
  onCreateAndStart,
  formData,
  onFormChange,
  departments,
  courses,
  semesters,
  sections,
  subjects,
  faculty,
  learners,
  trainingSubjects = [],
  trainingSections = [],
  trainingSectionId = "",
  onTrainingSectionChange,
  trainingError = "",
  creationError = "",
  saving = false,
  subjectsLoading = false,
  schedule = { slots: [] },
}: {
  schedule?: { fixedDate?: string; minDate?: string; maxDate?: string; slots: { start_time: string; end_time: string }[] };
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: () => void;
  onCreateAndStart: () => void;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  departments: any[];
  courses: any[];
  semesters: any[];
  sections: any[];
  subjects: any[];
  faculty: any[];
  learners: Learner[];
  trainingSubjects?: any[];
  trainingSections?: any[];
  trainingSectionId?: string;
  onTrainingSectionChange?: (id: string) => void;
  trainingError?: string;
  saving?: boolean;
  subjectsLoading?: boolean;
  creationError?: string;
}) => {
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split subjects by source: academic curriculum vs generic platform catalog
  const academicSubjectsList = useMemo(() => {
    return subjects.filter(s => s.source !== 'generic_course');
  }, [subjects]);

  const genericSubjectsList = useMemo(() => {
    return subjects.filter(s => s.source === 'generic_course');
  }, [subjects]);

  // Filter subjects based on search (by title/label only, hiding IDs)
  const filteredAcademicSubjects = useMemo(() => {
    if (!subjectSearch) return academicSubjectsList;
    const search = subjectSearch.toLowerCase();
    return academicSubjectsList.filter(subj =>
      subj.label?.toLowerCase().includes(search)
    );
  }, [academicSubjectsList, subjectSearch]);

  const filteredTrainingSubjects = useMemo(() => {
    if (!subjectSearch) return trainingSubjects;
    const search = subjectSearch.toLowerCase();
    return trainingSubjects.filter(subj =>
      subj.label?.toLowerCase().includes(search)
    );
  }, [trainingSubjects, subjectSearch]);

  const filteredGenericSubjects = useMemo(() => {
    if (!subjectSearch) return genericSubjectsList;
    const search = subjectSearch.toLowerCase();
    return genericSubjectsList.filter(subj =>
      subj.label?.toLowerCase().includes(search)
    );
  }, [genericSubjectsList, subjectSearch]);

  const totalFilteredCount =
    filteredAcademicSubjects.length +
    filteredTrainingSubjects.length +
    filteredGenericSubjects.length;

  const selectedSubjectLabel = useMemo(() => {
    if (!formData.subject) return '';
    const all = [...subjects, ...trainingSubjects];
    const found = all.find(s => s.value === formData.subject);
    return found ? found.label : formData.subject;
  }, [formData.subject, subjects, trainingSubjects]);

  // Validation: only end-after-start is enforced — sessions may be
  // created for any past or future date/time (backfill supported).
  const validateDateTime = () => {
    const errors = [];

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        errors.push("End time must be after start time");
      }
    }

    return errors;
  };

  const validationErrors = validateDateTime();

  // Human-readable context for the empty academic-subjects warning.
  const selectedCourseLabel =
    courses.find((c) => String(c.value) === String(formData.course))?.label || 'this program';
  const selectedSemesterLabel =
    semesters.find((s) => String(s.value) === String(formData.semester))?.label ||
    (formData.semester ? `Semester ${formData.semester}` : '');

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diff = end.getTime() - start.getTime();
      if (diff <= 0) return "Invalid duration";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return "";
  };

  const getClasslearnerCount = () => {
    if (formData.department && formData.course && formData.semester && formData.section) {
      return learners.filter(
        (learner) =>
          learner.department === formData.department &&
          learner.course === formData.course &&
          learner.semester === parseInt(formData.semester) &&
          learner.section === formData.section
      ).length;
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Attendance Session</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the details below to schedule a new attendance session.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Class Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                    Class Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      aria-label="Department"
                      value={formData.department}
                      onChange={(e) => onFormChange("department", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course *
                    </label>
                    <select
                      aria-label="Course"
                      value={formData.course}
                      onChange={(e) => onFormChange("course", e.target.value)}
                      disabled={!formData.department}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester *
                    </label>
                    <select
                      aria-label="Semester"
                      value={formData.semester}
                      onChange={(e) => onFormChange("semester", e.target.value)}
                      disabled={!formData.course}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((sem) => (
                        <option key={sem.value} value={sem.value}>
                          {sem.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section *
                    </label>
                    <select
                      aria-label="Section"
                      value={formData.section}
                      onChange={(e) => onFormChange("section", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Section</option>
                      {sections.map((sec) => (
                        <option key={sec.value} value={sec.value}>
                          {sec.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {trainingSections.length > 1 && (
                    <label className="block text-sm">
                      Training academic year *
                      <select
                        value={trainingSectionId}
                        onChange={(e) => onTrainingSectionChange?.(e.target.value)}
                        className="w-full rounded border p-2"
                      >
                        <option value="">Select exact class year</option>
                        {trainingSections.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.academic_year} – {x.section}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {trainingError && (
                    <p role="alert" className="text-sm text-red-700">
                      {trainingError}
                    </p>
                  )}

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>

                    {/* Searchable input */}
                    <div className="relative">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={formData.subject ? selectedSubjectLabel : subjectSearch}
                          onChange={(e) => {
                            setSubjectSearch(e.target.value);
                            setShowSubjectDropdown(true);
                            if (!e.target.value) {
                              onFormChange("subject", "");
                            }
                          }}
                          onFocus={() => {
                            if (!formData.subject) {
                              setShowSubjectDropdown(true);
                            }
                          }}
                          placeholder={
                            subjectsLoading
                              ? 'Loading subjects...'
                              : subjects.length === 0 && trainingSubjects.length === 0
                              ? 'No subjects available'
                              : 'Search subjects...'
                          }
                          disabled={!formData.semester || subjectsLoading || (subjects.length === 0 && trainingSubjects.length === 0)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>

                      {/* Custom searchable dropdown */}
                      {showSubjectDropdown && !formData.subject && totalFilteredCount > 0 && formData.semester && !subjectsLoading && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {/* 1. Academic Courses */}
                          {filteredAcademicSubjects.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 uppercase tracking-wider sticky top-0">
                                Academic Courses
                              </div>
                              {filteredAcademicSubjects.map((subj) => (
                                <button
                                  key={subj.value}
                                  type="button"
                                  onClick={() => {
                                    onFormChange("subject", subj.value);
                                    setSubjectSearch('');
                                    setShowSubjectDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <div className="font-medium text-gray-900">{subj.label}</div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 2. Trainer Assigned Courses */}
                          {filteredTrainingSubjects.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 uppercase tracking-wider sticky top-0">
                                Trainer Assigned Courses
                              </div>
                              {filteredTrainingSubjects.map((subj) => (
                                <button
                                  key={subj.value}
                                  type="button"
                                  onClick={() => {
                                    onFormChange("subject", subj.value);
                                    setSubjectSearch('');
                                    setShowSubjectDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <div className="font-medium text-gray-900">{subj.label}</div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 3. All Courses */}
                          {filteredGenericSubjects.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 uppercase tracking-wider sticky top-0">
                                All Courses
                              </div>
                              {filteredGenericSubjects.map((subj) => (
                                <button
                                  key={subj.value}
                                  type="button"
                                  onClick={() => {
                                    onFormChange("subject", subj.value);
                                    setSubjectSearch('');
                                    setShowSubjectDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <div className="font-medium text-gray-900">{subj.label}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clear selection button */}
                      {formData.subject && (
                        <button
                          type="button"
                          onClick={() => {
                            onFormChange("subject", "");
                            setSubjectSearch('');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                          title="Clear selection"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {subjectSearch && totalFilteredCount === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No subjects found matching "{subjectSearch}"</p>
                    )}

                    {/* Accessible and test-compatible hidden select */}
                    <select
                      aria-label="Subject"
                      value={formData.subject}
                      onChange={(e) => onFormChange("subject", e.target.value)}
                      disabled={!formData.semester || subjectsLoading || (subjects.length === 0 && trainingSubjects.length === 0)}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="">
                        {subjectsLoading
                          ? 'Loading subjects...'
                          : subjects.length === 0 && trainingSubjects.length === 0
                          ? 'No subjects available'
                          : 'Select Subject'}
                      </option>
                      {academicSubjectsList.length > 0 && (
                        <optgroup label="Academic Subjects">
                          {academicSubjectsList.map((subj) => (
                            <option key={subj.value} value={subj.value}>
                              {subj.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {trainingSubjects.length > 0 && (
                        <optgroup label="Training Courses">
                          {trainingSubjects.map((subj) => (
                            <option key={subj.value} value={subj.value}>
                              {subj.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {genericSubjectsList.length > 0 && (
                        <optgroup label="All Courses">
                          {genericSubjectsList.map((subj) => (
                            <option key={subj.value} value={subj.value}>
                              {subj.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <p className="mt-1 text-xs text-gray-500">
                      {subjectsLoading
                        ? 'Loading courses for the selected class and date...'
                        : !formData.semester
                        ? 'Select a program and semester to list subjects.'
                        : !formData.section
                        ? 'Select a section to list mapped training courses.'
                        : !formData.date
                        ? 'Choose a session date to list mapped training courses.'
                        : !trainingSectionId
                        ? trainingSections.length > 1
                          ? 'Select the exact class academic year to list training courses.'
                          : 'No active class matches the selected program, semester and section.'
                        : trainingSubjects.length === 0
                        ? 'No training courses are mapped to this class for the selected date.'
                        : 'Selecting a training course fills its assigned faculty automatically.'}
                    </p>
                    {!subjectsLoading && formData.semester && subjects.length === 0 && (
                      <p role="note" className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        No academic subjects are mapped to {selectedCourseLabel}{selectedSemesterLabel ? `, ${selectedSemesterLabel}` : ''} yet — map subjects under Curriculum first, or pick a Training Course from the list above.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faculty *
                    </label>
                    <select
                      aria-label="Faculty"
                      value={formData.faculty}
                      onChange={(e) => onFormChange("faculty", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Faculty</option>
                      {faculty.map((fac) => (
                        <option key={fac.value} value={fac.value}>
                          {fac.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - Session Scheduling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-indigo-600" />
                    Session Scheduling
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      disabled={!!schedule.fixedDate}
                      min={schedule.minDate || undefined}
                      max={schedule.maxDate || undefined}
                      aria-label="Session date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => onFormChange("date", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                    />
                  </div>

                  {schedule.slots.length > 1 && (
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned time slot
                      <select aria-label="Assigned time slot" className="mt-1 w-full rounded-lg border p-2"
                        value={schedule.slots.findIndex(slot => slot.start_time.slice(0, 5) === formData.startTime && slot.end_time.slice(0, 5) === formData.endTime)}
                        onChange={event => {
                          const slot = schedule.slots[Number(event.target.value)];
                          if (slot) {
                            onFormChange('startTime', slot.start_time.slice(0, 5));
                            onFormChange('endTime', slot.end_time.slice(0, 5));
                          }
                        }}>
                        <option value={-1}>Select assigned time slot</option>
                        {schedule.slots.map((slot, index) => <option key={index} value={index}>{slot.start_time.slice(0, 5)} ? {slot.end_time.slice(0, 5)}</option>)}
                      </select>
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        disabled={schedule.slots.length > 0}
                        aria-label="Start Time"
                        value={formData.startTime}
                        onChange={(e) => onFormChange("startTime", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        disabled={schedule.slots.length > 0}
                        aria-label="End Time"
                        value={formData.endTime}
                        onChange={(e) => onFormChange("endTime", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          (formData.startTime && formData.endTime && formData.endTime <= formData.startTime)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                      {formData.startTime && formData.endTime && formData.endTime <= formData.startTime && (
                        <p className="mt-1 text-sm text-red-600">
                          End time must be after start time
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.startTime && formData.endTime && (
                    <div className={`p-3 rounded-lg border ${
                      validationErrors.length > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <p className={`text-sm ${
                        validationErrors.length > 0 ? 'text-red-700' : 'text-indigo-700'
                      }`}>
                        <strong>Duration:</strong> {calculateDuration()}
                      </p>
                    </div>
                  )}

                  {/* Validation Errors Display */}
                  {validationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Please fix the following errors:
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <ul className="list-disc pl-5 space-y-1">
                              {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => onFormChange("roomNumber", e.target.value)}
                      placeholder="e.g., Room 301"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Learners
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.totallearners || getClasslearnerCount()}
                        onChange={(e) => onFormChange("totallearners", parseInt(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">
                        Auto: {getClasslearnerCount()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => onFormChange("remarks", e.target.value)}
                      placeholder="Optional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex flex-col gap-3">
              {/* Summary Text */}
              <div className="text-sm text-gray-600 break-words">
                <strong>Summary:</strong>{' '}
                {[...subjects, ...trainingSubjects].find(s => s.value === formData.subject)?.label || formData.subject} - {' '}
                {faculty.find(f => f.value === formData.faculty)?.label || formData.faculty} • {' '}
                {courses.find(c => c.value === formData.course)?.label || formData.course} Sem {formData.semester} ({formData.section}) • {' '}
                {calculateDuration()}
              </div>

              {creationError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {creationError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onCreateSession}
                  disabled={saving || validationErrors.length > 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    saving || validationErrors.length > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {saving ? 'Creating…' : 'Create Session'}
                </button>
                <button
                  onClick={onCreateAndStart}
                  disabled={saving || validationErrors.length > 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    saving || validationErrors.length > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {saving ? 'Creating…' : 'Create Session & Start Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAttendanceSessionModal;
