/* eslint-disable @typescript-eslint/no-explicit-any */
import { Student } from '@/types/Attendance';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, CalendarIcon, ClockIcon } from 'lucide-react';

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
  students,
}: {
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
  students: Student[];
}) => {
  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return '';
  };

  const getClassStudentCount = () => {
    if (formData.department && formData.course && formData.semester && formData.section) {
      return students.filter(
        (student) =>
          student.department === formData.department &&
          student.course === formData.course &&
          student.semester === parseInt(formData.semester) &&
          student.section === formData.section
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
                      value={formData.department}
                      onChange={(e) => onFormChange('department', e.target.value)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select
                      value={formData.course}
                      onChange={(e) => onFormChange('course', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      value={formData.semester}
                      onChange={(e) => onFormChange('semester', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      value={formData.section}
                      onChange={(e) => onFormChange('section', e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => onFormChange('subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subj) => (
                        <option key={subj.value} value={subj.value}>
                          {subj.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faculty *
                    </label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => onFormChange('faculty', e.target.value)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => onFormChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => onFormChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => onFormChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {formData.startTime && formData.endTime && (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-sm text-indigo-700">
                        <strong>Duration:</strong> {calculateDuration()}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => onFormChange('roomNumber', e.target.value)}
                      placeholder="e.g., Room 301"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Students
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.totalStudents || getClassStudentCount()}
                        onChange={(e) =>
                          onFormChange('totalStudents', parseInt(e.target.value) || 0)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">Auto: {getClassStudentCount()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => onFormChange('remarks', e.target.value)}
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>Summary:</strong> {formData.subject} - {formData.faculty} •{' '}
                {formData.course} Sem {formData.semester} ({formData.section}) •{' '}
                {calculateDuration()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onCreateSession}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create Session
                </button>
                <button
                  onClick={onCreateAndStart}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Create Session & Start Attendance
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
