/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  TrashIcon,
  Cog6ToothIcon,
  PlayIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

/* ==============================
   TYPES & INTERFACES
   ============================== */
type AssessmentType = "periodic_test" | "term_exam" | "skill_assessment" | "practical_exam";
type ExamStatus = "draft" | "scheduled" | "ongoing" | "marks_pending" | "moderation" | "published";
type WorkflowStage = "creation" | "timetable" | "invigilation" | "marks" | "moderation" | "publishing";

interface Subject {
  id: string;
  name: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
}

interface TimetableEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
}

interface InvigilationDuty {
  id: string;
  timetableEntryId: string;
  teacherId: string;
  teacherName: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marks: number | null;
  isAbsent: boolean;
  isExempt: boolean;
  remarks?: string;
  originalMarks?: number | null; // For moderation tracking
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
}

interface SubjectMarks {
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  studentMarks: StudentMark[];
  submittedBy?: string;
  submittedAt?: string;
}

interface Exam {
  id: string;
  name: string;
  type: AssessmentType;
  grade: string;
  section?: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  subjects: Subject[];
  timetable: TimetableEntry[];
  invigilation: InvigilationDuty[];
  marks: SubjectMarks[];
  status: ExamStatus;
  instructions?: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  isModerated?: boolean;
}

/* ==============================
   CONSTANTS
   ============================== */
const ASSESSMENT_TYPES = [
  { value: "periodic_test" as const, label: "Periodic Test", color: "blue" },
  { value: "term_exam" as const, label: "Term Exam", color: "purple" },
  { value: "skill_assessment" as const, label: "Skill Assessment", color: "green" },
  { value: "practical_exam" as const, label: "Practical Exam", color: "amber" },
];

const EXAM_STATUSES = [
  { value: "draft" as const, label: "Draft", color: "gray" },
  { value: "scheduled" as const, label: "Scheduled", color: "blue" },
  { value: "ongoing" as const, label: "Ongoing", color: "amber" },
  { value: "marks_pending" as const, label: "Marks Pending", color: "orange" },
  { value: "moderation" as const, label: "Under Moderation", color: "purple" },
  { value: "published" as const, label: "Published", color: "green" },
];

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const SUBJECTS_MASTER = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", 
  "Hindi", "Social Studies", "Computer Science", "Economics", 
  "Physical Education", "Art", "Music"
];

const TEACHERS = [
  { id: "t1", name: "Dr. Sharma" },
  { id: "t2", name: "Mrs. Gupta" },
  { id: "t3", name: "Mr. Patel" },
  { id: "t4", name: "Ms. Singh" },
  { id: "t5", name: "Mr. Kumar" },
  { id: "t6", name: "Mrs. Reddy" },
];

const ROOMS = ["Room 101", "Room 102", "Room 103", "Room 201", "Room 202", "Lab 1", "Lab 2", "Hall A", "Hall B"];

// Sample students
const SAMPLE_STUDENTS: StudentMark[] = [
  { studentId: "s1", studentName: "Rahul Sharma", rollNumber: "001", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s2", studentName: "Priya Patel", rollNumber: "002", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s3", studentName: "Amit Kumar", rollNumber: "003", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s4", studentName: "Sneha Gupta", rollNumber: "004", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s5", studentName: "Vikram Singh", rollNumber: "005", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s6", studentName: "Ananya Reddy", rollNumber: "006", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s7", studentName: "Karthik Nair", rollNumber: "007", marks: null, isAbsent: false, isExempt: false },
  { studentId: "s8", studentName: "Meera Iyer", rollNumber: "008", marks: null, isAbsent: false, isExempt: false },
];

/* ==============================
   HELPER COMPONENTS
   ============================== */
const StatsCard = ({ label, value, icon: Icon, color = "blue", subtitle }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: ExamStatus }) => {
  const statusConfig = EXAM_STATUSES.find(s => s.value === status);
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[statusConfig?.color || "gray"]}`}>
      {statusConfig?.label || status}
    </span>
  );
};

const TypeBadge = ({ type }: { type: AssessmentType }) => {
  const typeConfig = ASSESSMENT_TYPES.find(t => t.value === type);
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[typeConfig?.color || "blue"]}`}>
      {typeConfig?.label || type}
    </span>
  );
};

