// @ts-nocheck - Excluded from typecheck for gradual migration
import { useEffect, useState, useMemo } from 'react';
import { getAssignmentStudents, gradeAssignment } from '../../services/educator/assignmentsService';
import { supabase } from '../../lib/supabaseClient';
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  UsersIcon,
  ArrowPathIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import NotificationModal from '../ui/NotificationModal';

// Helper function to extract file key from R2 URL
const extractFileKey = (fileUrl: string): string | null => {
  if (fileUrl.includes('.r2.dev/')) {
    const urlParts = fileUrl.split('.r2.dev/');
    if (urlParts.length > 1) {
      return urlParts[1];
    }
  }
  return null;
};

// Helper function to generate accessible file URL
const getAccessibleFileUrl = (fileUrl: string) => {
  const storageApiUrl = import.meta.env.VITE_STORAGE_API_URL;
  if (!storageApiUrl) {
    return fileUrl;
  }

  // Extract file key and use key parameter for better reliability
  const fileKey = extractFileKey(fileUrl);

  if (fileKey) {
    return `${storageApiUrl}/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;
  } else {
    // Fallback to url parameter
    return `${storageApiUrl}/document-access?url=${encodeURIComponent(fileUrl)}&mode=inline`;
  }
};

// Helper function to open file with error handling
const openFile = async (fileUrl: string, fileName: string = 'file') => {
  try {
    const accessibleUrl = getAccessibleFileUrl(fileUrl);

    // Test if the URL is accessible
    const testResponse = await fetch(accessibleUrl, { method: 'HEAD' });

    if (testResponse.ok) {
      window.open(accessibleUrl, '_blank');
    } else {
      window.open(fileUrl, '_blank');
    }
  } catch (error) {
    // Fallback to direct URL
    window.open(fileUrl, '_blank');
  }
};

interface Student {
  student_assignment_id: string;
  student?: {
    name: string;
    email: string;
    university?: string;
    registration_number?: string;
  };
  status: string;
  grade_received?: number;
  grade_percentage?: number;
  instructor_feedback?: string;
  submission_date?: string;
  submission_content?: string;
  submission_url?: string;
  is_late?: boolean;
  graded_date?: string;
}

interface Assignment {
  id: string;
  title: string;
  totalPoints: number;
}

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onGradeSubmitted: () => void;
}

// Student Status Badge
const StudentStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-700 border-gray-300',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
    submitted: 'bg-amber-100 text-amber-700 border-amber-300',
    graded: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };
  const labels: Record<string, string> = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    submitted: 'Submitted',
    graded: 'Graded',
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.todo}`}
    >
      {labels[status] || status}
    </span>
  );
};

