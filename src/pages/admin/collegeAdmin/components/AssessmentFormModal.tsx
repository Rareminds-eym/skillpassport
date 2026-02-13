import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Assessment } from '../../../../types/college';

interface AssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Assessment>) => Promise<{ success: boolean; error?: string }>;
  assessment?: Assessment | null;
  departments: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string; department_id: string }>;
  courses: Array<{ id: string; course_name: string; course_code: string }>;
}

const AssessmentFormModal: React.FC<AssessmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assessment,
  departments,
  programs,
  courses,
}) => {
  const [formData, setFormData] = useState<Partial<Assessment>>({
    type: 'IA',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    department_id: '',
    program_id: '',
    semester: 1,
    course_id: '',
    duration_minutes: 90,
    total_marks: 50,
    pass_marks: 20,
    instructions: '',
    syllabus_coverage: [],
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredPrograms, setFilteredPrograms] = useState(programs);
  const [filteredCourses, setFilteredCourses] = useState(courses);

  // Generate assessment code preview
  const assessmentCodePreview = React.useMemo(() => {
    if (!formData.type || !formData.semester || !formData.academic_year) return '';
    
    const selectedCourse = courses.find(c => c.id === formData.course_id);
    const courseCode = selectedCourse?.course_code || 'COURSE';
    const typeCode = formData.type.substring(0, 3).toUpperCase();
    const year = formData.academic_year.split('-')[0] || new Date().getFullYear();
    
    return `${typeCode}-${courseCode.toUpperCase()}-S${formData.semester}-${year}`;
  }, [formData.type, formData.semester, formData.academic_year, formData.course_id, courses]);

  useEffect(() => {
    if (assessment) {
      setFormData(assessment);
    } else {
      // Reset to default values when creating new assessment
      setFormData({
        type: 'IA',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        department_id: '',
        program_id: '',
        semester: 1,
        course_id: '',
        duration_minutes: 90,
        total_marks: 50,
        pass_marks: 20,
        instructions: '',
        assessment_code: '',
        syllabus_coverage: [],
        status: 'draft',
      });
    }
  }, [assessment, isOpen]);

  // Filter programs when department changes
  useEffect(() => {
    if (formData.department_id) {
      setFilteredPrograms(programs.filter(p => p.department_id === formData.department_id));
      // Reset program and course if department changed
      if (!programs.find(p => p.id === formData.program_id && p.department_id === formData.department_id)) {
        setFormData(prev => ({ ...prev, program_id: '', course_id: '' }));
      }
    } else {
      setFilteredPrograms([]);
      setFormData(prev => ({ ...prev, program_id: '', course_id: '' }));
    }
  }, [formData.department_id, programs]);

  // Filter courses when semester changes
  useEffect(() => {
    if (formData.semester) {
      setFilteredCourses(courses.filter(c => c.semester === formData.semester));
      // Reset course if semester changed
      if (!courses.find(c => c.id === formData.course_id && c.semester === formData.semester)) {
        setFormData(prev => ({ ...prev, course_id: '' }));
      }
    } else {
      setFilteredCourses([]);
      setFormData(prev => ({ ...prev, course_id: '' }));
    }
  }, [formData.semester, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit(formData);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to save assessment');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  const assessmentTypes = [
    { value: 'IA', label: 'Internal Assessment' },
    { value: 'end_semester', label: 'End Semester Exam' },
    { value: 'practical', label: 'Practical Exam' },
    { value: 'viva', label: 'Viva' },
    { value: 'arrears', label: 'Arrears Exam' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {assessment ? 'Edit Assessment' : 'Create New Assessment'}
            </h2>
            <div className="flex items-center gap-4">
              {assessmentCodePreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Code:</span> <span className="font-mono">{assessmentCodePreview}</span>
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {assessmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2024-25"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Code (Optional)
            </label>
            <input
              type="text"
              value={formData.assessment_code || ''}
              onChange={(e) => setFormData({ ...formData, assessment_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave empty for auto-generated code"
            />
            <p className="mt-1 text-xs text-gray-500">
              If left empty, code will be auto-generated based on type, course, semester, and year
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value, program_id: '', course_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value, course_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.department_id}
              >
                <option value="">Select Program</option>
                {Array.isArray(filteredPrograms) && filteredPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
              {!formData.department_id && (
                <p className="mt-1 text-xs text-gray-500">Select a department first</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value), course_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.semester}
              >
                <option value="">Select Course</option>
                {Array.isArray(filteredCourses) && filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
              {formData.semester && filteredCourses.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No courses found for Semester {formData.semester}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="30"
                max="300"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pass Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.pass_marks}
                onChange={(e) => setFormData({ ...formData, pass_marks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter exam instructions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : assessment ? 'Update Assessment' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentFormModal;
