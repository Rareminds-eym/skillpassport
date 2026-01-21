/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

/* ==============================
   TYPES & INTERFACES
   ============================== */

// Attendance Policy Settings
interface AttendancePolicy {
  id: string;
  type: 'course_level' | 'department_level' | 'program_level';
  minimumPercentage: number;
  labPracticalThreshold?: number;
  departmentId?: string;
  courseId?: string;
}

/* ==============================
   MODAL WRAPPER
   ============================== */
const ModalWrapper = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  size = 'default',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'default' | 'large';
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div
          className={`relative w-full ${
            size === 'large' ? 'max-w-4xl' : 'max-w-2xl'
          } transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   STATS CARD
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  onClick,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo';
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   ATTENDANCE POLICY MODAL
   ============================== */
const AttendancePolicyModal = ({
  isOpen,
  onClose,
  policy,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  policy?: AttendancePolicy | null;
  onSaved: (policy: AttendancePolicy) => void;
}) => {
  const [formData, setFormData] = useState({
    policyName: '',
    type: 'course_level' as 'course_level' | 'department_level' | 'program_level',
    courseId: '',
    departmentId: '',
    programId: '',
    minimumPercentage: 75,
    labPracticalThreshold: 80,
    hasLabPractical: true,
    theoryThreshold: 75,
    tutorialThreshold: 75,
    projectThreshold: 80,
    enableSeparateThresholds: true,
    attendanceCalculation: 'overall' as 'overall' | 'separate' | 'weighted',
    theoryWeight: 60,
    labWeight: 40,
    gracePeriod: 5,
    medicalLeaveAllowed: true,
    maxMedicalDays: 15,
    condonationRules: true,
    maxCondonationPercentage: 5,
    warningThresholds: [60, 65, 70],
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Sample courses for dropdown
  const availableCourses = [
    { id: 'CS101', name: 'Data Structures and Algorithms', type: 'theory', credits: 4 },
    { id: 'CS102', name: 'Database Management Systems', type: 'theory', credits: 3 },
    { id: 'CS103', name: 'Computer Networks Lab', type: 'practical', credits: 2 },
    { id: 'CS104', name: 'Software Engineering', type: 'theory', credits: 4 },
    { id: 'CS105', name: 'Web Development Lab', type: 'practical', credits: 2 },
  ];

  const departments = [
    { id: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'IT', name: 'Information Technology' },
    { id: 'ECE', name: 'Electronics & Communication' },
    { id: 'ME', name: 'Mechanical Engineering' },
  ];

  useEffect(() => {
    if (policy && isOpen) {
      setFormData({
        policyName: `${policy.type} Policy`,
        type: policy.type,
        courseId: policy.courseId || '',
        departmentId: policy.departmentId || '',
        programId: '',
        minimumPercentage: policy.minimumPercentage,
        labPracticalThreshold: policy.labPracticalThreshold || 80,
        hasLabPractical: !!policy.labPracticalThreshold,
        theoryThreshold: policy.minimumPercentage,
        tutorialThreshold: 75,
        projectThreshold: 80,
        enableSeparateThresholds: !!policy.labPracticalThreshold,
        attendanceCalculation: 'overall',
        theoryWeight: 60,
        labWeight: 40,
        gracePeriod: 5,
        medicalLeaveAllowed: true,
        maxMedicalDays: 15,
        condonationRules: true,
        maxCondonationPercentage: 5,
        warningThresholds: [60, 65, 70],
        isActive: true,
      });
    } else if (!policy && isOpen) {
      setFormData({
        policyName: '',
        type: 'course_level',
        courseId: '',
        departmentId: '',
        programId: '',
        minimumPercentage: 75,
        labPracticalThreshold: 80,
        hasLabPractical: true,
        theoryThreshold: 75,
        tutorialThreshold: 75,
        projectThreshold: 80,
        enableSeparateThresholds: true,
        attendanceCalculation: 'overall',
        theoryWeight: 60,
        labWeight: 40,
        gracePeriod: 5,
        medicalLeaveAllowed: true,
        maxMedicalDays: 15,
        condonationRules: true,
        maxCondonationPercentage: 5,
        warningThresholds: [60, 65, 70],
        isActive: true,
      });
    }
  }, [policy, isOpen]);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: policy?.id || Date.now().toString(),
        type: formData.type,
        minimumPercentage: formData.minimumPercentage,
        labPracticalThreshold: formData.enableSeparateThresholds
          ? formData.labPracticalThreshold
          : undefined,
        courseId: formData.courseId,
        departmentId: formData.departmentId,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={policy ? 'Edit Attendance Policy' : 'Create Attendance Policy'}
      subtitle="Configure course-level attendance requirements with lab/practical thresholds"
      size="large"
    >
      <div className="space-y-6">
        {/* Policy Type and Scope */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Policy Scope</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="course_level">Course Level</option>
                <option value="department_level">Department Level</option>
                <option value="program_level">Program Level</option>
              </select>
            </div>

            {formData.type === 'course_level' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a course</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.id} - {course.name} ({course.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'department_level' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Name</label>
              <input
                value={formData.policyName}
                onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g., CS101 Attendance Policy"
              />
            </div>
          </div>
        </div>

        {/* Attendance Thresholds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Thresholds */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Attendance Thresholds</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Minimum Attendance (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.minimumPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, minimumPercentage: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="0"
                max="100"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableSeparateThresholds"
                checked={formData.enableSeparateThresholds}
                onChange={(e) =>
                  setFormData({ ...formData, enableSeparateThresholds: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label
                htmlFor="enableSeparateThresholds"
                className="text-sm font-medium text-gray-700"
              >
                Enable Separate Thresholds for Theory/Lab/Practical
              </label>
            </div>

            {formData.enableSeparateThresholds && (
              <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theory Classes (%)
                  </label>
                  <input
                    type="number"
                    value={formData.theoryThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, theoryThreshold: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab/Practical Classes (%)
                  </label>
                  <input
                    type="number"
                    value={formData.labPracticalThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labPracticalThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tutorial Classes (%)
                  </label>
                  <input
                    type="number"
                    value={formData.tutorialThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, tutorialThreshold: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Calculation Method
              </label>
              <select
                value={formData.attendanceCalculation}
                onChange={(e) =>
                  setFormData({ ...formData, attendanceCalculation: e.target.value as any })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="overall">Overall Percentage</option>
                <option value="separate">Separate for Theory/Lab</option>
                <option value="weighted">Weighted Average</option>
              </select>
            </div>

            {formData.attendanceCalculation === 'weighted' && (
              <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theory Weight (%)
                  </label>
                  <input
                    type="number"
                    value={formData.theoryWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, theoryWeight: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Weight (%)
                  </label>
                  <input
                    type="number"
                    value={formData.labWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, labWeight: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Advanced Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Advanced Settings</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Period (Days)
              </label>
              <input
                type="number"
                value={formData.gracePeriod}
                onChange={(e) =>
                  setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="0"
                max="30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Days at the beginning of semester with relaxed attendance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="medicalLeaveAllowed"
                checked={formData.medicalLeaveAllowed}
                onChange={(e) =>
                  setFormData({ ...formData, medicalLeaveAllowed: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label htmlFor="medicalLeaveAllowed" className="text-sm font-medium text-gray-700">
                Allow Medical Leave Exemptions
              </label>
            </div>

            {formData.medicalLeaveAllowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Medical Leave Days
                </label>
                <input
                  type="number"
                  value={formData.maxMedicalDays}
                  onChange={(e) =>
                    setFormData({ ...formData, maxMedicalDays: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  min="0"
                  max="60"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="condonationRules"
                checked={formData.condonationRules}
                onChange={(e) => setFormData({ ...formData, condonationRules: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label htmlFor="condonationRules" className="text-sm font-medium text-gray-700">
                Enable Attendance Condonation
              </label>
            </div>

            {formData.condonationRules && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Condonation (%)
                </label>
                <input
                  type="number"
                  value={formData.maxCondonationPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxCondonationPercentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  min="0"
                  max="15"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum percentage that can be condoned by authorities
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Thresholds (%)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {formData.warningThresholds.map((threshold, index) => (
                  <input
                    key={index}
                    type="number"
                    value={threshold}
                    onChange={(e) => {
                      const newThresholds = [...formData.warningThresholds];
                      newThresholds[index] = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, warningThresholds: newThresholds });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="100"
                    placeholder={`Warning ${index + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Attendance percentages that trigger warnings
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Policy
              </label>
            </div>
          </div>
        </div>

        {/* Policy Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Policy Preview</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">
                  {formData.policyName || 'Attendance Policy'}
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.type === 'course_level' &&
                    formData.courseId &&
                    `Course: ${formData.courseId}`}
                  {formData.type === 'department_level' &&
                    formData.departmentId &&
                    `Department: ${formData.departmentId}`}
                  {formData.type === 'program_level' && 'Program Level Policy'}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  formData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <span className="text-blue-900 font-medium">Overall</span>
                <p className="text-blue-800 font-bold">{formData.minimumPercentage}%</p>
              </div>
              {formData.enableSeparateThresholds && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <span className="text-green-900 font-medium">Theory</span>
                    <p className="text-green-800 font-bold">{formData.theoryThreshold}%</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                    <span className="text-purple-900 font-medium">Lab/Practical</span>
                    <p className="text-purple-800 font-bold">{formData.labPracticalThreshold}%</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <span className="text-amber-900 font-medium">Tutorial</span>
                    <p className="text-amber-800 font-bold">{formData.tutorialThreshold}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            submitting ||
            (!formData.courseId && formData.type === 'course_level') ||
            (!formData.departmentId && formData.type === 'department_level')
          }
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {policy ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {policy ? 'Update Policy' : 'Create Policy'}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN ATTENDANCE POLICY COMPONENT
   ============================== */
const AttendancePolicyMaster = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editAttendancePolicy, setEditAttendancePolicy] = useState<AttendancePolicy | null>(null);

  // Data states
  const [attendancePolicies, setAttendancePolicies] = useState<AttendancePolicy[]>([
    { id: '1', type: 'course_level', minimumPercentage: 75, courseId: 'CS101' },
    {
      id: '2',
      type: 'course_level',
      minimumPercentage: 75,
      labPracticalThreshold: 80,
      courseId: 'CS103',
    },
    { id: '3', type: 'department_level', minimumPercentage: 80, departmentId: 'CSE' },
    {
      id: '4',
      type: 'course_level',
      minimumPercentage: 70,
      labPracticalThreshold: 85,
      courseId: 'CS105',
    },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSaveAttendancePolicy = (policy: AttendancePolicy) => {
    if (editAttendancePolicy) {
      setAttendancePolicies((prev) => prev.map((p) => (p.id === policy.id ? policy : p)));
    } else {
      setAttendancePolicies((prev) => [...prev, policy]);
    }
    setEditAttendancePolicy(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Attendance Policy Master
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                Configure course-level attendance requirements with minimum percentage per course
                and separate lab/practical thresholds
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">System Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            label="Total Policies"
            value={attendancePolicies.length}
            icon={ClockIcon}
            color="blue"
          />
          <StatsCard
            label="Course Level"
            value={attendancePolicies.filter((p) => p.type === 'course_level').length}
            icon={AcademicCapIcon}
            color="green"
          />
          <StatsCard
            label="Department Level"
            value={attendancePolicies.filter((p) => p.type === 'department_level').length}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatsCard
            label="Average Threshold"
            value={`${Math.round(attendancePolicies.reduce((sum, p) => sum + p.minimumPercentage, 0) / attendancePolicies.length)}%`}
            icon={CalendarDaysIcon}
            color="amber"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Attendance Policy Settings
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                  Course-level attendance with minimum % per course, lab/practical separate
                  thresholds
                </p>

                {/* Policy Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Total Policies</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800 mt-1">
                      {attendancePolicies.length}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-900">Course Level</span>
                    </div>
                    <p className="text-lg font-bold text-green-800 mt-1">
                      {attendancePolicies.filter((p) => p.type === 'course_level').length}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-900">Dept Level</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800 mt-1">
                      {attendancePolicies.filter((p) => p.type === 'department_level').length}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-900">Avg Threshold</span>
                    </div>
                    <p className="text-lg font-bold text-amber-800 mt-1">
                      {Math.round(
                        attendancePolicies.reduce((sum, p) => sum + p.minimumPercentage, 0) /
                          attendancePolicies.length
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Policy</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {attendancePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ClockIcon className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                          {policy.type === 'course_level'
                            ? 'Course Level Policy'
                            : 'Department Level Policy'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {policy.type === 'course_level' && policy.courseId && (
                          <>
                            Course:{' '}
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {policy.courseId}
                            </span>
                          </>
                        )}
                        {policy.type === 'department_level' && policy.departmentId && (
                          <>
                            Department:{' '}
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {policy.departmentId}
                            </span>
                          </>
                        )}
                        {policy.type === 'program_level' && (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            Program Level Policy
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                      {policy.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          Minimum Attendance
                        </span>
                        <span className="text-lg font-bold text-blue-800">
                          {policy.minimumPercentage}%
                        </span>
                      </div>
                    </div>
                    {policy.labPracticalThreshold && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">Lab/Practical</span>
                          <span className="text-lg font-bold text-green-800">
                            {policy.labPracticalThreshold}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditAttendancePolicy(policy);
                        setShowAttendanceModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Edit Policy
                    </button>
                    <button
                      onClick={() => {
                        setAttendancePolicies((prev) => prev.filter((p) => p.id !== policy.id));
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        <AttendancePolicyModal
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false);
            setEditAttendancePolicy(null);
          }}
          policy={editAttendancePolicy}
          onSaved={handleSaveAttendancePolicy}
        />
      </div>
    </div>
  );
};

export default AttendancePolicyMaster;
