import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Save, Upload } from 'lucide-react';
import type { MarkEntry } from '../../../../types/college';

interface Student {
  id: string;
  name: string;
  roll_number: string;
}

interface MarkEntryGridProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  assessmentName: string;
  totalMarks: number;
  students: Student[];
  existingMarks?: MarkEntry[];
  onSave: (marks: Partial<MarkEntry>[]) => Promise<{ success: boolean; error?: string }>;
  onSubmit: () => Promise<{ success: boolean; error?: string }>;
  isLocked?: boolean;
}

const MarkEntryGrid: React.FC<MarkEntryGridProps> = ({
  isOpen,
  onClose,
  assessmentId,
  assessmentName,
  totalMarks,
  students,
  existingMarks = [],
  onSave,
  onSubmit,
  isLocked = false,
}) => {
  const [marks, setMarks] = useState<Map<string, Partial<MarkEntry>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Initialize marks from existing data or create empty entries
    const marksMap = new Map<string, Partial<MarkEntry>>();

    students.forEach((student) => {
      const existing = existingMarks.find((m) => m.student_id === student.id);
      marksMap.set(
        student.id,
        existing || {
          assessment_id: assessmentId,
          student_id: student.id,
          marks_obtained: 0,
          is_absent: false,
          is_exempt: false,
          remarks: '',
        }
      );
    });

    setMarks(marksMap);
  }, [students, existingMarks, assessmentId]);

  const updateMark = (studentId: string, field: keyof MarkEntry, value: any) => {
    const updated = new Map(marks);
    const current = updated.get(studentId) || {};
    updated.set(studentId, { ...current, [field]: value });
    setMarks(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate marks
    for (const [studentId, mark] of marks.entries()) {
      if (!mark.is_absent && !mark.is_exempt) {
        if (
          mark.marks_obtained === undefined ||
          mark.marks_obtained < 0 ||
          mark.marks_obtained > totalMarks
        ) {
          const student = students.find((s) => s.id === studentId);
          setError(`Invalid marks for ${student?.name}. Must be between 0 and ${totalMarks}`);
          setLoading(false);
          return;
        }
      }
    }

    const marksArray = Array.from(marks.values());
    const result = await onSave(marksArray);

    if (result.success) {
      setSuccess('Marks saved successfully!');
    } else {
      setError(result.error || 'Failed to save marks');
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (
      !confirm('Submit marks for moderation? You will not be able to edit them after submission.')
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onSubmit();

    if (result.success) {
      setSuccess('Marks submitted successfully!');
      setTimeout(() => onClose(), 2000);
    } else {
      setError(result.error || 'Failed to submit marks');
    }

    setLoading(false);
  };

  const handleBulkUpload = () => {
    // Placeholder for bulk upload functionality
    alert('Bulk upload feature coming soon! You can upload Excel file with student marks.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mark Entry</h2>
              <p className="text-sm text-gray-600 mt-1">
                {assessmentName} • Total Marks: {totalMarks}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              {success}
            </div>
          )}

          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5" />
              Marks are locked and cannot be edited. Contact admin for moderation.
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {students.length} students •{' '}
              {
                Array.from(marks.values()).filter(
                  (m) => m.marks_obtained !== undefined && m.marks_obtained > 0
                ).length
              }{' '}
              marks entered
            </p>
            <button
              onClick={handleBulkUpload}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isLocked}
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Roll Number
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                    Marks (/{totalMarks})
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 w-24">
                    Absent
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 w-24">
                    Exempt
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => {
                  const mark = marks.get(student.id) || {};
                  const isAbsent = mark.is_absent || false;
                  const isExempt = mark.is_exempt || false;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student.roll_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={totalMarks}
                          value={mark.marks_obtained || ''}
                          onChange={(e) =>
                            updateMark(
                              student.id,
                              'marks_obtained',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isLocked || isAbsent || isExempt}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={(e) => {
                            updateMark(student.id, 'is_absent', e.target.checked);
                            if (e.target.checked) {
                              updateMark(student.id, 'is_exempt', false);
                              updateMark(student.id, 'marks_obtained', 0);
                            }
                          }}
                          disabled={isLocked}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isExempt}
                          onChange={(e) => {
                            updateMark(student.id, 'is_exempt', e.target.checked);
                            if (e.target.checked) {
                              updateMark(student.id, 'is_absent', false);
                              updateMark(student.id, 'marks_obtained', 0);
                            }
                          }}
                          disabled={isLocked}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={mark.remarks || ''}
                          onChange={(e) => updateMark(student.id, 'remarks', e.target.value)}
                          disabled={isLocked}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLocked && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LockClosedIcon className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit for Moderation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkEntryGrid;
