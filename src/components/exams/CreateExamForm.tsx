import React, { useState, useCallback, useMemo } from 'react';
import {
  PlusCircleIcon,
  TrashIcon,
  CheckIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { UIExam, UISubject } from '../../hooks/useExams';

interface CreateExamFormProps {
  onSave: (examData: Partial<UIExam>) => void;
  onCancel: () => void;
  editExam?: UIExam | null;
  assessmentTypes: unknown[];
  subjects: unknown[];
  grades: string[];
  getSections: (grade: string, academicYear?: string) => string[];
}

const CreateExamForm: React.FC<CreateExamFormProps> = ({
  onSave,
  onCancel,
  editExam,
  assessmentTypes,
  subjects: availableSubjects,
  grades,
  getSections,
}) => {
  const [formData, setFormData] = useState({
    name: editExam?.name || '',
    // @ts-expect-error - Auto-suppressed for migration
    type: editExam?.type || assessmentTypes[0]?.value || 'periodic_test',
    grade: editExam?.grade || '',
    section: editExam?.section || '',
    academicYear: editExam?.academicYear || '2024-2025',
    startDate: editExam?.startDate || '',
    endDate: editExam?.endDate || '',
    instructions: editExam?.instructions || '',
  });

  const [subjects, setSubjects] = useState<UISubject[]>(editExam?.subjects || []);
  const [newSubject, setNewSubject] = useState({
    name: '',
    totalMarks: 100,
    passingMarks: 35,
    duration: 180,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized sections calculation
  const sectionsForGrade = useMemo(
    () => getSections(formData.grade, formData.academicYear),
    [getSections, formData.grade, formData.academicYear]
  );

  const handleAddSubject = useCallback(() => {
    if (!newSubject.name) {
      setErrors((prev) => ({ ...prev, subject: 'Please select a subject' }));
      return;
    }
    if (subjects.some((s) => s.name === newSubject.name)) {
      setErrors((prev) => ({ ...prev, subject: 'Subject already added' }));
      return;
    }

    setSubjects((prev) => [...prev, { id: Date.now().toString(), ...newSubject }]);
    setNewSubject({ name: '', totalMarks: 100, passingMarks: 35, duration: 180 });
    setErrors((prev) => ({ ...prev, subject: '' }));
  }, [newSubject, subjects]);

  const handleSubmit = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Exam name is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (subjects.length === 0) newErrors.subjects = 'At least one subject is required';

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Subject validation
    subjects.forEach((subject) => {
      if (subject.passingMarks > subject.totalMarks) {
        newErrors.subjects = 'Passing marks cannot exceed total marks';
      }
      if (subject.duration < 30 || subject.duration > 300) {
        newErrors.subjects = 'Duration must be between 30 and 300 minutes';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      subjects,
      id: editExam?.id || Date.now().toString(),
      status: editExam?.status || 'draft',
      createdBy: 'Admin',
      createdAt: editExam?.createdAt || new Date().toISOString(),
      timetable: editExam?.timetable || [],
      invigilation: editExam?.invigilation || [],
      marks: editExam?.marks || [],
    });
  }, [formData, subjects, editExam, onSave]);

  // Memoized available subjects for dropdown
  const availableSubjectsForDropdown = useMemo(
    () =>
      availableSubjects.filter(
        (s: { name: string }) => !subjects.some((sub) => sub.name === s.name)
      ),
    [availableSubjects, subjects]
  );

  return (
    <div className="space-y-6">
      {/* Alert if errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.values(errors).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Name <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g., Mid-Term Examination 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {(assessmentTypes as { value: string; label: string }[]).map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <select
            value={formData.academicYear}
            onChange={(e) =>
              setFormData({ ...formData, academicYear: e.target.value, section: '' })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Class *</label>
          <select
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value, section: '' })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select Grade</option>
            {grades.map((grade: string) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
          <select
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            disabled={!formData.grade || !formData.academicYear}
          >
            <option value="">All Sections</option>
            {sectionsForGrade.map((section: string) => (
              <option key={section} value={section}>
                Section {section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions (Optional)
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            placeholder="General instructions for the exam..."
          />
        </div>
      </div>

      {/* Subjects Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects *</h3>

        {/* Add Subject Form */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-4 border border-indigo-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select Subject</option>
                {availableSubjectsForDropdown.map((subject: { id: string; name: string }) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
              <input
                type="number"
                value={newSubject.totalMarks}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, totalMarks: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passing Marks</label>
              <input
                type="number"
                value={newSubject.passingMarks}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, passingMarks: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
              <input
                type="number"
                value={newSubject.duration}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, duration: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min="1"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddSubject}
            className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Subject
          </button>
        </div>

        {/* Subjects List */}
        {subjects.length > 0 ? (
          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                    <p className="text-xs text-gray-500">
                      {subject.totalMarks} marks • Pass: {subject.passingMarks} • {subject.duration}{' '}
                      min
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjects(subjects.filter((s) => s.id !== subject.id))}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No subjects added yet. Add subjects above.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          <CheckIcon className="h-4 w-4" />
          {editExam ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </div>
  );
};

export default CreateExamForm;
