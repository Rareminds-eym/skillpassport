/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  AcademicCapIcon,
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

/* ==============================
   TYPES & INTERFACES
   ============================== */
type ExamType = "periodic" | "term" | "unit" | "skill";

interface Exam {
  id: string;
  name: string;
  examType: ExamType;
  classId: string;
  sectionId: string;
  totalMarks: number;
  date: string;
  syllabus: string[];
  timetable?: string;
  invigilators?: string[];
  status: "draft" | "scheduled" | "ongoing" | "completed" | "published";
  createdAt: string;
}

interface Mark {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  marksScored: number;
  moderatedMarks?: number;
  published: boolean;
  remarks?: string;
}

/* ==============================
   MODAL WRAPPER COMPONENT
   ============================== */
const ModalWrapper = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  size = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "default" | "large";
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={`relative w-full ${
            size === "large" ? "max-w-4xl" : "max-w-2xl"
          } transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   STATS CARD COMPONENT
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  trend,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo";
  trend?: { value: number; isPositive: boolean };
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div
          className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   CREATE EXAM MODAL
   ============================== */
const CreateExamModal = ({
  isOpen,
  onClose,
  onCreated,
  editExam,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (exam: Exam) => void;
  editExam?: Exam | null;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    examType: "periodic" as ExamType,
    classId: "",
    sectionId: "",
    totalMarks: "",
    date: "",
    syllabus: [] as string[],
  });
  const [syllabusInput, setSyllabusInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const classes = ["9", "10", "11", "12"];
  const sections = ["A", "B", "C", "D"];

  useEffect(() => {
    if (editExam) {
      setFormData({
        name: editExam.name,
        examType: editExam.examType,
        classId: editExam.classId,
        sectionId: editExam.sectionId,
        totalMarks: editExam.totalMarks.toString(),
        date: editExam.date,
        syllabus: editExam.syllabus,
      });
    } else {
      setFormData({
        name: "",
        examType: "periodic",
        classId: "",
        sectionId: "",
        totalMarks: "",
        date: "",
        syllabus: [],
      });
    }
    setErrors({});
  }, [editExam, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Exam name cannot be blank.";
    }
    if (!formData.totalMarks || parseInt(formData.totalMarks) <= 0) {
      newErrors.totalMarks = "Invalid total marks.";
    }
    if (!formData.date) {
      newErrors.date = "Exam date is required.";
    }
    if (!formData.classId) {
      newErrors.classId = "Class selection is required.";
    }
    if (!formData.sectionId) {
      newErrors.sectionId = "Section selection is required.";
    }
    if (formData.syllabus.length === 0) {
      newErrors.syllabus = "Select chapters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      onCreated({
        id: editExam?.id || Date.now().toString(),
        name: formData.name.trim(),
        examType: formData.examType,
        classId: formData.classId,
        sectionId: formData.sectionId,
        totalMarks: parseInt(formData.totalMarks),
        date: formData.date,
        syllabus: formData.syllabus,
        status: editExam?.status || "draft",
        createdAt: editExam?.createdAt || new Date().toISOString(),
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const addSyllabusItem = () => {
    if (syllabusInput.trim() && !formData.syllabus.includes(syllabusInput.trim())) {
      setFormData({
        ...formData,
        syllabus: [...formData.syllabus, syllabusInput.trim()],
      });
      setSyllabusInput("");
    }
  };

  const removeSyllabusItem = (item: string) => {
    setFormData({
      ...formData,
      syllabus: formData.syllabus.filter((s) => s !== item),
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editExam ? "Edit Exam" : "Create New Exam"}
      subtitle={editExam ? "Update exam details" : "Set up a new examination"}
      size="large"
    >
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Name <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
            placeholder="e.g., Mid-Term Mathematics Exam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.examType}
            onChange={(e) =>
              setFormData({ ...formData, examType: e.target.value as ExamType })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="periodic">Periodic Test</option>
            <option value="term">Term Exam</option>
            <option value="unit">Unit Test</option>
            <option value="skill">Skill Assessment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.totalMarks}
            onChange={(e) =>
              setFormData({ ...formData, totalMarks: e.target.value })
            }
            className={`w-full rounded-lg border ${
              errors.totalMarks ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
            placeholder="100"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.classId ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.sectionId}
            onChange={(e) =>
              setFormData({ ...formData, sectionId: e.target.value })
            }
            className={`w-full rounded-lg border ${
              errors.sectionId ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.date ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Syllabus (Chapters) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              value={syllabusInput}
              onChange={(e) => setSyllabusInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSyllabusItem()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              placeholder="Enter chapter name and press Enter"
            />
            <button
              type="button"
              onClick={addSyllabusItem}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>
          {formData.syllabus.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.syllabus.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeSyllabusItem(item)}
                    className="hover:text-indigo-900"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.syllabus && (
            <p className="mt-2 text-sm text-red-600">{errors.syllabus}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editExam ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editExam ? "Update Exam" : "Create Exam"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MARK ENTRY MODAL
   ============================== */
const MarkEntryModal = ({
  isOpen,
  onClose,
  exam,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  onSaved: (marks: Mark[]) => void;
}) => {
  // Mock student data
  const mockStudents = [
    { id: "1", name: "Aarav Sharma" },
    { id: "2", name: "Diya Patel" },
    { id: "3", name: "Arjun Kumar" },
    { id: "4", name: "Ananya Singh" },
    { id: "5", name: "Rohan Verma" },
  ];

  const [marks, setMarks] = useState<Mark[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (exam && isOpen) {
      setMarks(
        mockStudents.map((student) => ({
          id: `${exam.id}-${student.id}`,
          examId: exam.id,
          studentId: student.id,
          studentName: student.name,
          marksScored: 0,
          published: false,
        }))
      );
    }
  }, [exam, isOpen]);

  const updateMark = (studentId: string, value: number) => {
    if (!exam) return;

    const newErrors = { ...errors };
    if (value < 0 || value > exam.totalMarks) {
      newErrors[studentId] = `Marks must be between 0 and ${exam.totalMarks}`;
    } else {
      delete newErrors[studentId];
    }
    setErrors(newErrors);

    setMarks((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, marksScored: value } : m
      )
    );
  };

  const updateModeratedMark = (studentId: string, value: number) => {
    if (!exam) return;

    const mark = marks.find((m) => m.studentId === studentId);
    if (!mark) return;

    const deviation = Math.abs(value - mark.marksScored);
    const maxDeviation = mark.marksScored * 0.1;

    const newErrors = { ...errors };
    if (deviation > maxDeviation) {
      newErrors[`mod-${studentId}`] =
        "Moderation cannot exceed ±10% of original marks";
    } else {
      delete newErrors[`mod-${studentId}`];
    }
    setErrors(newErrors);

    setMarks((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, moderatedMarks: value } : m
      )
    );
  };

  const handleSave = () => {
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      onSaved(marks);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  if (!exam) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Entry"
      subtitle={`${exam.name} - Class ${exam.classId} ${exam.sectionId}`}
      size="large"
    >
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Total Marks:</strong> {exam.totalMarks} | <strong>Date:</strong>{" "}
          {new Date(exam.date).toLocaleDateString()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Marks Scored
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Moderated Marks
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {marks.map((mark) => (
              <tr key={mark.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {mark.studentName}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={mark.marksScored}
                    onChange={(e) =>
                      updateMark(mark.studentId, parseFloat(e.target.value) || 0)
                    }
                    className={`w-24 rounded-lg border ${
                      errors[mark.studentId]
                        ? "border-red-300"
                        : "border-gray-300"
                    } px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                    min="0"
                    max={exam.totalMarks}
                  />
                  {errors[mark.studentId] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[mark.studentId]}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={mark.moderatedMarks || ""}
                    onChange={(e) =>
                      updateModeratedMark(
                        mark.studentId,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={`w-24 rounded-lg border ${
                      errors[`mod-${mark.studentId}`]
                        ? "border-red-300"
                        : "border-gray-300"
                    } px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Optional"
                  />
                  {errors[`mod-${mark.studentId}`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`mod-${mark.studentId}`]}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={mark.remarks || ""}
                    onChange={(e) =>
                      setMarks((prev) =>
                        prev.map((m) =>
                          m.studentId === mark.studentId
                            ? { ...m, remarks: e.target.value }
                            : m
                        )
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Optional"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Moderation Rules:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Moderated marks cannot deviate more than ±10% from original marks</li>
              <li>All marks must be between 0 and {exam.totalMarks}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={submitting || Object.keys(errors).length > 0}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Marks
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   EXAM CARD COMPONENT
   ============================== */
const ExamCard = ({
  exam,
  onEdit,
  onDelete,
  onMarkEntry,
  onPublish,
}: {
  exam: Exam;
  onEdit: () => void;
  onDelete: () => void;
  onMarkEntry: () => void;
  onPublish: () => void;
}) => {
  const statusConfig = {
    draft: {
      bg: "bg-gradient-to-br from-gray-50 to-gray-100",
      badge: "bg-gray-100 text-gray-700 border-gray-300",
      icon: "bg-gray-100 text-gray-600",
      accent: "border-l-gray-400",
    },
    scheduled: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      badge: "bg-blue-100 text-blue-700 border-blue-300",
      icon: "bg-blue-100 text-blue-600",
      accent: "border-l-blue-500",
    },
    ongoing: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100",
      badge: "bg-amber-100 text-amber-700 border-amber-300",
      icon: "bg-amber-100 text-amber-600",
      accent: "border-l-amber-500",
    },
    completed: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      badge: "bg-green-100 text-green-700 border-green-300",
      icon: "bg-green-100 text-green-600",
      accent: "border-l-green-500",
    },
    published: {
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      badge: "bg-indigo-100 text-indigo-700 border-indigo-300",
      icon: "bg-indigo-100 text-indigo-600",
      accent: "border-l-indigo-500",
    },
  };

  const examTypeConfig = {
    periodic: { label: "Periodic Test", color: "text-purple-600", bg: "bg-purple-50" },
    term: { label: "Term Exam", color: "text-blue-600", bg: "bg-blue-50" },
    unit: { label: "Unit Test", color: "text-teal-600", bg: "bg-teal-50" },
    skill: { label: "Skill Assessment", color: "text-orange-600", bg: "bg-orange-50" },
  };

  const config = statusConfig[exam.status];
  const typeConfig = examTypeConfig[exam.examType];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-300">
      {/* Accent Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />
      
      {/* Header Section with Gradient Background */}
      <div className={`${config.bg} px-6 py-5 border-b border-gray-200/50`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
              {exam.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.color}`}>
                <AcademicCapIcon className="h-3.5 w-3.5" />
                {typeConfig.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-700 border border-gray-300">
                Class {exam.classId} - {exam.sectionId}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${config.badge} whitespace-nowrap`}
          >
            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-5">
        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
            <CalendarDaysIcon className="h-5 w-5 text-indigo-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-500 mb-0.5">Date</p>
            <p className="text-sm font-bold text-gray-900">
              {new Date(exam.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
            <ChartBarIcon className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-500 mb-0.5">Total Marks</p>
            <p className="text-sm font-bold text-gray-900">{exam.totalMarks}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
            <DocumentTextIcon className="h-5 w-5 text-purple-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-500 mb-0.5">Chapters</p>
            <p className="text-sm font-bold text-gray-900">{exam.syllabus.length}</p>
          </div>
        </div>

        {/* Syllabus Section */}
        {exam.syllabus.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-1 w-1 rounded-full bg-indigo-600" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Syllabus Coverage
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {exam.syllabus.slice(0, 4).map((chapter, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700"
                >
                  {chapter}
                </span>
              ))}
              {exam.syllabus.length > 4 && (
                <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-xs font-medium text-gray-600">
                  +{exam.syllabus.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          {exam.status !== "published" ? (
            <>
              <button
                onClick={onMarkEntry}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Enter Marks
              </button>
              <button
                onClick={onPublish}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <EyeIcon className="h-4 w-4" />
                Publish
              </button>
            </>
          ) : (
            <div className="flex-1 px-4 py-2.5 text-sm font-semibold text-green-700 bg-green-50 border-2 border-green-200 rounded-xl inline-flex items-center justify-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              Results Published
            </div>
          )}
          
          {/* Edit & Delete Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              title="Edit Exam"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Delete Exam"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-2xl" />
    </div>
  );
};

/* ==============================
   MAIN COMPONENT
   ============================== */
const ExamsAssessments: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ExamType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkEntryModal, setShowMarkEntryModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExamForMarks, setSelectedExamForMarks] = useState<Exam | null>(
    null
  );

  // Sample data
  useEffect(() => {
    setExams([
      {
        id: "1",
        name: "Mid-Term Mathematics Exam",
        examType: "term",
        classId: "10",
        sectionId: "A",
        totalMarks: 100,
        date: "2025-12-15",
        syllabus: ["Algebra", "Geometry", "Trigonometry"],
        status: "scheduled",
        createdAt: "2025-11-01",
      },
      {
        id: "2",
        name: "Physics Unit Test",
        examType: "unit",
        classId: "11",
        sectionId: "B",
        totalMarks: 50,
        date: "2025-12-10",
        syllabus: ["Mechanics", "Thermodynamics"],
        status: "completed",
        createdAt: "2025-11-05",
      },
    ]);
  }, []);

  // Filtered exams
  const filteredExams = useMemo(() => {
    let result = exams;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (exam) =>
          exam.name.toLowerCase().includes(q) ||
          exam.classId.includes(q) ||
          exam.sectionId.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      result = result.filter((exam) => exam.examType === filterType);
    }

    if (filterStatus !== "all") {
      result = result.filter((exam) => exam.status === filterStatus);
    }

    return result;
  }, [exams, searchQuery, filterType, filterStatus]);

  // Handlers
  const handleCreateExam = (exam: Exam) => {
    if (editingExam) {
      setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
      setEditingExam(null);
    } else {
      setExams((prev) => [...prev, exam]);
    }
    setShowCreateModal(false);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setShowCreateModal(true);
  };

  const handleDeleteExam = (id: string) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      setExams((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleMarkEntry = (exam: Exam) => {
    setSelectedExamForMarks(exam);
    setShowMarkEntryModal(true);
  };

  const handleSaveMarks = (marks: Mark[]) => {
    console.log("Marks saved:", marks);
    // In real app, save to backend
  };

  const handlePublishExam = (exam: Exam) => {
    if (
      window.confirm(
        "Are you sure you want to publish this exam? Students will be able to view their results."
      )
    ) {
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, status: "published" } : e))
      );
    }
  };

  // Stats
  const stats = {
    total: exams.length,
    scheduled: exams.filter((e) => e.status === "scheduled").length,
    completed: exams.filter((e) => e.status === "completed").length,
    published: exams.filter((e) => e.status === "published").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
              <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Exams & Assessments
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and publish examination results
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingExam(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Exam
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Exams"
          value={stats.total}
          icon={DocumentTextIcon}
          color="indigo"
        />
        <StatsCard
          label="Scheduled"
          value={stats.scheduled}
          icon={CalendarDaysIcon}
          color="blue"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          label="Published"
          value={stats.published}
          icon={EyeIcon}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search exams..."
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ExamType | "all")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="periodic">Periodic Tests</option>
              <option value="term">Term Exams</option>
              <option value="unit">Unit Tests</option>
              <option value="skill">Skill Assessments</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No exams found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first exam"}
          </p>
          {!searchQuery && filterType === "all" && filterStatus === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Create First Exam
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={() => handleEditExam(exam)}
              onDelete={() => handleDeleteExam(exam.id)}
              onMarkEntry={() => handleMarkEntry(exam)}
              onPublish={() => handlePublishExam(exam)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingExam(null);
        }}
        onCreated={handleCreateExam}
        editExam={editingExam}
      />

      <MarkEntryModal
        isOpen={showMarkEntryModal}
        onClose={() => {
          setShowMarkEntryModal(false);
          setSelectedExamForMarks(null);
        }}
        exam={selectedExamForMarks}
        onSaved={handleSaveMarks}
      />
    </div>
  );
};

export default ExamsAssessments;