const ModalWrapper = ({ title, subtitle, children, isOpen, onClose, size = "2xl" }: any) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    lg: "max-w-lg",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col`}>
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};


/* ==============================
   WORKFLOW STEPPER - Shows clear progression
   ============================== */
const WorkflowStepper = ({ exam, onStepClick }: { exam: Exam; onStepClick: (step: WorkflowStage) => void }) => {
  const steps = [
    { key: "creation" as WorkflowStage, label: "Exam Setup", icon: DocumentCheckIcon, description: "Basic details & subjects" },
    { key: "timetable" as WorkflowStage, label: "Timetable", icon: CalendarIcon, description: "Schedule exam sessions" },
    { key: "invigilation" as WorkflowStage, label: "Invigilation", icon: UserGroupIcon, description: "Assign teachers" },
    { key: "marks" as WorkflowStage, label: "Marks Entry", icon: ClipboardDocumentListIcon, description: "Enter student marks" },
    { key: "moderation" as WorkflowStage, label: "Moderation", icon: ShieldCheckIcon, description: "Review & approve" },
    { key: "publishing" as WorkflowStage, label: "Publish", icon: BellAlertIcon, description: "Release results" },
  ];

  const getStepStatus = (stepKey: WorkflowStage) => {
    if (stepKey === "creation") return "completed";
    if (stepKey === "timetable") return exam.timetable.length > 0 ? "completed" : "current";
    if (stepKey === "invigilation") return exam.invigilation.length > 0 ? "completed" : exam.timetable.length > 0 ? "current" : "locked";
    if (stepKey === "marks") return exam.marks.length === exam.subjects.length ? "completed" : exam.timetable.length > 0 ? "current" : "locked";
    if (stepKey === "moderation") return exam.marks.length === exam.subjects.length ? "current" : "locked";
    if (stepKey === "publishing") return exam.status === "published" ? "completed" : exam.marks.length === exam.subjects.length ? "current" : "locked";
    return "locked";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Exam Workflow Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;
          const isClickable = status !== "locked";

          return (
            <button
              key={step.key}
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${status === "completed" ? "bg-green-50 border-green-500 hover:bg-green-100" : ""}
                ${status === "current" ? "bg-indigo-50 border-indigo-500 hover:bg-indigo-100" : ""}
                ${status === "locked" ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed" : ""}
                ${isClickable ? "cursor-pointer" : ""}
              `}
            >
              {status === "completed" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-2
                ${status === "completed" ? "bg-green-100" : ""}
                ${status === "current" ? "bg-indigo-100" : ""}
                ${status === "locked" ? "bg-gray-100" : ""}
              `}>
                <Icon className={`h-5 w-5 ${
                  status === "completed" ? "text-green-600" : 
                  status === "current" ? "text-indigo-600" : 
                  "text-gray-400"
                }`} />
              </div>
              <p className={`text-sm font-semibold mb-1 ${
                status === "completed" ? "text-green-900" : 
                status === "current" ? "text-indigo-900" : 
                "text-gray-500"
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ==============================
   EXAM CARD - Improved with clear CTAs
   ============================== */
const ExamCard = ({ exam, onManage }: { exam: Exam; onManage: () => void }) => {
  const getNextAction = () => {
    if (exam.status === "published") return { label: "View Results", color: "green", icon: EyeIcon };
    if (exam.marks.length === exam.subjects.length) return { label: "Publish Results", color: "green", icon: BellAlertIcon };
    if (exam.timetable.length > 0 && exam.marks.length < exam.subjects.length) return { label: "Enter Marks", color: "indigo", icon: ClipboardDocumentListIcon };
    if (exam.timetable.length === 0) return { label: "Create Timetable", color: "blue", icon: CalendarIcon };
    return { label: "Continue Setup", color: "gray", icon: Cog6ToothIcon };
  };

  const nextAction = getNextAction();
  const progress = Math.round(((exam.timetable.length > 0 ? 1 : 0) + (exam.invigilation.length > 0 ? 1 : 0) + (exam.marks.length / exam.subjects.length)) / 3 * 100);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TypeBadge type={exam.type} />
            <StatusBadge status={exam.status} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.name}</h3>
          <p className="text-sm text-gray-500">
            Class {exam.grade}{exam.section ? `-${exam.section}` : ""} • {exam.subjects.length} Subjects
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Exam Date</span>
          <span className="font-medium text-gray-900">{new Date(exam.startDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button
        onClick={onManage}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors bg-${nextAction.color}-600 hover:bg-${nextAction.color}-700`}
        style={{ 
          backgroundColor: nextAction.color === "green" ? "#16a34a" : nextAction.color === "indigo" ? "#4f46e5" : nextAction.color === "blue" ? "#2563eb" : "#6b7280"
        }}
      >
        <nextAction.icon className="h-5 w-5" />
        {nextAction.label}
      </button>
    </div>
  );
};


/* ==============================
   STEP 1: CREATE EXAM FORM
   ============================== */
const CreateExamForm = ({ onSave, onCancel, editExam }: any) => {
  const [formData, setFormData] = useState({
    name: editExam?.name || "",
    type: editExam?.type || "periodic_test" as AssessmentType,
    grade: editExam?.grade || "",
    section: editExam?.section || "",
    academicYear: editExam?.academicYear || "2024-2025",
    startDate: editExam?.startDate || "",
    endDate: editExam?.endDate || "",
    instructions: editExam?.instructions || "",
  });

  const [subjects, setSubjects] = useState<Subject[]>(editExam?.subjects || []);
  const [newSubject, setNewSubject] = useState({ name: "", totalMarks: 100, passingMarks: 35, duration: 180 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddSubject = () => {
    if (!newSubject.name) {
      setErrors({ ...errors, subject: "Please select a subject" });
      return;
    }
    if (subjects.some(s => s.name === newSubject.name)) {
      setErrors({ ...errors, subject: "Subject already added" });
      return;
    }

    setSubjects([...subjects, { id: Date.now().toString(), ...newSubject }]);
    setNewSubject({ name: "", totalMarks: 100, passingMarks: 35, duration: 180 });
    setErrors({ ...errors, subject: "" });
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Exam name is required";
    if (!formData.grade) newErrors.grade = "Grade is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (subjects.length === 0) newErrors.subjects = "At least one subject is required";
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "End date must be after start date";
      }
    }
    
    // Subject validation
    subjects.forEach(subject => {
      if (subject.passingMarks > subject.totalMarks) {
        newErrors.subjects = "Passing marks cannot exceed total marks";
      }
      if (subject.duration < 30 || subject.duration > 300) {
        newErrors.subjects = "Duration must be between 30 and 300 minutes";
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
      status: editExam?.status || "draft",
      createdBy: "Admin",
      createdAt: editExam?.createdAt || new Date().toISOString(),
      timetable: editExam?.timetable || [],
      invigilation: editExam?.invigilation || [],
      marks: editExam?.marks || [],
    });
  };

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
                {Object.values(errors).map((error, i) => <li key={i}>{error}</li>)}
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
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AssessmentType })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {ASSESSMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <select
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select Grade</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>Class {grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
          <select
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Sections</option>
            {SECTIONS.map(section => (
              <option key={section} value={section}>Section {section}</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (Optional)</label>
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
                {SUBJECTS_MASTER.filter(s => !subjects.some(sub => sub.name === s)).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
              <input
                type="number"
                value={newSubject.totalMarks}
                onChange={(e) => setNewSubject({ ...newSubject, totalMarks: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passing Marks</label>
              <input
                type="number"
                value={newSubject.passingMarks}
                onChange={(e) => setNewSubject({ ...newSubject, passingMarks: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
              <input
                type="number"
                value={newSubject.duration}
                onChange={(e) => setNewSubject({ ...newSubject, duration: parseInt(e.target.value) || 0 })}
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
              <div key={subject.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                    <p className="text-xs text-gray-500">
                      {subject.totalMarks} marks • Pass: {subject.passingMarks} • {subject.duration} min
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjects(subjects.filter(s => s.id !== subject.id))}
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
          {editExam ? "Update Exam" : "Create Exam"}
        </button>
      </div>
    </div>
  );
};


/* ==============================
   EXAM WORKFLOW MANAGER - Single interface for all stages
   ============================== */
const ExamWorkflowManager = ({ exam, onUpdate, onClose }: { exam: Exam; onUpdate: (exam: Exam) => void; onClose: () => void }) => {
  const [activeStep, setActiveStep] = useState<WorkflowStage>("timetable");
  const [localExam, setLocalExam] = useState(exam);

  // Timetable state
  const [ttEntry, setTtEntry] = useState({ subjectId: "", date: "", startTime: "", endTime: "", room: "" });
  
  // Invigilation state
  const [invEntry, setInvEntry] = useState({ timetableEntryId: "", teacherId: "", room: "" });
  
  // Marks state
  const [selectedSubject, setSelectedSubject] = useState(exam.subjects[0]?.id || "");
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  
  // Moderation state - moved to top level to avoid hooks in loops
  const [moderatingSubjectId, setModeratingSubjectId] = useState<string | null>(null);
  const [moderationData, setModerationData] = useState<StudentMark[]>([]);
  const [moderationReason, setModerationReason] = useState("");

  React.useEffect(() => {
    if (selectedSubject) {
      const existing = localExam.marks.find(m => m.subjectId === selectedSubject);
      setStudentMarks(existing?.studentMarks || SAMPLE_STUDENTS);
    }
  }, [selectedSubject, localExam]);

  const updateExam = (updates: Partial<Exam>) => {
    const updated = { ...localExam, ...updates };
    setLocalExam(updated);
    onUpdate(updated);
  };

  // Conflict detection state
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Check for conflicts
  const checkConflicts = (entry: typeof ttEntry) => {
    const conflictList: string[] = [];
    
    localExam.timetable.forEach(existing => {
      // Check if same date and overlapping time
      if (existing.date === entry.date) {
        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;
        const newStart = entry.startTime;
        const newEnd = entry.endTime;
        
        // Check time overlap
        if ((newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)) {
          
          // Room conflict
          if (entry.room && existing.room === entry.room) {
            conflictList.push(`⚠️ Room conflict: ${entry.room} is already booked for ${existing.subjectName} at ${existingStart}-${existingEnd}`);
          }
          
          // Class conflict (same exam, same time)
          conflictList.push(`⚠️ Class conflict: Students already have ${existing.subjectName} exam at ${existingStart}-${existingEnd}`);
        }
      }
    });

    // Check teacher conflicts in invigilation
    localExam.invigilation.forEach(duty => {
      if (duty.date === entry.date) {
        const dutyStart = duty.startTime;
        const dutyEnd = duty.endTime;
        const newStart = entry.startTime;
        const newEnd = entry.endTime;
        
        if ((newStart >= dutyStart && newStart < dutyEnd) ||
            (newEnd > dutyStart && newEnd <= dutyEnd) ||
            (newStart <= dutyStart && newEnd >= dutyEnd)) {
          conflictList.push(`⚠️ Teacher conflict: ${duty.teacherName} is already assigned to another exam at ${dutyStart}-${dutyEnd}`);
        }
      }
    });

    return conflictList;
  };

  // Timetable handlers
  const addTimetable = () => {
    if (!ttEntry.subjectId || !ttEntry.date || !ttEntry.startTime || !ttEntry.endTime) {
      return;
    }

    // Check for conflicts
    const detectedConflicts = checkConflicts(ttEntry);
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      // Still allow adding but show warning
    } else {
      setConflicts([]);
    }

    const subject = localExam.subjects.find(s => s.id === ttEntry.subjectId);
    const newEntry = {
      id: Date.now().toString(),
      subjectId: ttEntry.subjectId,
      subjectName: subject?.name || "",
      date: ttEntry.date,
      startTime: ttEntry.startTime,
      endTime: ttEntry.endTime,
      room: ttEntry.room,
    };
    updateExam({ timetable: [...localExam.timetable, newEntry] });
    setTtEntry({ subjectId: "", date: "", startTime: "", endTime: "", room: "" });
  };

  // Invigilation handlers
  const addInvigilation = () => {
    if (!invEntry.timetableEntryId || !invEntry.teacherId) {
      return;
    }
    
    const ttEntry = localExam.timetable.find(t => t.id === invEntry.timetableEntryId);
    const teacher = TEACHERS.find(t => t.id === invEntry.teacherId);
    
    // Check if teacher is already assigned to another exam at the same time
    const teacherConflict = localExam.invigilation.some(duty => 
      duty.teacherId === invEntry.teacherId && 
      duty.date === ttEntry?.date &&
      duty.id !== invEntry.timetableEntryId
    );
    
    if (teacherConflict) {
      alert(`⚠️ ${teacher?.name} is already assigned to another exam session on this date. Please choose a different teacher or time.`);
      return;
    }
    
    const newDuty = {
      id: Date.now().toString(),
      timetableEntryId: invEntry.timetableEntryId,
      teacherId: invEntry.teacherId,
      teacherName: teacher?.name || "",
      room: invEntry.room || ttEntry?.room || "",
      date: ttEntry?.date || "",
      startTime: ttEntry?.startTime || "",
      endTime: ttEntry?.endTime || "",
    };
    updateExam({ invigilation: [...localExam.invigilation, newDuty] });
    setInvEntry({ timetableEntryId: "", teacherId: "", room: "" });
  };

  // Marks handlers
  const saveMarks = () => {
    const subject = localExam.subjects.find(s => s.id === selectedSubject);
    const subjectMarks = {
      subjectId: selectedSubject,
      subjectName: subject?.name || "",
      totalMarks: subject?.totalMarks || 100,
      studentMarks,
      submittedBy: "Current Teacher",
      submittedAt: new Date().toISOString(),
    };
    const existingIndex = localExam.marks.findIndex(m => m.subjectId === selectedSubject);
    const updatedMarks = [...localExam.marks];
    if (existingIndex >= 0) {
      updatedMarks[existingIndex] = subjectMarks;
    } else {
      updatedMarks.push(subjectMarks);
    }
    updateExam({ marks: updatedMarks });
  };

  // Publish handler
  const [showPublishConfirm, setShowPublishConfirm] = React.useState(false);
  
  const publishResults = () => {
    if (localExam.marks.length < localExam.subjects.length || !localExam.isModerated) {
      return;
    }
    setShowPublishConfirm(true);
  };
  
  const confirmPublish = () => {
    updateExam({ status: "published", publishedAt: new Date().toISOString() });
    setShowPublishConfirm(false);
  };

  return (
    <ModalWrapper
      isOpen={true}
      onClose={onClose}
      title={localExam.name}
      subtitle="Manage exam workflow"
      size="full"
    >
      <div className="space-y-6">
        {/* Workflow Stepper */}
        <WorkflowStepper exam={localExam} onStepClick={setActiveStep} />

        {/* Content Area */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* EXAM SETUP / CREATION */}
          {activeStep === "creation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Exam Setup</h3>
                  <p className="text-sm text-gray-500 mt-1">View and edit exam details</p>
                </div>
              </div>

              {/* Exam Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Exam Name</label>
                    <p className="text-sm font-medium text-gray-900">{localExam.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Assessment Type</label>
                    <TypeBadge type={localExam.type} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Grade/Class</label>
                    <p className="text-sm font-medium text-gray-900">
                      Class {localExam.grade}{localExam.section ? ` - Section ${localExam.section}` : " (All Sections)"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
                    <p className="text-sm font-medium text-gray-900">{localExam.academicYear}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Exam Period</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(localExam.startDate).toLocaleDateString()} - {new Date(localExam.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <StatusBadge status={localExam.status} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Created By</label>
                    <p className="text-sm font-medium text-gray-900">{localExam.createdBy}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Created At</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(localExam.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {localExam.instructions && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Instructions</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{localExam.instructions}</p>
                  </div>
                </div>
              )}

              {/* Subjects List */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Subjects ({localExam.subjects.length})</label>
                <div className="space-y-2">
                  {localExam.subjects.map((subject, index) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                          <p className="text-xs text-gray-500">
                            Total: {subject.totalMarks} marks • Pass: {subject.passingMarks} marks • Duration: {subject.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setActiveStep("timetable")} 
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  Next: Create Timetable
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TIMETABLE */}
          {activeStep === "timetable" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Exam Timetable</h3>
                  <p className="text-sm text-gray-500 mt-1">Schedule exam sessions for each subject</p>
                </div>
                <span className="text-sm font-medium text-gray-600">{localExam.timetable.length} / {localExam.subjects.length} scheduled</span>
              </div>

              {/* Conflict Warnings */}
              {conflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-900 mb-2">Scheduling Conflicts Detected</h4>
                      <ul className="space-y-1">
                        {conflicts.map((conflict, idx) => (
                          <li key={idx} className="text-sm text-amber-800">{conflict}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-700 mt-2">Entry was added but please review and resolve conflicts.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Add Timetable Entry</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                    <select value={ttEntry.subjectId} onChange={(e) => setTtEntry({ ...ttEntry, subjectId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Select Subject</option>
                      {localExam.subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input type="date" value={ttEntry.date} onChange={(e) => setTtEntry({ ...ttEntry, date: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                    <input type="time" value={ttEntry.startTime} onChange={(e) => setTtEntry({ ...ttEntry, startTime: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
                    <input type="time" value={ttEntry.endTime} onChange={(e) => setTtEntry({ ...ttEntry, endTime: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                    <select value={ttEntry.room} onChange={(e) => setTtEntry({ ...ttEntry, room: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Select Room</option>
                      {ROOMS.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={addTimetable} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2">
                  <PlusCircleIcon className="h-4 w-4" />
                  Add Entry
                </button>
              </div>

              {localExam.timetable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {localExam.timetable.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.subjectName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.startTime} - {entry.endTime}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.room || "-"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => updateExam({ timetable: localExam.timetable.filter(t => t.id !== entry.id) })} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No timetable entries yet. Add entries above.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setActiveStep("invigilation")} disabled={localExam.timetable.length === 0} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2">
                  Next: Assign Invigilation
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* INVIGILATION */}
          {activeStep === "invigilation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Assign Invigilation Duties</h3>
                  <p className="text-sm text-gray-500 mt-1">Assign teachers to supervise exam sessions</p>
                </div>
                <span className="text-sm font-medium text-gray-600">{localExam.invigilation.length} duties assigned</span>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-medium text-purple-900 mb-3">Assign Invigilator</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Exam Session *</label>
                    <select value={invEntry.timetableEntryId} onChange={(e) => setInvEntry({ ...invEntry, timetableEntryId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Select Session</option>
                      {localExam.timetable.map(entry => (
                        <option key={entry.id} value={entry.id}>
                          {entry.subjectName} - {new Date(entry.date).toLocaleDateString()} ({entry.startTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Teacher *</label>
                    <select value={invEntry.teacherId} onChange={(e) => setInvEntry({ ...invEntry, teacherId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Select Teacher</option>
                      {TEACHERS.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Room Override</label>
                    <select value={invEntry.room} onChange={(e) => setInvEntry({ ...invEntry, room: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">Use Default</option>
                      {ROOMS.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={addInvigilation} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium inline-flex items-center gap-2">
                  <PlusCircleIcon className="h-4 w-4" />
                  Assign Duty
                </button>
              </div>

              {localExam.invigilation.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {localExam.invigilation.map(duty => (
                        <tr key={duty.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{duty.teacherName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(duty.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{duty.startTime} - {duty.endTime}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{duty.room}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => updateExam({ invigilation: localExam.invigilation.filter(i => i.id !== duty.id) })} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No invigilation duties assigned yet.</p>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setActiveStep("timetable")} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back
                </button>
                <button onClick={() => setActiveStep("marks")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2">
                  Next: Enter Marks
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* MARKS ENTRY */}
          {activeStep === "marks" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Enter Student Marks</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter marks for each subject</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Bulk upload handler
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.xlsx,.xls';
                      input.onchange = (e: any) => {
                        const file = e.target?.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const text = event.target?.result as string;
                              const lines = text.split('\n').filter(line => line.trim());
                              
                              // Skip header row
                              const dataLines = lines.slice(1);
                              
                              const uploadedMarks: StudentMark[] = [];
                              let successCount = 0;
                              let errorCount = 0;
                              
                              dataLines.forEach(line => {
                                const [rollNumber, , marks, absent] = line.split(',').map(s => s.trim());
                                
                                // Find existing student by roll number
                                const existingStudent = studentMarks.find(s => s.rollNumber === rollNumber);
                                
                                if (existingStudent) {
                                  const isAbsent = absent?.toLowerCase() === 'yes' || absent?.toLowerCase() === 'true';
                                  const parsedMarks = isAbsent ? null : (marks ? parseInt(marks) : null);
                                  
                                  uploadedMarks.push({
                                    ...existingStudent,
                                    marks: parsedMarks,
                                    isAbsent: isAbsent
                                  });
                                  successCount++;
                                } else {
                                  errorCount++;
                                }
                              });
                              
                              if (uploadedMarks.length > 0) {
                                // Merge uploaded marks with existing student marks
                                const updatedMarks = studentMarks.map(student => {
                                  const uploaded = uploadedMarks.find(u => u.studentId === student.studentId);
                                  return uploaded || student;
                                });
                                
                                setStudentMarks(updatedMarks);
                                alert(`✅ Bulk upload successful!\n\n${successCount} records imported\n${errorCount} records skipped (student not found)`);
                              } else {
                                alert('❌ No valid records found in the file. Please check the format.');
                              }
                            } catch (error) {
                              alert('❌ Error processing file. Please ensure it\'s a valid CSV file with the correct format.');
                              console.error('Bulk upload error:', error);
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium inline-flex items-center gap-2"
                    title="Upload marks via Excel/CSV"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    Bulk Upload
                  </button>
                  <button
                    onClick={() => {
                      // Generate CSV template with current students
                      const subject = localExam.subjects.find(s => s.id === selectedSubject);
                      const csvContent = [
                        ['Roll Number', 'Student Name', 'Marks', 'Absent (Yes/No)'].join(','),
                        ...studentMarks.map(student => 
                          [student.rollNumber, student.studentName, '', 'No'].join(',')
                        )
                      ].join('\n');
                      
                      // Create blob and download
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      
                      link.setAttribute('href', url);
                      link.setAttribute('download', `marks_template_${subject?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium inline-flex items-center gap-2"
                    title="Download template"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Template
                  </button>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {localExam.subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                  <span className="text-sm font-medium text-gray-600">{localExam.marks.length} / {localExam.subjects.length} completed</span>
                </div>
              </div>

              {selectedSubject && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        {localExam.subjects.find(s => s.id === selectedSubject)?.name}
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Total Marks: {localExam.subjects.find(s => s.id === selectedSubject)?.totalMarks} | 
                        Passing: {localExam.subjects.find(s => s.id === selectedSubject)?.passingMarks}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-700">
                        {studentMarks.filter(s => s.marks !== null || s.isAbsent).length} / {studentMarks.length} entered
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Marks</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Absent</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentMarks.map(student => {
                      const maxMarks = localExam.subjects.find(s => s.id === selectedSubject)?.totalMarks || 100;
                      const passingMarks = localExam.subjects.find(s => s.id === selectedSubject)?.passingMarks || 35;
                      const isPassing = student.marks !== null && student.marks >= passingMarks;
                      
                      return (
                        <tr key={student.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.rollNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{student.studentName}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={student.marks ?? ""}
                              onChange={(e) => setStudentMarks(prev => prev.map(s => s.studentId === student.studentId ? { ...s, marks: e.target.value ? parseInt(e.target.value) : null } : s))}
                              disabled={student.isAbsent}
                              min="0"
                              max={maxMarks}
                              className={`w-20 mx-auto block rounded-lg border px-3 py-1.5 text-sm text-center ${student.isAbsent ? "bg-gray-100 text-gray-400" : "border-gray-300"}`}
                              placeholder="-"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={student.isAbsent}
                              onChange={() => setStudentMarks(prev => prev.map(s => s.studentId === student.studentId ? { ...s, isAbsent: !s.isAbsent, marks: !s.isAbsent ? null : s.marks } : s))}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {student.isAbsent ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Absent</span>
                            ) : student.marks !== null ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPassing ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {isPassing ? "Pass" : "Fail"}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setActiveStep("invigilation")} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back
                </button>
                <div className="flex gap-3">
                  <button onClick={saveMarks} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    Save Marks
                  </button>
                  <button onClick={() => setActiveStep("moderation")} disabled={localExam.marks.length < localExam.subjects.length} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2">
                    Next: Moderation
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODERATION */}
          {activeStep === "moderation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Marks Moderation & Review</h3>
                  <p className="text-sm text-gray-500 mt-1">Review and adjust marks within ±10% with justification</p>
                </div>
                <StatusBadge status={localExam.status} />
              </div>

              {/* ±10% Rule Info Banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 mb-1">Moderation Guidelines (±10% Rule)</h4>
                    <p className="text-sm text-purple-700">
                      Moderators can adjust marks within ±10% of original marks. Adjustments require justification. 
                      Changes beyond ±10% require special approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Moderation Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Subjects Completed</p>
                      <p className="text-2xl font-bold text-green-700">{localExam.marks.length} / {localExam.subjects.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <ExclamationCircleIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Pending Review</p>
                      <p className="text-2xl font-bold text-amber-700">{localExam.subjects.length - localExam.marks.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Moderation Status</p>
                      <p className="text-lg font-bold text-purple-700">
                        {localExam.isModerated ? "Approved" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject-wise Moderation */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Subject-wise Moderation</h4>
                {localExam.subjects.map(subject => {
                  const subjectMarks = localExam.marks.find(m => m.subjectId === subject.id);
                  const isComplete = !!subjectMarks;
                  const isModeratingSubject = moderatingSubjectId === subject.id;
                  
                  const startModeration = () => {
                    if (subjectMarks) {
                      setModerationData(subjectMarks.studentMarks.map(s => ({
                        ...s,
                        originalMarks: s.originalMarks || s.marks
                      })));
                      setModeratingSubjectId(subject.id);
                      setModerationReason("");
                    }
                  };
                  
                  const saveModeration = () => {
                    if (!moderationReason.trim()) {
                      alert("Please provide a justification for mark changes");
                      return;
                    }
                    
                    // Check ±10% rule
                    const violations = moderationData.filter(student => {
                      if (student.isAbsent || student.originalMarks === null || student.originalMarks === undefined || student.marks === null) return false;
                      const diff = Math.abs(student.marks - student.originalMarks);
                      const tenPercent = student.originalMarks * 0.1;
                      return diff > tenPercent;
                    });
                    
                    if (violations.length > 0) {
                      const proceed = confirm(
                        `⚠️ ${violations.length} student(s) have mark changes exceeding ±10%.\n\n` +
                        `This requires special approval. Do you want to proceed?`
                      );
                      if (!proceed) return;
                    }
                    
                    // Update marks with moderation info
                    const updatedMarks = moderationData.map(s => ({
                      ...s,
                      moderatedBy: "Moderator",
                      moderatedAt: new Date().toISOString(),
                      moderationReason: moderationReason
                    }));
                    
                    const existingIndex = localExam.marks.findIndex(m => m.subjectId === subject.id);
                    const allMarks = [...localExam.marks];
                    if (existingIndex >= 0) {
                      allMarks[existingIndex] = {
                        ...allMarks[existingIndex],
                        studentMarks: updatedMarks
                      };
                    }
                    
                    updateExam({ marks: allMarks });
                    setModeratingSubjectId(null);
                    setModerationReason("");
                    setModerationData([]);
                  };
                  
                  return (
                    <div key={subject.id} className={`p-4 rounded-lg border ${isComplete ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                      {!isModeratingSubject ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isComplete ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              ) : (
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                                <p className="text-xs text-gray-500">
                                  {isComplete 
                                    ? `Submitted by ${subjectMarks?.submittedBy} on ${new Date(subjectMarks?.submittedAt || "").toLocaleDateString()}`
                                    : "Marks not yet submitted"
                                  }
                                </p>
                              </div>
                            </div>
                            {isComplete && (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  {subjectMarks?.studentMarks.filter(s => s.marks !== null || s.isAbsent).length} / {subjectMarks?.studentMarks.length} students
                                </span>
                                <button 
                                  onClick={startModeration}
                                  className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 inline-flex items-center gap-1"
                                >
                                  <ShieldCheckIcon className="h-4 w-4" />
                                  Moderate
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Show statistics if complete */}
                          {isComplete && subjectMarks && (
                            <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-4 gap-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Total Students</p>
                                <p className="text-lg font-bold text-gray-900">{subjectMarks.studentMarks.length}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Present</p>
                                <p className="text-lg font-bold text-green-600">
                                  {subjectMarks.studentMarks.filter(s => !s.isAbsent).length}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Absent</p>
                                <p className="text-lg font-bold text-red-600">
                                  {subjectMarks.studentMarks.filter(s => s.isAbsent).length}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Pass Rate</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {subjectMarks.studentMarks.filter(s => !s.isAbsent).length > 0
                                    ? Math.round((subjectMarks.studentMarks.filter(s => s.marks !== null && s.marks >= subject.passingMarks).length / subjectMarks.studentMarks.filter(s => !s.isAbsent).length) * 100)
                                    : 0}%
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900">Moderating: {subject.name}</h5>
                            <button 
                              onClick={() => {
                                setModeratingSubjectId(null);
                                setModerationData([]);
                                setModerationReason("");
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                          
                          {/* Moderation Table */}
                          <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Roll No</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Student</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Original</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Moderated</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">±10% Range</th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {moderationData.map((student, idx) => {
                                  const original = student.originalMarks ?? student.marks ?? 0;
                                  const tenPercentLower = Math.max(0, Math.floor(original - (original * 0.1)));
                                  const tenPercentUpper = Math.min(subject.totalMarks, Math.ceil(original + (original * 0.1)));
                                  const isWithinRange = student.marks !== null && student.marks >= tenPercentLower && student.marks <= tenPercentUpper;
                                  const hasChanged = student.marks !== student.originalMarks;
                                  
                                  return (
                                    <tr key={student.studentId} className={hasChanged ? "bg-yellow-50" : ""}>
                                      <td className="px-3 py-2 text-xs font-medium">{student.rollNumber}</td>
                                      <td className="px-3 py-2 text-xs">{student.studentName}</td>
                                      <td className="px-3 py-2 text-center text-xs font-medium">{student.isAbsent ? "Absent" : student.originalMarks}</td>
                                      <td className="px-3 py-2 text-center">
                                        <input
                                          type="number"
                                          value={student.marks ?? ""}
                                          onChange={(e) => {
                                            const newMarks = e.target.value ? parseInt(e.target.value) : null;
                                            setModerationData(prev => prev.map((s, i) => 
                                              i === idx ? { ...s, marks: newMarks } : s
                                            ));
                                          }}
                                          disabled={student.isAbsent}
                                          min="0"
                                          max={subject.totalMarks}
                                          className={`w-16 rounded border px-2 py-1 text-xs text-center ${
                                            student.isAbsent ? "bg-gray-100" : 
                                            !isWithinRange && hasChanged ? "border-red-500 bg-red-50" : 
                                            hasChanged ? "border-yellow-500 bg-yellow-50" : "border-gray-300"
                                          }`}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-center text-xs text-gray-600">
                                        {student.isAbsent ? "-" : `${tenPercentLower}-${tenPercentUpper}`}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {student.isAbsent ? (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Absent</span>
                                        ) : hasChanged ? (
                                          isWithinRange ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">✓ Valid</span>
                                          ) : (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">! Exceeds ±10%</span>
                                          )
                                        ) : (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">No change</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Justification */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Justification for Changes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={moderationReason}
                              onChange={(e) => setModerationReason(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                              placeholder="Explain the reason for mark adjustments..."
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setModeratingSubjectId(null);
                                setModerationData([]);
                                setModerationReason("");
                              }}
                              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveModeration}
                              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
                            >
                              <CheckIcon className="h-4 w-4" />
                              Save Moderation
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Approve Moderation */}
              {localExam.marks.length === localExam.subjects.length && !localExam.isModerated && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-indigo-900 mb-1">Ready for Final Approval</h4>
                      <p className="text-sm text-indigo-700 mb-3">
                        All subjects have been reviewed. Click below to approve moderation and proceed to publishing.
                      </p>
                      <button
                        onClick={() => updateExam({ isModerated: true, moderatedBy: "Moderator", moderatedAt: new Date().toISOString() })}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve Moderation
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {localExam.isModerated && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900 mb-1">Moderation Approved</h4>
                      <p className="text-sm text-green-700">
                        Moderated by {localExam.moderatedBy} on {new Date(localExam.moderatedAt || "").toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setActiveStep("marks")} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Marks
                </button>
                <button 
                  onClick={() => setActiveStep("publishing")} 
                  disabled={!localExam.isModerated}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  Next: Publish Results
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* PUBLISHING */}
          {activeStep === "publishing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Publish Results</h3>
                  <p className="text-sm text-gray-500 mt-1">Review and publish exam results</p>
                </div>
                <StatusBadge status={localExam.status} />
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Pre-publish Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {localExam.timetable.length > 0 ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
                    <span className="text-sm text-gray-700">Timetable created ({localExam.timetable.length} entries)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {localExam.invigilation.length > 0 ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />}
                    <span className="text-sm text-gray-700">Invigilation assigned ({localExam.invigilation.length} duties) - Optional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {localExam.marks.length === localExam.subjects.length ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
                    <span className="text-sm text-gray-700">All marks entered ({localExam.marks.length}/{localExam.subjects.length} subjects)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button onClick={() => setActiveStep("moderation")} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Moderation
                </button>
                <button
                  onClick={publishResults}
                  disabled={!localExam.isModerated || localExam.status === "published"}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <BellAlertIcon className="h-4 w-4" />
                  {localExam.status === "published" ? "Published" : "Publish Results"}
                </button>
              </div>
              
              {/* Publish Confirmation Modal */}
              {showPublishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-amber-100 rounded-full">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Publish Exam Results?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          This action is <strong>irreversible</strong>. Once published, results will be visible to students and parents, and marks cannot be modified.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-xs font-medium text-gray-700 mb-2">Publishing will:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>✓ Make results visible to students and parents</li>
                            <li>✓ Lock all marks (no further edits)</li>
                            <li>✓ Generate result cards and reports</li>
                            <li>✓ Send notifications to stakeholders</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPublishConfirm(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmPublish}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Confirm & Publish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};


/* ==============================
   MAIN COMPONENT
   ============================== */
const ExamsAssessments: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([
    {
      id: "1",
      name: "Mid-Term Examination 2024",
      type: "term_exam",
      grade: "10",
      section: "A",
      academicYear: "2024-2025",
      startDate: "2024-12-15",
      endDate: "2024-12-22",
      subjects: [
        { id: "s1", name: "Mathematics", totalMarks: 100, passingMarks: 35, duration: 180 },
        { id: "s2", name: "Physics", totalMarks: 100, passingMarks: 35, duration: 180 },
        { id: "s3", name: "Chemistry", totalMarks: 100, passingMarks: 35, duration: 180 },
      ],
      timetable: [
        { id: "t1", subjectId: "s1", subjectName: "Mathematics", date: "2024-12-15", startTime: "09:00", endTime: "12:00", room: "Hall A" },
      ],
      invigilation: [],
      marks: [],
      status: "draft",
      instructions: "Students must bring their own stationery.",
      createdBy: "Admin",
      createdAt: "2024-11-01T10:00:00Z",
    },
    {
      id: "2",
      name: "Unit Test 3 - Science",
      type: "periodic_test",
      grade: "9",
      academicYear: "2024-2025",
      startDate: "2024-12-10",
      endDate: "2024-12-10",
      subjects: [
        { id: "s5", name: "Physics", totalMarks: 50, passingMarks: 18, duration: 90 },
        { id: "s6", name: "Chemistry", totalMarks: 50, passingMarks: 18, duration: 90 },
      ],
      timetable: [],
      invigilation: [],
      marks: [],
      status: "draft",
      createdBy: "Admin",
      createdAt: "2024-11-15T10:00:00Z",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssessmentType | "">("");
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "">("");
  const [gradeFilter, setGradeFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [managingExam, setManagingExam] = useState<Exam | null>(null);
  const [activeView, setActiveView] = useState<"exams" | "reports">("exams");

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesSearch = searchQuery === "" || 
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.grade.includes(searchQuery);
      const matchesType = typeFilter === "" || exam.type === typeFilter;
      const matchesStatus = statusFilter === "" || exam.status === statusFilter;
      const matchesGrade = gradeFilter === "" || exam.grade === gradeFilter;
      
      return matchesSearch && matchesType && matchesStatus && matchesGrade;
    });
  }, [exams, searchQuery, typeFilter, statusFilter, gradeFilter]);

  const stats = useMemo(() => {
    return {
      total: exams.length,
      draft: exams.filter(e => e.status === "draft").length,
      scheduled: exams.filter(e => e.status === "scheduled").length,
      ongoing: exams.filter(e => e.status === "ongoing").length,
      marksPending: exams.filter(e => e.status === "marks_pending").length,
      published: exams.filter(e => e.status === "published").length,
    };
  }, [exams]);

  const [dateOverlapWarning, setDateOverlapWarning] = useState<string | null>(null);

  const checkDateOverlap = (newExam: Partial<Exam>) => {
    const overlaps: string[] = [];
    
    exams.forEach(existing => {
      // Skip if editing the same exam
      if (editingExam && existing.id === editingExam.id) return;
      
      // Check if same grade/section
      if (existing.grade === newExam.grade && 
          (!newExam.section || !existing.section || existing.section === newExam.section)) {
        
        const existingStart = new Date(existing.startDate);
        const existingEnd = new Date(existing.endDate);
        const newStart = new Date(newExam.startDate!);
        const newEnd = new Date(newExam.endDate!);
        
        // Check date overlap
        if ((newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)) {
          overlaps.push(`${existing.name} (${existing.startDate} to ${existing.endDate})`);
        }
      }
    });
    
    return overlaps;
  };

  const handleSaveExam = (examData: Partial<Exam>) => {
    // Check for date overlaps
    const overlaps = checkDateOverlap(examData);
    if (overlaps.length > 0 && !editingExam) {
      setDateOverlapWarning(`⚠️ Date overlap detected with: ${overlaps.join(", ")}. Students may have conflicting exams.`);
      // Still allow saving but show warning
      setTimeout(() => setDateOverlapWarning(null), 5000);
    }

    if (editingExam) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, ...examData } as Exam : e));
    } else {
      setExams(prev => [...prev, examData as Exam]);
    }
    setEditingExam(null);
    setShowCreateModal(false);
  };

  const handleUpdateExam = (updatedExam: Exam) => {
    setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
    setManagingExam(updatedExam);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Date Overlap Warning */}
      {dateOverlapWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{dateOverlapWarning}</p>
            </div>
            <button onClick={() => setDateOverlapWarning(null)} className="text-amber-600 hover:text-amber-800">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Exams & Assessments
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Complete exam management from creation to result publishing
            </p>
          </div>
          {activeView === "exams" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Create Exam
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
        <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
          <button
            onClick={() => setActiveView("exams")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeView === "exams" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            Exams
          </button>
          <button
            onClick={() => setActiveView("reports")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeView === "reports" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            Reports & Analytics
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeView === "exams" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard label="Total Exams" value={stats.total} icon={ClipboardDocumentListIcon} color="blue" />
          <StatsCard label="Draft" value={stats.draft} icon={DocumentTextIcon} color="gray" />
          <StatsCard label="Scheduled" value={stats.scheduled} icon={CalendarIcon} color="blue" />
          <StatsCard label="Ongoing" value={stats.ongoing} icon={PlayIcon} color="amber" />
          <StatsCard label="Marks Pending" value={stats.marksPending} icon={ClockIcon} color="orange" />
          <StatsCard label="Published" value={stats.published} icon={CheckCircleIcon} color="green" />
        </div>
      )}

      {/* Reports & Analytics View */}
      {activeView === "reports" && (
        <div className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard 
              label="Total Students Assessed" 
              value={exams.reduce((acc, exam) => acc + (exam.marks[0]?.studentMarks.length || 0), 0)} 
              icon={UserGroupIcon} 
              color="blue" 
            />
            <StatsCard 
              label="Average Pass Rate" 
              value={`${Math.round(exams.filter(e => e.status === "published").length > 0 ? 75 : 0)}%`} 
              icon={CheckCircleIcon} 
              color="green" 
            />
            <StatsCard 
              label="Exams This Month" 
              value={exams.filter(e => new Date(e.startDate).getMonth() === new Date().getMonth()).length} 
              icon={CalendarIcon} 
              color="purple" 
            />
            <StatsCard 
              label="Pending Moderation" 
              value={exams.filter(e => e.marks.length > 0 && !e.isModerated).length} 
              icon={ShieldCheckIcon} 
              color="amber" 
            />
          </div>

          {/* Published Exams Reports */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Exam Results</h3>
            {exams.filter(e => e.status === "published").length > 0 ? (
              <div className="space-y-4">
                {exams.filter(e => e.status === "published").map(exam => (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                        <p className="text-sm text-gray-500">
                          Class {exam.grade}{exam.section ? `-${exam.section}` : ""} • Published on {new Date(exam.publishedAt || "").toLocaleDateString()}
                        </p>
                      </div>
                      <TypeBadge type={exam.type} />
                    </div>
                    
                    {/* Subject-wise Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {exam.marks.slice(0, 3).map(subjectMark => {
                        const subject = exam.subjects.find(s => s.id === subjectMark.subjectId);
                        const presentStudents = subjectMark.studentMarks.filter(s => !s.isAbsent);
                        const passedStudents = presentStudents.filter(s => s.marks !== null && s.marks >= (subject?.passingMarks || 0));
                        const passRate = presentStudents.length > 0 ? Math.round((passedStudents.length / presentStudents.length) * 100) : 0;
                        
                        return (
                          <div key={subjectMark.subjectId} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">{subjectMark.subjectName}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-900">{passRate}%</span>
                              <span className="text-xs text-gray-500">Pass Rate</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${passRate >= 75 ? "bg-green-500" : passRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${passRate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setManagingExam(exam)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                      >
                        <EyeIcon className="h-4 w-4 inline mr-1" />
                        View Details
                      </button>
                      <button 
                        onClick={() => {
                          // Generate report card
                          alert("📄 Report card generation feature\n\nThis will generate:\n- Individual student report cards\n- Class performance summary\n- Subject-wise analysis\n- Export to PDF");
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                        Generate Report Cards
                      </button>
                      <button 
                        onClick={() => {
                          // Export data
                          const csvData = exam.marks.map(sm => 
                            sm.studentMarks.map(student => 
                              `${student.rollNumber},${student.studentName},${sm.subjectName},${student.marks || "Absent"}`
                            ).join('\n')
                          ).join('\n');
                          
                          const blob = new Blob([`Roll No,Student Name,Subject,Marks\n${csvData}`], { type: 'text/csv' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `${exam.name.replace(/\s+/g, '_')}_results.csv`;
                          link.click();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No published exams yet. Publish exam results to see reports here.</p>
              </div>
            )}
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">Performance charts and analytics</p>
              <p className="text-xs text-gray-400">
                Visual analytics including grade distribution, subject-wise performance trends, and comparative analysis will be displayed here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {activeView === "exams" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search exams by name or grade..."
              size="md"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AssessmentType | "")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Types</option>
              {ASSESSMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExamStatus | "")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Statuses</option>
              {EXAM_STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Grades</option>
              {GRADES.map(grade => (
                <option key={grade} value={grade}>Class {grade}</option>
              ))}
            </select>
            {(typeFilter || statusFilter || gradeFilter || searchQuery) && (
              <button
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setGradeFilter("");
                  setSearchQuery("");
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Exams Grid */}
      {activeView === "exams" && filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onManage={() => setManagingExam(exam)}
            />
          ))}
        </div>
      ) : activeView === "exams" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || typeFilter || statusFilter || gradeFilter
              ? "No exams match your current filters. Try adjusting your search criteria."
              : "Get started by creating your first exam."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Exam
          </button>
        </div>
      ) : null}

      {/* Modals */}
      <ModalWrapper
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingExam(null);
        }}
        title={editingExam ? "Edit Exam" : "Create New Exam"}
        subtitle="Configure exam details and subjects"
        size="4xl"
      >
        <CreateExamForm
          onSave={handleSaveExam}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingExam(null);
          }}
          editExam={editingExam}
        />
      </ModalWrapper>

      {managingExam && (
        <ExamWorkflowManager
          exam={managingExam}
          onUpdate={handleUpdateExam}
          onClose={() => setManagingExam(null)}
        />
      )}
    </div>
  );
};

export default ExamsAssessments;