// Grading Modal Component
const GradingModal = ({ isOpen, onClose, assignment, onGradeSubmitted }: GradingModalProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeData, setGradeData] = useState({
    grade_received: '',
    instructor_feedback: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMobileGrading, setShowMobileGrading] = useState(false);

  // Notification modal state
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({
    type: 'info' as const,
    title: '',
    message: '',
  });

  const showNotificationModal = (
    type: 'error' | 'success' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    // @ts-expect-error - Auto-suppressed for migration
    setNotification({ type, title, message });
    setShowNotification(true);
  };

  useEffect(() => {
    if (isOpen && assignment) {
      loadStudents();
    }
  }, [isOpen, assignment]);

  const loadStudents = async () => {
    if (!assignment) return;

    try {
      setLoading(true);
      const studentsData = await getAssignmentStudents(assignment.id);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedStudent || !gradeData.grade_received || !assignment) {
      showNotificationModal('warning', 'Missing Information', 'Please enter a grade');
      return;
    }

    const gradeValue = parseFloat(gradeData.grade_received);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > assignment.totalPoints) {
      showNotificationModal(
        'error',
        'Invalid Grade',
        `Grade must be between 0 and ${assignment.totalPoints}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const educatorId = user?.id || localStorage.getItem('dev_educator_id');

      const gradePercentage = (gradeValue / assignment.totalPoints) * 100;

      await gradeAssignment(selectedStudent.student_assignment_id, {
        grade_received: gradeValue,
        instructor_feedback: gradeData.instructor_feedback,
        graded_by: educatorId,
      });

      setStudents(
        students.map((s) =>
          s.student_assignment_id === selectedStudent.student_assignment_id
            ? {
                ...s,
                status: 'graded',
                grade_received: gradeValue,
                grade_percentage: gradePercentage,
                instructor_feedback: gradeData.instructor_feedback,
              }
            : s
        )
      );

      setSelectedStudent(null);
      setGradeData({ grade_received: '', instructor_feedback: '' });
      setShowMobileGrading(false);

      if (onGradeSubmitted) {
        onGradeSubmitted();
      }

      showNotificationModal('success', 'Grade Submitted', 'Grade has been submitted successfully');
    } catch (error) {
      showNotificationModal(
        'error',
        'Submission Failed',
        'Failed to submit grade. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (filterStatus === 'all') return students;
    return students.filter((s) => s.status === filterStatus);
  }, [students, filterStatus]);

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Desktop & Tablet View */}
      <div className="hidden md:flex fixed inset-y-0 right-0 max-w-6xl w-full bg-white shadow-xl flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                <AcademicCapIcon className="h-5 md:h-6 w-5 md:w-6 text-emerald-600 shrink-0" />
                <span className="truncate">Grade Submissions</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{assignment?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors ml-4 shrink-0"
            >
              <XMarkIcon className="h-5 md:h-6 w-5 md:w-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Students List */}
          <div className="w-full md:w-2/5 lg:w-1/3 border-r border-gray-200 flex flex-col min-h-0">
            <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Students ({students.length})</option>
                <option value="submitted">
                  Submitted ({students.filter((s) => s.status === 'submitted').length})
                </option>
                <option value="graded">
                  Graded ({students.filter((s) => s.status === 'graded').length})
                </option>
                <option value="in-progress">
                  In Progress ({students.filter((s) => s.status === 'in-progress').length})
                </option>
                <option value="todo">
                  Not Started ({students.filter((s) => s.status === 'todo').length})
                </option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <ArrowPathIcon className="h-8 w-8 text-gray-300 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <UsersIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.student_assignment_id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setGradeData({
                          grade_received: student.grade_received?.toString() || '',
                          instructor_feedback: student.instructor_feedback || '',
                        });
                      }}
                      className={`w-full text-left p-3 md:p-4 hover:bg-gray-50 transition-colors ${
                        selectedStudent?.student_assignment_id === student.student_assignment_id
                          ? 'bg-emerald-50 border-l-4 border-emerald-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">
                            {student.student?.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {student.student?.email}
                          </p>
                        </div>
                        <StudentStatusBadge status={student.status} />
                      </div>

                      {student.student?.university && (
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {student.student.university}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2">
                        {student.status === 'graded' &&
                        student.grade_received !== null &&
                        student.grade_received !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-600">
                              {student.grade_received}/{assignment.totalPoints}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({student.grade_percentage?.toFixed(0)}%)
                            </span>
                          </div>
                        ) : student.submission_date ? (
                          <span className="text-xs text-gray-500 truncate">
                            Submitted {new Date(student.submission_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not submitted</span>
                        )}

                        {student.is_late && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full shrink-0">
                            Late
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grading Panel - Desktop */}
          <div className="hidden md:flex md:w-3/5 lg:w-2/3 flex-col min-h-0">
            {selectedStudent ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {selectedStudent.student?.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {selectedStudent.student?.email}
                    </p>
                    {selectedStudent.student?.registration_number && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reg: {selectedStudent.student.registration_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Submission Info */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Submission Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          <StudentStatusBadge status={selectedStudent.status} />
                        </div>
                        {selectedStudent.submission_date && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 shrink-0">Submitted:</span>
                            <span className="text-gray-900 text-right">
                              {new Date(selectedStudent.submission_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedStudent.is_late && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Late Submission:</span>
                            <span className="text-red-600 font-medium">Yes</span>
                          </div>
                        )}
                        {selectedStudent.submission_content && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-gray-600 block mb-2">Submission:</span>
                            <p className="text-gray-900 text-sm bg-white p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                              {selectedStudent.submission_content}
                            </p>
                          </div>
                        )}
                        // @ts-expect-error - Auto-suppressed for migration
                        {selectedStudent.submission_files &&
                          // @ts-expect-error - Auto-suppressed for migration
                          selectedStudent.submission_files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-gray-600 block mb-2">Submitted Files:</span>
                              <div className="space-y-2">
                                // @ts-expect-error - Auto-suppressed for migration
                                {selectedStudent.submission_files.map((file, index) => (
                                  <div
                                    key={file.attachment_id || index}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-sm font-medium text-blue-900">
                                        {file.original_filename}
                                      </span>
                                      {file.file_size && (
                                        <span className="text-xs text-blue-600">
                                          ({(file.file_size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        openFile(file.file_url, file.original_filename)
                                      }
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Grading Form */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Grade (out of {assignment.totalPoints})
                      </label>
                      <input
                        type="number"
                        value={gradeData.grade_received}
                        onChange={(e) =>
                          setGradeData({ ...gradeData, grade_received: e.target.value })
                        }
                        min="0"
                        max={assignment.totalPoints}
                        step="0.01"
                        placeholder={`0 - ${assignment.totalPoints}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                      />
                      {gradeData.grade_received && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600">
                            Percentage:{' '}
                            {(
                              (parseFloat(gradeData.grade_received) / assignment.totalPoints) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          {/* <div className={`px-3 py-1 rounded-full text-sm font-medium ${((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                        ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 80 ? 'bg-blue-100 text-blue-700' :
                                                            ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                                ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 60 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                        }`}>
                                                        {((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 90 ? 'A' :
                                                            ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 80 ? 'B' :
                                                                ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 70 ? 'C' :
                                                                    ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 60 ? 'D' : 'F'}
                                                    </div> */}
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Instructor Feedback
                      </label>
                      <textarea
                        value={gradeData.instructor_feedback}
                        onChange={(e) =>
                          setGradeData({ ...gradeData, instructor_feedback: e.target.value })
                        }
                        rows={6}
                        placeholder="Provide constructive feedback for the student..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                    </div>

                    {/* Previous Feedback */}
                    {selectedStudent.status === 'graded' && selectedStudent.instructor_feedback && (
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-start gap-2">
                          <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                              Previous Feedback
                            </h4>
                            <p className="text-sm text-emerald-800">
                              {selectedStudent.instructor_feedback}
                            </p>
                            {selectedStudent.graded_date && (
                              <p className="text-xs text-emerald-600 mt-2">
                                Graded on {new Date(selectedStudent.graded_date).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50 shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setGradeData({ grade_received: '', instructor_feedback: '' });
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGradeSubmit}
                      disabled={submitting || !gradeData.grade_received}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submitting
                        ? 'Submitting...'
                        : selectedStudent.status === 'graded'
                          ? 'Update Grade'
                          : 'Submit Grade'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center p-4">
                  <AcademicCapIcon className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-sm">Select a student to grade their submission</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden fixed inset-0 bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 truncate">
                <AcademicCapIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="truncate">Grade Submissions</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5 truncate">{assignment?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors ml-2 shrink-0"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        {!showMobileGrading ? (
          // Students List Mobile
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All ({students.length})</option>
                <option value="submitted">
                  Submitted ({students.filter((s) => s.status === 'submitted').length})
                </option>
                <option value="graded">
                  Graded ({students.filter((s) => s.status === 'graded').length})
                </option>
                <option value="in-progress">
                  In Progress ({students.filter((s) => s.status === 'in-progress').length})
                </option>
                <option value="todo">
                  Not Started ({students.filter((s) => s.status === 'todo').length})
                </option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <ArrowPathIcon className="h-8 w-8 text-gray-300 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <UsersIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.student_assignment_id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setGradeData({
                          grade_received: student.grade_received?.toString() || '',
                          instructor_feedback: student.instructor_feedback || '',
                        });
                        setShowMobileGrading(true);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {student.student?.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {student.student?.email}
                          </p>
                        </div>
                        <StudentStatusBadge status={student.status} />
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        {student.status === 'graded' &&
                        student.grade_received !== null &&
                        student.grade_received !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-600">
                              {student.grade_received}/{assignment.totalPoints}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({student.grade_percentage?.toFixed(0)}%)
                            </span>
                          </div>
                        ) : student.submission_date ? (
                          <span className="text-xs text-gray-500">
                            {new Date(student.submission_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not submitted</span>
                        )}

                        {student.is_late && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            Late
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Grading Panel Mobile - Content same as desktop but optimized for mobile
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => {
                  setShowMobileGrading(false);
                  setSelectedStudent(null);
                  setGradeData({ grade_received: '', instructor_feedback: '' });
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900 truncate">Grade Student</h3>
            </div>

            {selectedStudent && (
              <>
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {/* Same content as desktop grading panel but with mobile-optimized spacing */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                      {selectedStudent.student?.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {selectedStudent.student?.email}
                    </p>
                    {selectedStudent.student?.registration_number && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reg: {selectedStudent.student.registration_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-5">
                    {/* Same submission info, grading form, and feedback sections as desktop */}
                    {/* Submission Info */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Submission Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          <StudentStatusBadge status={selectedStudent.status} />
                        </div>
                        {selectedStudent.submission_date && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 shrink-0">Submitted:</span>
                            <span className="text-gray-900 text-xs text-right">
                              {new Date(selectedStudent.submission_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedStudent.is_late && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Late:</span>
                            <span className="text-red-600 font-medium">Yes</span>
                          </div>
                        )}
                        {selectedStudent.submission_content && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-gray-600 block mb-2">Submission:</span>
                            <p className="text-gray-900 text-xs bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                              {selectedStudent.submission_content}
                            </p>
                          </div>
                        )}
                        // @ts-expect-error - Auto-suppressed for migration
                        {selectedStudent.submission_files &&
                          // @ts-expect-error - Auto-suppressed for migration
                          selectedStudent.submission_files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-gray-600 block mb-2">Submitted Files:</span>
                              <div className="space-y-2">
                                // @ts-expect-error - Auto-suppressed for migration
                                {selectedStudent.submission_files.map((file, index) => (
                                  <div
                                    key={file.attachment_id || index}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <svg
                                        className="w-3 h-3 text-blue-600 shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-blue-900 truncate">
                                        {file.original_filename}
                                      </span>
                                      {file.file_size && (
                                        <span className="text-xs text-blue-600 shrink-0">
                                          ({(file.file_size / 1024 / 1024).toFixed(1)}MB)
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        openFile(file.file_url, file.original_filename)
                                      }
                                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors shrink-0"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Grading Form */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Grade (out of {assignment.totalPoints})
                      </label>
                      <input
                        type="number"
                        value={gradeData.grade_received}
                        onChange={(e) =>
                          setGradeData({ ...gradeData, grade_received: e.target.value })
                        }
                        min="0"
                        max={assignment.totalPoints}
                        step="0.01"
                        placeholder={`0 - ${assignment.totalPoints}`}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold"
                      />
                      {gradeData.grade_received && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-600">
                            {(
                              (parseFloat(gradeData.grade_received) / assignment.totalPoints) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          {/* <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                        ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 80 ? 'bg-blue-100 text-blue-700' :
                                                            ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                                ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 60 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                        }`}>
                                                        {((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 90 ? 'A' :
                                                            ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 80 ? 'B' :
                                                                ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 70 ? 'C' :
                                                                    ((parseFloat(gradeData.grade_received) / assignment.totalPoints) * 100) >= 60 ? 'D' : 'F'}
                                                    </div> */}
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={gradeData.instructor_feedback}
                        onChange={(e) =>
                          setGradeData({ ...gradeData, instructor_feedback: e.target.value })
                        }
                        rows={5}
                        placeholder="Provide constructive feedback..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                    </div>

                    {/* Previous Feedback */}
                    {selectedStudent.status === 'graded' && selectedStudent.instructor_feedback && (
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <div className="flex items-start gap-2">
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-emerald-900 mb-1">
                              Previous Feedback
                            </h4>
                            <p className="text-xs text-emerald-800">
                              {selectedStudent.instructor_feedback}
                            </p>
                            {selectedStudent.graded_date && (
                              <p className="text-xs text-emerald-600 mt-1.5">
                                {new Date(selectedStudent.graded_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowMobileGrading(false);
                        setSelectedStudent(null);
                        setGradeData({ grade_received: '', instructor_feedback: '' });
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGradeSubmit}
                      disabled={submitting || !gradeData.grade_received}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {submitting
                        ? 'Saving...'
                        : selectedStudent.status === 'graded'
                          ? 'Update'
                          : 'Submit'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default GradingModal;
