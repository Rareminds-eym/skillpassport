/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AcademicCapIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CreditCardIcon,
    LockClosedIcon,
    PencilSquareIcon,
    PlusCircleIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserGroupIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { SubscriptionSettingsSection } from "../../../components/subscription/SubscriptionSettingsSection";

/* ==============================
   TYPES & INTERFACES
   ============================== */

// E1. Academic Calendar Settings
interface AcademicCalendar {
  id: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  isPublished: boolean;
}

interface TermWindow {
  id: string;
  name: string;
  type: "semester" | "term";
  startDate: string;
  endDate: string;
  academicYearId: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "national" | "regional" | "institutional";
  academicYearId: string;
}

interface ExamWindow {
  id: string;
  name: string;
  type: "semester_exam" | "ia" | "practical" | "viva";
  startDate: string;
  endDate: string;
  termId: string;
}

// E2. Subject/Course Master
interface Subject {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  category: "core" | "elective" | "skill" | "practical";
  // College variant
  departmentId?: string;
  programId?: string;
  credits: number;
  semester?: number;
}

// E3. Assessment Type Master
interface AssessmentType {
  id: string;
  typeName: string;
  category: "internal" | "external" | "practical";
  isActive: boolean;
  maxMarks: number;
  weightage: number;
}

// E4. Grading System Master
interface GradingSystem {
  id: string;
  gradeLabel: string;
  minMarks: number;
  maxMarks: number;
  gradePoint: number;
  isPass: boolean;
}

// E5. Attendance Policy Settings
interface AttendancePolicy {
  id: string;
  type: "course_level" | "department_level" | "program_level";
  minimumPercentage: number;
  labPracticalThreshold?: number;
  departmentId?: string;
  courseId?: string;
}

// E6. Role & Permission Settings
interface Role {
  id: string;
  roleName: string;
  moduleAccess: ModuleAccess[];
  scopeRules: ScopeRule[];
}

interface ModuleAccess {
  module: string;
  permissions: ("view" | "create" | "edit" | "approve" | "publish")[];
}

interface ScopeRule {
  type: "department" | "program" | "course";
  values: string[];
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
   STATS CARD
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  onClick,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo";
  onClick?: () => void;
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
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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
   ACADEMIC CALENDAR MODAL
   ============================== */
const AcademicCalendarModal = ({
  isOpen,
  onClose,
  calendar,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  calendar?: AcademicCalendar | null;
  onSaved: (calendar: AcademicCalendar) => void;
}) => {
  const [activeModalTab, setActiveModalTab] = useState("basic");
  const [formData, setFormData] = useState({
    academicYear: "",
    startDate: "",
    endDate: "",
  });
  const [termWindows, setTermWindows] = useState<TermWindow[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [examWindows, setExamWindows] = useState<ExamWindow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (calendar && isOpen) {
      setFormData({
        academicYear: calendar.academicYear,
        startDate: calendar.startDate,
        endDate: calendar.endDate,
      });
    } else if (!calendar && isOpen) {
      setFormData({
        academicYear: "",
        startDate: "",
        endDate: "",
      });
      setTermWindows([]);
      setHolidays([]);
      setExamWindows([]);
    }
  }, [calendar, isOpen]);

  const addTermWindow = () => {
    const newTerm: TermWindow = {
      id: Date.now().toString(),
      name: "",
      type: "semester",
      startDate: "",
      endDate: "",
      academicYearId: calendar?.id || "",
    };
    setTermWindows([...termWindows, newTerm]);
  };

  const updateTermWindow = (id: string, updates: Partial<TermWindow>) => {
    setTermWindows(termWindows.map(term => 
      term.id === id ? { ...term, ...updates } : term
    ));
  };

  const removeTermWindow = (id: string) => {
    setTermWindows(termWindows.filter(term => term.id !== id));
  };

  const addHoliday = () => {
    const newHoliday: Holiday = {
      id: Date.now().toString(),
      name: "",
      date: "",
      type: "institutional",
      academicYearId: calendar?.id || "",
    };
    setHolidays([...holidays, newHoliday]);
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays(holidays.map(holiday => 
      holiday.id === id ? { ...holiday, ...updates } : holiday
    ));
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(holiday => holiday.id !== id));
  };

  const addExamWindow = () => {
    const newExam: ExamWindow = {
      id: Date.now().toString(),
      name: "",
      type: "semester_exam",
      startDate: "",
      endDate: "",
      termId: "",
    };
    setExamWindows([...examWindows, newExam]);
  };

  const updateExamWindow = (id: string, updates: Partial<ExamWindow>) => {
    setExamWindows(examWindows.map(exam => 
      exam.id === id ? { ...exam, ...updates } : exam
    ));
  };

  const removeExamWindow = (id: string) => {
    setExamWindows(examWindows.filter(exam => exam.id !== id));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: calendar?.id || Date.now().toString(),
        academicYear: formData.academicYear,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: calendar?.isActive || false,
        isLocked: calendar?.isLocked || false,
        isPublished: calendar?.isPublished || false,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const modalTabs = [
    { id: "basic", label: "Basic Info", icon: CalendarDaysIcon },
    { id: "terms", label: "Terms/Semesters", icon: AcademicCapIcon },
    { id: "holidays", label: "Holidays", icon: ClockIcon },
    { id: "exams", label: "Exam Windows", icon: ClipboardDocumentListIcon },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={calendar ? "Edit Academic Calendar" : "Create Academic Calendar"}
      subtitle="Configure academic year, terms, holidays, and exam windows"
      size="large"
    >
      {/* Modal Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {modalTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveModalTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeModalTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeModalTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Terms/Semesters Tab */}
        {activeModalTab === "terms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Term/Semester Windows</h3>
              <button
                onClick={addTermWindow}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Term
              </button>
            </div>

            <div className="space-y-3">
              {termWindows.map((term) => (
                <div key={term.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term Name
                      </label>
                      <input
                        value={term.name}
                        onChange={(e) => updateTermWindow(term.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g., Semester 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={term.type}
                        onChange={(e) => updateTermWindow(term.id, { type: e.target.value as "semester" | "term" })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="semester">Semester</option>
                        <option value="term">Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={term.startDate}
                        onChange={(e) => updateTermWindow(term.id, { startDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={term.endDate}
                          onChange={(e) => updateTermWindow(term.id, { endDate: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <button
                        onClick={() => removeTermWindow(term.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {termWindows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No terms added yet. Click "Add Term" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeModalTab === "holidays" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Holidays</h3>
              <button
                onClick={addHoliday}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Holiday
              </button>
            </div>

            <div className="space-y-3">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Name
                      </label>
                      <input
                        value={holiday.name}
                        onChange={(e) => updateHoliday(holiday.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g., Independence Day"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={holiday.date}
                        onChange={(e) => updateHoliday(holiday.id, { date: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={holiday.type}
                          onChange={(e) => updateHoliday(holiday.id, { type: e.target.value as "national" | "regional" | "institutional" })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="national">National</option>
                          <option value="regional">Regional</option>
                          <option value="institutional">Institutional</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeHoliday(holiday.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {holidays.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No holidays added yet. Click "Add Holiday" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exam Windows Tab */}
        {activeModalTab === "exams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Exam Windows</h3>
              <button
                onClick={addExamWindow}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Exam Window
              </button>
            </div>

            <div className="space-y-3">
              {examWindows.map((exam) => (
                <div key={exam.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Name
                      </label>
                      <input
                        value={exam.name}
                        onChange={(e) => updateExamWindow(exam.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g., Mid-term Exam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={exam.type}
                        onChange={(e) => updateExamWindow(exam.id, { type: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="semester_exam">Semester Exam</option>
                        <option value="ia">Internal Assessment (IA)</option>
                        <option value="practical">Practical</option>
                        <option value="viva">Viva</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={exam.startDate}
                        onChange={(e) => updateExamWindow(exam.id, { startDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={exam.endDate}
                        onChange={(e) => updateExamWindow(exam.id, { endDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeExamWindow(exam.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {examWindows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No exam windows added yet. Click "Add Exam Window" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
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
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {calendar ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {calendar ? "Update Calendar" : "Create Calendar"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   ASSESSMENT TYPE MODAL
   ============================== */
const AssessmentTypeModal = ({
  isOpen,
  onClose,
  assessmentType,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  assessmentType?: AssessmentType | null;
  onSaved: (assessmentType: AssessmentType) => void;
}) => {
  const [formData, setFormData] = useState({
    typeName: "",
    category: "internal" as "internal" | "external" | "practical",
    isActive: true,
    maxMarks: 100,
    weightage: 20,
    description: "",
    duration: 180, // in minutes
    passingMarks: 40,
  });
  const [submitting, setSubmitting] = useState(false);

  // College default assessment types
  const collegeDefaults = [
    { name: "Internal Assessment 1 (IA1)", category: "internal", maxMarks: 50, weightage: 20 },
    { name: "Internal Assessment 2 (IA2)", category: "internal", maxMarks: 50, weightage: 20 },
    { name: "Semester End Examination", category: "external", maxMarks: 100, weightage: 60 },
    { name: "Practical Examination", category: "practical", maxMarks: 50, weightage: 25 },
    { name: "Viva Voce", category: "practical", maxMarks: 25, weightage: 15 },
    { name: "Arrears Examination", category: "external", maxMarks: 100, weightage: 100 },
  ];

  useEffect(() => {
    if (assessmentType && isOpen) {
      setFormData({
        typeName: assessmentType.typeName,
        category: assessmentType.category,
        isActive: assessmentType.isActive,
        maxMarks: assessmentType.maxMarks,
        weightage: assessmentType.weightage,
        description: "",
        duration: 180,
        passingMarks: Math.floor(assessmentType.maxMarks * 0.4),
      });
    } else if (!assessmentType && isOpen) {
      setFormData({
        typeName: "",
        category: "internal",
        isActive: true,
        maxMarks: 100,
        weightage: 20,
        description: "",
        duration: 180,
        passingMarks: 40,
      });
    }
  }, [assessmentType, isOpen]);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: assessmentType?.id || Date.now().toString(),
        typeName: formData.typeName,
        category: formData.category,
        isActive: formData.isActive,
        maxMarks: formData.maxMarks,
        weightage: formData.weightage,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const loadDefaultType = (defaultType: any) => {
    setFormData({
      ...formData,
      typeName: defaultType.name,
      category: defaultType.category,
      maxMarks: defaultType.maxMarks,
      weightage: defaultType.weightage,
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={assessmentType ? "Edit Assessment Type" : "Add Assessment Type"}
      subtitle="Configure assessment type with category and weightage"
      size="large"
    >
      <div className="space-y-6">
        {/* Quick Templates */}
        {!assessmentType && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">College Default Templates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {collegeDefaults.map((template, index) => (
                <button
                  key={index}
                  onClick={() => loadDefaultType(template)}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <p className="text-xs font-medium text-blue-900">{template.name}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {template.category.toUpperCase()} • {template.maxMarks} marks • {template.weightage}%
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Type Name <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.typeName}
                onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g., Internal Assessment 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="internal">Internal Assessment</option>
                <option value="external">External Assessment</option>
                <option value="practical">Practical Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Brief description of the assessment type..."
              />
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
                Active Status
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxMarks}
                onChange={(e) => {
                  const maxMarks = parseInt(e.target.value) || 0;
                  setFormData({ 
                    ...formData, 
                    maxMarks,
                    passingMarks: Math.floor(maxMarks * 0.4)
                  });
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="1"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weightage (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="30"
                max="480"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Marks
              </label>
              <input
                type="number"
                value={formData.passingMarks}
                onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="1"
                max={formData.maxMarks}
              />
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Preview</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{formData.typeName || "Assessment Type Name"}</h5>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  formData.category === "internal" ? "bg-blue-100 text-blue-800" :
                  formData.category === "external" ? "bg-purple-100 text-purple-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {formData.category.toUpperCase()}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                formData.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${formData.isActive ? "bg-green-500" : "bg-red-500"}`}></div>
                {formData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Marks:</span>
                <span className="font-semibold">{formData.maxMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weightage:</span>
                <span className="font-semibold">{formData.weightage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{formData.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passing:</span>
                <span className="font-semibold">{formData.passingMarks} marks</span>
              </div>
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
          disabled={submitting || !formData.typeName}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {assessmentType ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {assessmentType ? "Update Assessment" : "Create Assessment"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   GRADING SYSTEM MODAL
   ============================== */
const GradingSystemModal = ({
  isOpen,
  onClose,
  grade,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  grade?: GradingSystem | null;
  onSaved: (grade: GradingSystem) => void;
}) => {
  const [activeGradingTab, setActiveGradingTab] = useState("grade");
  const [formData, setFormData] = useState({
    gradeLabel: "",
    minMarks: 0,
    maxMarks: 0,
    gradePoint: 0,
    isPass: true,
    description: "",
    letterGrade: "",
  });
  const [sgpaRules, setSgpaRules] = useState({
    creditSystem: "semester" as "semester" | "annual",
    minCreditsRequired: 20,
    maxCreditsAllowed: 30,
    gradePointScale: 10,
    passingGradePoint: 5.0,
  });
  const [cgpaRules, setCgpaRules] = useState({
    totalSemesters: 8,
    minCgpaForPromotion: 5.0,
    minCgpaForGraduation: 6.0,
    honorsCgpaThreshold: 8.5,
    distinctionCgpaThreshold: 9.0,
  });
  const [submitting, setSubmitting] = useState(false);

  // College standard grading templates
  const gradingTemplates = [
    { label: "O", minMarks: 90, maxMarks: 100, gradePoint: 10, isPass: true, description: "Outstanding" },
    { label: "A+", minMarks: 80, maxMarks: 89, gradePoint: 9, isPass: true, description: "Excellent" },
    { label: "A", minMarks: 70, maxMarks: 79, gradePoint: 8, isPass: true, description: "Very Good" },
    { label: "B+", minMarks: 60, maxMarks: 69, gradePoint: 7, isPass: true, description: "Good" },
    { label: "B", minMarks: 50, maxMarks: 59, gradePoint: 6, isPass: true, description: "Above Average" },
    { label: "C", minMarks: 40, maxMarks: 49, gradePoint: 5, isPass: true, description: "Average" },
    { label: "F", minMarks: 0, maxMarks: 39, gradePoint: 0, isPass: false, description: "Fail" },
  ];

  useEffect(() => {
    if (grade && isOpen) {
      setFormData({
        gradeLabel: grade.gradeLabel,
        minMarks: grade.minMarks,
        maxMarks: grade.maxMarks,
        gradePoint: grade.gradePoint,
        isPass: grade.isPass,
        description: "",
        letterGrade: grade.gradeLabel,
      });
    } else if (!grade && isOpen) {
      setFormData({
        gradeLabel: "",
        minMarks: 0,
        maxMarks: 0,
        gradePoint: 0,
        isPass: true,
        description: "",
        letterGrade: "",
      });
    }
  }, [grade, isOpen]);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: grade?.id || Date.now().toString(),
        gradeLabel: formData.gradeLabel,
        minMarks: formData.minMarks,
        maxMarks: formData.maxMarks,
        gradePoint: formData.gradePoint,
        isPass: formData.isPass,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const loadTemplate = (template: any) => {
    setFormData({
      ...formData,
      gradeLabel: template.label,
      minMarks: template.minMarks,
      maxMarks: template.maxMarks,
      gradePoint: template.gradePoint,
      isPass: template.isPass,
      description: template.description,
      letterGrade: template.label,
    });
  };

  const gradingTabs = [
    { id: "grade", label: "Grade Details", icon: ChartBarIcon },
    { id: "sgpa", label: "SGPA Rules", icon: AcademicCapIcon },
    { id: "cgpa", label: "CGPA Rules", icon: ClipboardDocumentListIcon },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={grade ? "Edit Grade" : "Add Grade"}
      subtitle="Configure grade points and SGPA/CGPA calculation rules"
      size="large"
    >
      {/* Modal Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {gradingTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveGradingTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeGradingTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Grade Details Tab */}
        {activeGradingTab === "grade" && (
          <div className="space-y-6">
            {/* Quick Templates */}
            {!grade && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Standard College Grading Templates</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {gradingTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => loadTemplate(template)}
                      className={`text-center p-3 bg-white border-2 rounded-lg hover:bg-blue-50 transition-colors ${
                        template.isPass ? "border-green-200" : "border-red-200"
                      }`}
                    >
                      <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center font-bold text-sm mb-1 ${
                        template.isPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {template.label}
                      </div>
                      <p className="text-xs text-gray-600">{template.gradePoint} GP</p>
                      <p className="text-xs text-gray-500">{template.minMarks}-{template.maxMarks}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.gradeLabel}
                    onChange={(e) => setFormData({ ...formData, gradeLabel: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g., A+, O, B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.minMarks}
                      onChange={(e) => setFormData({ ...formData, minMarks: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g., Outstanding, Excellent, Good"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Point <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gradePoint}
                    onChange={(e) => setFormData({ ...formData, gradePoint: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="10"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPass"
                    checked={formData.isPass}
                    onChange={(e) => setFormData({ ...formData, isPass: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPass" className="text-sm font-medium text-gray-700">
                    Passing Grade
                  </label>
                </div>

                {/* Grade Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Grade Preview</h5>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl ${
                      formData.isPass ? "bg-green-100 text-green-800 border-2 border-green-200" : "bg-red-100 text-red-800 border-2 border-red-200"
                    }`}>
                      {formData.gradeLabel || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Grade Point: {formData.gradePoint}</p>
                      <p className="text-sm text-gray-600">{formData.minMarks} - {formData.maxMarks} marks</p>
                      <p className="text-sm text-gray-600">{formData.description}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                        formData.isPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {formData.isPass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SGPA Rules Tab */}
        {activeGradingTab === "sgpa" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">SGPA (Semester Grade Point Average) Configuration</h4>
              <p className="text-sm text-blue-800">Configure how SGPA is calculated for each semester based on credit system and grade points.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit System
                  </label>
                  <select
                    value={sgpaRules.creditSystem}
                    onChange={(e) => setSgpaRules({ ...sgpaRules, creditSystem: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="semester">Semester System</option>
                    <option value="annual">Annual System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Point Scale
                  </label>
                  <select
                    value={sgpaRules.gradePointScale}
                    onChange={(e) => setSgpaRules({ ...sgpaRules, gradePointScale: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="10">10 Point Scale</option>
                    <option value="4">4 Point Scale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Grade Point
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sgpaRules.passingGradePoint}
                    onChange={(e) => setSgpaRules({ ...sgpaRules, passingGradePoint: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max={sgpaRules.gradePointScale}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Credits Required
                  </label>
                  <input
                    type="number"
                    value={sgpaRules.minCreditsRequired}
                    onChange={(e) => setSgpaRules({ ...sgpaRules, minCreditsRequired: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Credits Allowed
                  </label>
                  <input
                    type="number"
                    value={sgpaRules.maxCreditsAllowed}
                    onChange={(e) => setSgpaRules({ ...sgpaRules, maxCreditsAllowed: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="1"
                    max="50"
                  />
                </div>

                {/* SGPA Formula Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">SGPA Calculation Formula</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>SGPA = Σ(Grade Point × Credits) / Σ(Credits)</strong></p>
                    <p className="text-xs text-gray-600">Where Σ represents the sum of all subjects in the semester</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CGPA Rules Tab */}
        {activeGradingTab === "cgpa" && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">CGPA (Cumulative Grade Point Average) Configuration</h4>
              <p className="text-sm text-green-800">Configure overall degree requirements and classification thresholds based on CGPA.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Semesters
                  </label>
                  <input
                    type="number"
                    value={cgpaRules.totalSemesters}
                    onChange={(e) => setCgpaRules({ ...cgpaRules, totalSemesters: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="2"
                    max="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min CGPA for Promotion
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgpaRules.minCgpaForPromotion}
                    onChange={(e) => setCgpaRules({ ...cgpaRules, minCgpaForPromotion: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min CGPA for Graduation
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgpaRules.minCgpaForGraduation}
                    onChange={(e) => setCgpaRules({ ...cgpaRules, minCgpaForGraduation: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Honors CGPA Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgpaRules.honorsCgpaThreshold}
                    onChange={(e) => setCgpaRules({ ...cgpaRules, honorsCgpaThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distinction CGPA Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cgpaRules.distinctionCgpaThreshold}
                    onChange={(e) => setCgpaRules({ ...cgpaRules, distinctionCgpaThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    min="0"
                    max="10"
                  />
                </div>

                {/* CGPA Classification Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Degree Classification</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Distinction:</span>
                      <span className="font-semibold text-purple-700">≥ {cgpaRules.distinctionCgpaThreshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Honors:</span>
                      <span className="font-semibold text-blue-700">≥ {cgpaRules.honorsCgpaThreshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass:</span>
                      <span className="font-semibold text-green-700">≥ {cgpaRules.minCgpaForGraduation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fail:</span>
                      <span className="font-semibold text-red-700">&lt; {cgpaRules.minCgpaForGraduation}</span>
                    </div>
                  </div>
                </div>

                {/* CGPA Formula Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">CGPA Calculation Formula</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>CGPA = Σ(SGPA × Credits) / Σ(Credits)</strong></p>
                    <p className="text-xs text-gray-600">Where Σ represents the sum across all semesters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
          disabled={submitting || !formData.gradeLabel}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {grade ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {grade ? "Update Grade" : "Create Grade"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
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
    policyName: "",
    type: "course_level" as "course_level" | "department_level" | "program_level",
    courseId: "",
    departmentId: "",
    programId: "",
    minimumPercentage: 75,
    labPracticalThreshold: 80,
    hasLabPractical: true,
    theoryThreshold: 75,
    tutorialThreshold: 75,
    projectThreshold: 80,
    enableSeparateThresholds: true,
    attendanceCalculation: "overall" as "overall" | "separate" | "weighted",
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
    { id: "CS101", name: "Data Structures and Algorithms", type: "theory", credits: 4 },
    { id: "CS102", name: "Database Management Systems", type: "theory", credits: 3 },
    { id: "CS103", name: "Computer Networks Lab", type: "practical", credits: 2 },
    { id: "CS104", name: "Software Engineering", type: "theory", credits: 4 },
    { id: "CS105", name: "Web Development Lab", type: "practical", credits: 2 },
  ];

  const departments = [
    { id: "CSE", name: "Computer Science & Engineering" },
    { id: "IT", name: "Information Technology" },
    { id: "ECE", name: "Electronics & Communication" },
    { id: "ME", name: "Mechanical Engineering" },
  ];

  useEffect(() => {
    if (policy && isOpen) {
      setFormData({
        policyName: `${policy.type} Policy`,
        type: policy.type,
        courseId: policy.courseId || "",
        departmentId: policy.departmentId || "",
        programId: "",
        minimumPercentage: policy.minimumPercentage,
        labPracticalThreshold: policy.labPracticalThreshold || 80,
        hasLabPractical: !!policy.labPracticalThreshold,
        theoryThreshold: policy.minimumPercentage,
        tutorialThreshold: 75,
        projectThreshold: 80,
        enableSeparateThresholds: !!policy.labPracticalThreshold,
        attendanceCalculation: "overall",
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
        policyName: "",
        type: "course_level",
        courseId: "",
        departmentId: "",
        programId: "",
        minimumPercentage: 75,
        labPracticalThreshold: 80,
        hasLabPractical: true,
        theoryThreshold: 75,
        tutorialThreshold: 75,
        projectThreshold: 80,
        enableSeparateThresholds: true,
        attendanceCalculation: "overall",
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
        labPracticalThreshold: formData.enableSeparateThresholds ? formData.labPracticalThreshold : undefined,
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
      title={policy ? "Edit Attendance Policy" : "Create Attendance Policy"}
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

            {formData.type === "course_level" && (
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

            {formData.type === "department_level" && (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name
              </label>
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
                onChange={(e) => setFormData({ ...formData, minimumPercentage: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, enableSeparateThresholds: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label htmlFor="enableSeparateThresholds" className="text-sm font-medium text-gray-700">
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
                    onChange={(e) => setFormData({ ...formData, theoryThreshold: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, labPracticalThreshold: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, tutorialThreshold: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, attendanceCalculation: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="overall">Overall Percentage</option>
                <option value="separate">Separate for Theory/Lab</option>
                <option value="weighted">Weighted Average</option>
              </select>
            </div>

            {formData.attendanceCalculation === "weighted" && (
              <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theory Weight (%)
                  </label>
                  <input
                    type="number"
                    value={formData.theoryWeight}
                    onChange={(e) => setFormData({ ...formData, theoryWeight: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, labWeight: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                min="0"
                max="30"
              />
              <p className="text-xs text-gray-500 mt-1">Days at the beginning of semester with relaxed attendance</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="medicalLeaveAllowed"
                checked={formData.medicalLeaveAllowed}
                onChange={(e) => setFormData({ ...formData, medicalLeaveAllowed: e.target.checked })}
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
                  onChange={(e) => setFormData({ ...formData, maxMedicalDays: parseInt(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, maxCondonationPercentage: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  min="0"
                  max="15"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum percentage that can be condoned by authorities</p>
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
              <p className="text-xs text-gray-500 mt-1">Attendance percentages that trigger warnings</p>
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
                <h5 className="font-semibold text-gray-900">{formData.policyName || "Attendance Policy"}</h5>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.type === "course_level" && formData.courseId && `Course: ${formData.courseId}`}
                  {formData.type === "department_level" && formData.departmentId && `Department: ${formData.departmentId}`}
                  {formData.type === "program_level" && "Program Level Policy"}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                formData.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {formData.isActive ? "Active" : "Inactive"}
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
          disabled={submitting || (!formData.courseId && formData.type === "course_level") || (!formData.departmentId && formData.type === "department_level")}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {policy ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {policy ? "Update Policy" : "Create Policy"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   ROLE & PERMISSION MODAL
   ============================== */
const RolePermissionModal = ({
  isOpen,
  onClose,
  role,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSaved: (role: Role) => void;
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState("basic");
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    isActive: true,
    priority: 1,
  });
  const [modulePermissions, setModulePermissions] = useState<ModuleAccess[]>([]);
  const [scopeRules, setScopeRules] = useState<ScopeRule[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Available modules for college administration
  const availableModules = [
    { name: "Academic Calendar", description: "Manage academic years, terms, holidays" },
    { name: "Course Management", description: "Manage courses, subjects, curriculum" },
    { name: "Student Management", description: "Manage student records, enrollment" },
    { name: "Faculty Management", description: "Manage faculty records, assignments" },
    { name: "Assessment Management", description: "Manage exams, grading, results" },
    { name: "Attendance Management", description: "Track and manage attendance" },
    { name: "Fee Management", description: "Manage fee structure, payments" },
    { name: "Library Management", description: "Manage library resources, circulation" },
    { name: "Hostel Management", description: "Manage hostel allocation, facilities" },
    { name: "Transport Management", description: "Manage transport routes, schedules" },
    { name: "Reports & Analytics", description: "Generate reports and analytics" },
    { name: "System Settings", description: "Configure system settings" },
  ];

  const permissions = ["view", "create", "edit", "approve", "publish"] as const;

  // Available departments and programs
  const departments = [
    { id: "CSE", name: "Computer Science & Engineering" },
    { id: "IT", name: "Information Technology" },
    { id: "ECE", name: "Electronics & Communication" },
    { id: "ME", name: "Mechanical Engineering" },
    { id: "CE", name: "Civil Engineering" },
    { id: "EEE", name: "Electrical & Electronics" },
  ];

  const programs = [
    { id: "BTECH", name: "Bachelor of Technology" },
    { id: "MTECH", name: "Master of Technology" },
    { id: "MBA", name: "Master of Business Administration" },
    { id: "MCA", name: "Master of Computer Applications" },
    { id: "PHD", name: "Doctor of Philosophy" },
  ];

  useEffect(() => {
    if (role && isOpen) {
      setFormData({
        roleName: role.roleName,
        description: "",
        isActive: true,
        priority: 1,
      });
      setModulePermissions(role.moduleAccess || []);
      setScopeRules(role.scopeRules || []);
    } else if (!role && isOpen) {
      setFormData({
        roleName: "",
        description: "",
        isActive: true,
        priority: 1,
      });
      setModulePermissions([]);
      setScopeRules([]);
    }
  }, [role, isOpen]);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: role?.id || Date.now().toString(),
        roleName: formData.roleName,
        moduleAccess: modulePermissions,
        scopeRules,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const updateModulePermissions = (moduleName: string, permission: string, checked: boolean) => {
    setModulePermissions(prev => {
      const existing = prev.find(m => m.module === moduleName);
      if (existing) {
        const updatedPermissions = checked 
          ? [...existing.permissions, permission as any]
          : existing.permissions.filter(p => p !== permission);
        
        if (updatedPermissions.length === 0) {
          return prev.filter(m => m.module !== moduleName);
        }
        
        return prev.map(m => 
          m.module === moduleName 
            ? { ...m, permissions: updatedPermissions }
            : m
        );
      } else if (checked) {
        return [...prev, { module: moduleName, permissions: [permission as any] }];
      }
      return prev;
    });
  };

  const addScopeRule = (type: "department" | "program") => {
    setScopeRules(prev => [...prev, { type, values: [] }]);
  };

  const updateScopeRule = (index: number, values: string[]) => {
    setScopeRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, values } : rule
    ));
  };

  const removeScopeRule = (index: number) => {
    setScopeRules(prev => prev.filter((_, i) => i !== index));
  };

  const roleTabs = [
    { id: "basic", label: "Basic Info", icon: UserGroupIcon },
    { id: "permissions", label: "Module Permissions", icon: ShieldCheckIcon },
    { id: "scope", label: "Scope Rules", icon: AcademicCapIcon },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={role ? "Edit Role" : "Create Role"}
      subtitle="Configure role permissions and access scope"
      size="large"
    >
      {/* Modal Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveRoleTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeRoleTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeRoleTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g., Department Head, Program Coordinator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Describe the role responsibilities and purpose..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>1 - Highest (Dean, Principal)</option>
                  <option value={2}>2 - High (HOD, Director)</option>
                  <option value={3}>3 - Medium (Coordinator, Manager)</option>
                  <option value={4}>4 - Low (Assistant, Officer)</option>
                  <option value={5}>5 - Lowest (Clerk, Helper)</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Role
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module Permissions Tab */}
        {activeRoleTab === "permissions" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Module Access Matrix</h4>
              <p className="text-sm text-blue-800">Configure which modules this role can access and what actions they can perform.</p>
            </div>

            <div className="space-y-4">
              {availableModules.map((module) => {
                const currentModuleAccess = modulePermissions.find(m => m.module === module.name);
                return (
                  <div key={module.name} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{module.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {permissions.map((permission) => (
                        <label key={permission} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentModuleAccess?.permissions.includes(permission) || false}
                            onChange={(e) => updateModulePermissions(module.name, permission, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scope Rules Tab */}
        {activeRoleTab === "scope" && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Access Scope Configuration</h4>
              <p className="text-sm text-green-800">Define which departments or programs this role has access to.</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => addScopeRule("department")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Department Scope
              </button>
              <button
                onClick={() => addScopeRule("program")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Program Scope
              </button>
            </div>

            <div className="space-y-4">
              {scopeRules.map((rule, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900 capitalize">{rule.type} Access</h5>
                    <button
                      onClick={() => removeScopeRule(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(rule.type === "department" ? departments : programs).map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.values.includes(item.id)}
                          onChange={(e) => {
                            const newValues = e.target.checked
                              ? [...rule.values, item.id]
                              : rule.values.filter(v => v !== item.id);
                            updateScopeRule(index, newValues);
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  {rule.values.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No {rule.type}s selected. This rule will have no effect.</p>
                  )}
                </div>
              ))}
              
              {scopeRules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No scope rules defined. Add department or program scope to restrict access.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Role Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Role Summary</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900">{formData.roleName || "Role Name"}</h5>
              <p className="text-sm text-gray-600 mt-1">{formData.description || "No description provided"}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              formData.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {formData.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <span className="text-blue-900 font-medium">Modules</span>
              <p className="text-blue-800 font-bold">{modulePermissions.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <span className="text-green-900 font-medium">Scope Rules</span>
              <p className="text-green-800 font-bold">{scopeRules.length}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
              <span className="text-purple-900 font-medium">Priority</span>
              <p className="text-purple-800 font-bold">Level {formData.priority}</p>
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
          disabled={submitting || !formData.roleName}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {role ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {role ? "Update Role" : "Create Role"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   SUBJECT/COURSE MODAL
   ============================== */
const SubjectModal = ({
  isOpen,
  onClose,
  subject,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  subject?: Subject | null;
  onSaved: (subject: Subject) => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "active" as "active" | "inactive",
    category: "core" as "core" | "elective" | "skill" | "practical",
    credits: 3,
    semester: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (subject && isOpen) {
      setFormData({
        name: subject.name,
        code: subject.code,
        status: subject.status,
        category: subject.category,
        credits: subject.credits,
        semester: subject.semester || 1,
      });
    } else if (!subject && isOpen) {
      setFormData({
        name: "",
        code: "",
        status: "active",
        category: "core",
        credits: 3,
        semester: 1,
      });
    }
  }, [subject, isOpen]);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: subject?.id || Date.now().toString(),
        name: formData.name,
        code: formData.code,
        status: formData.status,
        category: formData.category,
        credits: formData.credits,
        semester: formData.semester,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? "Edit Course" : "Add Course"}
      subtitle="Configure course details and mapping"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g., Data Structures"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g., CS201"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="skill">Skill</option>
              <option value="practical">Practical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits
            </label>
            <input
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
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
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {subject ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {subject ? "Update" : "Create"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN SETTINGS COMPONENT
   ============================== */
const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    "academic" | "subjects" | "assessments" | "grading" | "attendance" | "roles" | "subscription"
  >("academic");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editAcademicCalendar, setEditAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editAssessmentType, setEditAssessmentType] = useState<AssessmentType | null>(null);
  const [editGradingSystem, setEditGradingSystem] = useState<GradingSystem | null>(null);
  const [editAttendancePolicy, setEditAttendancePolicy] = useState<AttendancePolicy | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);

  // Data states
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>([
    {
      id: "1",
      academicYear: "2024-2025",
      startDate: "2024-07-01",
      endDate: "2025-06-30",
      isActive: true,
      isLocked: false,
      isPublished: true,
    },
  ]);

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: "1",
      name: "Data Structures and Algorithms",
      code: "CS201",
      status: "active",
      category: "core",
      credits: 4,
      semester: 3,
    },
    {
      id: "2",
      name: "Database Management Systems",
      code: "CS301",
      status: "active",
      category: "core",
      credits: 3,
      semester: 5,
    },
  ]);

  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([
    { id: "1", typeName: "Internal Assessment 1 (IA1)", category: "internal", isActive: true, maxMarks: 50, weightage: 20 },
    { id: "2", typeName: "Internal Assessment 2 (IA2)", category: "internal", isActive: true, maxMarks: 50, weightage: 20 },
    { id: "3", typeName: "Semester End Examination", category: "external", isActive: true, maxMarks: 100, weightage: 60 },
    { id: "4", typeName: "Practical Examination", category: "practical", isActive: true, maxMarks: 50, weightage: 25 },
    { id: "5", typeName: "Viva Voce", category: "practical", isActive: true, maxMarks: 25, weightage: 15 },
    { id: "6", typeName: "Arrears Examination", category: "external", isActive: true, maxMarks: 100, weightage: 100 },
  ]);

  const [gradingSystem, setGradingSystem] = useState<GradingSystem[]>([
    { id: "1", gradeLabel: "O", minMarks: 90, maxMarks: 100, gradePoint: 10, isPass: true },
    { id: "2", gradeLabel: "A+", minMarks: 80, maxMarks: 89, gradePoint: 9, isPass: true },
    { id: "3", gradeLabel: "A", minMarks: 70, maxMarks: 79, gradePoint: 8, isPass: true },
    { id: "4", gradeLabel: "B+", minMarks: 60, maxMarks: 69, gradePoint: 7, isPass: true },
    { id: "5", gradeLabel: "B", minMarks: 50, maxMarks: 59, gradePoint: 6, isPass: true },
    { id: "6", gradeLabel: "C", minMarks: 40, maxMarks: 49, gradePoint: 5, isPass: true },
    { id: "7", gradeLabel: "F", minMarks: 0, maxMarks: 39, gradePoint: 0, isPass: false },
  ]);

  const [attendancePolicies, setAttendancePolicies] = useState<AttendancePolicy[]>([
    { id: "1", type: "course_level", minimumPercentage: 75, courseId: "CS101" },
    { id: "2", type: "course_level", minimumPercentage: 75, labPracticalThreshold: 80, courseId: "CS103" },
    { id: "3", type: "department_level", minimumPercentage: 80, departmentId: "CSE" },
    { id: "4", type: "course_level", minimumPercentage: 70, labPracticalThreshold: 85, courseId: "CS105" },
  ]);

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      roleName: "Dean",
      moduleAccess: [
        { module: "Academic Calendar", permissions: ["view", "create", "edit", "approve", "publish"] },
        { module: "Course Management", permissions: ["view", "create", "edit", "approve", "publish"] },
        { module: "Student Management", permissions: ["view", "create", "edit", "approve"] },
        { module: "Faculty Management", permissions: ["view", "create", "edit", "approve"] },
        { module: "Assessment Management", permissions: ["view", "approve", "publish"] },
        { module: "Reports & Analytics", permissions: ["view", "create", "edit"] },
      ],
      scopeRules: [{ type: "department", values: ["CSE", "IT", "ECE", "ME"] }],
    },
    {
      id: "2",
      roleName: "HOD (Computer Science)",
      moduleAccess: [
        { module: "Course Management", permissions: ["view", "create", "edit"] },
        { module: "Student Management", permissions: ["view", "edit"] },
        { module: "Faculty Management", permissions: ["view", "edit"] },
        { module: "Assessment Management", permissions: ["view", "create", "edit"] },
        { module: "Attendance Management", permissions: ["view", "edit"] },
      ],
      scopeRules: [{ type: "department", values: ["CSE"] }],
    },
    {
      id: "3",
      roleName: "Program Coordinator",
      moduleAccess: [
        { module: "Course Management", permissions: ["view", "edit"] },
        { module: "Student Management", permissions: ["view", "edit"] },
        { module: "Assessment Management", permissions: ["view", "create", "edit"] },
        { module: "Attendance Management", permissions: ["view", "edit"] },
      ],
      scopeRules: [{ type: "program", values: ["BTECH", "MTECH"] }],
    },
    {
      id: "4",
      roleName: "Faculty",
      moduleAccess: [
        { module: "Course Management", permissions: ["view"] },
        { module: "Student Management", permissions: ["view"] },
        { module: "Assessment Management", permissions: ["view", "create", "edit"] },
        { module: "Attendance Management", permissions: ["view", "create", "edit"] },
      ],
      scopeRules: [{ type: "department", values: ["CSE", "IT"] }],
    },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSaveAcademicCalendar = (calendar: AcademicCalendar) => {
    if (editAcademicCalendar) {
      setAcademicCalendars(prev => prev.map(c => c.id === calendar.id ? calendar : c));
    } else {
      setAcademicCalendars(prev => [...prev, calendar]);
    }
    setEditAcademicCalendar(null);
  };

  const handleSaveSubject = (subject: Subject) => {
    if (editSubject) {
      setSubjects(prev => prev.map(s => s.id === subject.id ? subject : s));
    } else {
      setSubjects(prev => [...prev, subject]);
    }
    setEditSubject(null);
  };

  const handleSaveAssessmentType = (assessmentType: AssessmentType) => {
    if (editAssessmentType) {
      setAssessmentTypes(prev => prev.map(a => a.id === assessmentType.id ? assessmentType : a));
    } else {
      setAssessmentTypes(prev => [...prev, assessmentType]);
    }
    setEditAssessmentType(null);
  };

  const handleSaveGradingSystem = (grade: GradingSystem) => {
    if (editGradingSystem) {
      setGradingSystem(prev => prev.map(g => g.id === grade.id ? grade : g));
    } else {
      setGradingSystem(prev => [...prev, grade]);
    }
    setEditGradingSystem(null);
  };

  const handleSaveAttendancePolicy = (policy: AttendancePolicy) => {
    if (editAttendancePolicy) {
      setAttendancePolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
    } else {
      setAttendancePolicies(prev => [...prev, policy]);
    }
    setEditAttendancePolicy(null);
  };

  const handleSaveRole = (role: Role) => {
    if (editRole) {
      setRoles(prev => prev.map(r => r.id === role.id ? role : r));
    } else {
      setRoles(prev => [...prev, role]);
    }
    setEditRole(null);
  };

  const handlePublishCalendar = (id: string) => {
    setAcademicCalendars(prev => prev.map(c => 
      c.id === id ? { ...c, isPublished: true } : c
    ));
  };

  const handleLockCalendar = (id: string) => {
    setAcademicCalendars(prev => prev.map(c => 
      c.id === id ? { ...c, isLocked: true } : c
    ));
  };

  const tabs = [
    { id: "academic", label: "Academic Calendar", icon: CalendarDaysIcon },
    { id: "subjects", label: "Course Master", icon: AcademicCapIcon },
    { id: "assessments", label: "Assessment Types", icon: ClipboardDocumentListIcon },
    { id: "grading", label: "Grading System", icon: ChartBarIcon },
    { id: "attendance", label: "Attendance Policy", icon: ClockIcon },
    { id: "roles", label: "Roles & Permissions", icon: UserGroupIcon },
    { id: "subscription", label: "Subscription", icon: CreditCardIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
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
                Settings & Masters
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                Configure academic settings, masters data, and system policies for comprehensive college management
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
            label="Academic Years"
            value={academicCalendars.length}
            icon={CalendarDaysIcon}
            color="blue"
            onClick={() => setActiveTab("academic")}
          />
          <StatsCard
            label="Courses"
            value={subjects.length}
            icon={AcademicCapIcon}
            color="green"
            onClick={() => setActiveTab("subjects")}
          />
          <StatsCard
            label="Assessment Types"
            value={assessmentTypes.length}
            icon={ClipboardDocumentListIcon}
            color="purple"
            onClick={() => setActiveTab("assessments")}
          />
          <StatsCard
            label="Active Roles"
            value={roles.length}
            icon={UserGroupIcon}
            color="amber"
            onClick={() => setActiveTab("roles")}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile Tab Navigation (< 640px) */}
          <div className="block sm:hidden">
            <div className="flex overflow-x-auto bg-gray-50 p-2 gap-1 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 min-w-[80px] flex-shrink-0 touch-manipulation ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold leading-tight text-center">
                      {tab.label.includes(' ') ? tab.label.split(' ')[0] : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tablet Tab Navigation (640px - 1024px) */}
          <div className="hidden sm:block lg:hidden">
            <div className="flex overflow-x-auto bg-gray-50 p-2 gap-1 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 min-w-fit flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-semibold">
                      {tab.label.length > 12 ? tab.label.split(' ')[0] : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Tab Navigation (>= 1024px) */}
          <div className="hidden lg:block p-2">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* E1. Academic Calendar Settings */}
          {activeTab === "academic" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Academic Calendar Settings</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Configure academic years, terms, holidays, and exam windows</p>
              </div>
              <button 
                onClick={() => setShowAcademicModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Academic Year</span>
                <span className="sm:hidden">Add Year</span>
              </button>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {academicCalendars.map((calendar) => (
                <div key={calendar.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200 hover:bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{calendar.academicYear}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Duration:</span> {new Date(calendar.startDate).toLocaleDateString()} - {new Date(calendar.endDate).toLocaleDateString()}
                      </p>
                      
                      {/* Calendar Summary Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-900">Terms</span>
                          </div>
                          <p className="text-lg font-bold text-blue-800 mt-1">2</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-900">Holidays</span>
                          </div>
                          <p className="text-lg font-bold text-green-800 mt-1">15</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-900">Exams</span>
                          </div>
                          <p className="text-lg font-bold text-purple-800 mt-1">6</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-900">IA Windows</span>
                          </div>
                          <p className="text-lg font-bold text-amber-800 mt-1">4</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {calendar.isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Active
                        </span>
                      )}
                      {calendar.isPublished && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Published
                        </span>
                      )}
                      {calendar.isLocked && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          <LockClosedIcon className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditAcademicCalendar(calendar);
                        setShowAcademicModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {!calendar.isPublished && (
                      <button 
                        onClick={() => handlePublishCalendar(calendar.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Publish Calendar
                      </button>
                    )}
                    {!calendar.isLocked && (
                      <button 
                        onClick={() => handleLockCalendar(calendar.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Lock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* E2. Subject/Course Master */}
          {activeTab === "subjects" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Course Master</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Manage courses mapped to departments/programs with credits</p>
              </div>
              <button 
                onClick={() => setShowSubjectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Course</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{subject.name}</h3>
                      <p className="text-sm font-mono text-gray-600 mb-2">{subject.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditSubject(subject);
                          setShowSubjectModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        subject.category === "core" ? "bg-blue-100 text-blue-800" :
                        subject.category === "elective" ? "bg-purple-100 text-purple-800" :
                        subject.category === "skill" ? "bg-green-100 text-green-800" :
                        "bg-orange-100 text-orange-800"
                      }`}>
                        {subject.category.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Credits:</span>
                      <span className="ml-2 font-medium text-gray-900">{subject.credits}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Semester:</span>
                      <span className="ml-2 font-medium text-gray-900">Sem {subject.semester}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        subject.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {subject.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Course</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Code</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Category</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Credits</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Semester</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{subject.name}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{subject.code}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            subject.category === "core" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                            subject.category === "elective" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                            subject.category === "skill" ? "bg-green-100 text-green-800 border border-green-200" :
                            "bg-orange-100 text-orange-800 border border-orange-200"
                          }`}>
                            {subject.category.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">{subject.credits}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">Sem {subject.semester}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            subject.status === "active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}>
                            {subject.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditSubject(subject);
                                setShowSubjectModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* E3. Assessment Type Master */}
          {activeTab === "assessments" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Assessment Type Master</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Configure assessment types: IA, Semester exam, Practical, Viva, Arrears</p>
              </div>
              <button 
                onClick={() => setShowAssessmentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Assessment Type</span>
                <span className="sm:hidden">Add Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {assessmentTypes.map((assessment) => (
                <div key={assessment.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{assessment.typeName}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        assessment.category === "internal" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        assessment.category === "external" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {assessment.category.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Marks:</span>
                      <span className="text-sm font-semibold text-gray-900">{assessment.maxMarks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Weightage:</span>
                      <span className="text-sm font-semibold text-gray-900">{assessment.weightage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        assessment.isActive ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${assessment.isActive ? "bg-green-500" : "bg-red-500"}`}></div>
                        {assessment.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditAssessmentType(assessment);
                        setShowAssessmentModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setAssessmentTypes(prev => prev.filter(a => a.id !== assessment.id));
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
        )}

          {/* E4. Grading System Master */}
          {activeTab === "grading" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Grading System Master</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Mandatory grade points + SGPA/CGPA rules</p>
                
                {/* System Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Scale</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800 mt-1">10 Point</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-900">SGPA Min</span>
                    </div>
                    <p className="text-lg font-bold text-green-800 mt-1">5.0</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-900">CGPA Min</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800 mt-1">6.0</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-900">Grades</span>
                    </div>
                    <p className="text-lg font-bold text-amber-800 mt-1">{gradingSystem.length}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowGradingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Grade</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {gradingSystem.map((grade) => (
                <div key={grade.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        grade.isPass ? "bg-green-100 text-green-800 border-2 border-green-200" : "bg-red-100 text-red-800 border-2 border-red-200"
                      }`}>
                        {grade.gradeLabel}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Grade Point: {grade.gradePoint}</p>
                        <p className="text-sm text-gray-600">{grade.minMarks} - {grade.maxMarks} marks</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      grade.isPass ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {grade.isPass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditGradingSystem(grade);
                        setShowGradingModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setGradingSystem(prev => prev.filter(g => g.id !== grade.id));
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

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Grade Label</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Min Marks</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Max Marks</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Grade Point</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Pass Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gradingSystem.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${
                            grade.isPass ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            {grade.gradeLabel}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">{grade.minMarks}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">{grade.maxMarks}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{grade.gradePoint}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            grade.isPass ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${grade.isPass ? "bg-green-500" : "bg-red-500"}`}></div>
                            {grade.isPass ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditGradingSystem(grade);
                                setShowGradingModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setGradingSystem(prev => prev.filter(g => g.id !== grade.id));
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* E5. Attendance Policy Settings */}
          {activeTab === "attendance" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Attendance Policy Settings</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Course-level attendance with minimum % per course, lab/practical separate thresholds</p>
                
                {/* Policy Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Total Policies</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800 mt-1">{attendancePolicies.length}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-900">Course Level</span>
                    </div>
                    <p className="text-lg font-bold text-green-800 mt-1">
                      {attendancePolicies.filter(p => p.type === "course_level").length}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-900">Dept Level</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800 mt-1">
                      {attendancePolicies.filter(p => p.type === "department_level").length}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-900">Avg Threshold</span>
                    </div>
                    <p className="text-lg font-bold text-amber-800 mt-1">
                      {Math.round(attendancePolicies.reduce((sum, p) => sum + p.minimumPercentage, 0) / attendancePolicies.length)}%
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
                <div key={policy.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ClockIcon className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                          {policy.type === "course_level" ? "Course Level Policy" : "Department Level Policy"}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {policy.type === "course_level" && policy.courseId && (
                          <>Course: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{policy.courseId}</span></>
                        )}
                        {policy.type === "department_level" && policy.departmentId && (
                          <>Department: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{policy.departmentId}</span></>
                        )}
                        {policy.type === "program_level" && (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">Program Level Policy</span>
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                      {policy.type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Minimum Attendance</span>
                        <span className="text-lg font-bold text-blue-800">{policy.minimumPercentage}%</span>
                      </div>
                    </div>
                    {policy.labPracticalThreshold && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">Lab/Practical</span>
                          <span className="text-lg font-bold text-green-800">{policy.labPracticalThreshold}%</span>
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
                        setAttendancePolicies(prev => prev.filter(p => p.id !== policy.id));
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
        )}

          {/* E6. Role & Permission Settings */}
          {activeTab === "roles" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Roles & Permission Settings</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Module access matrix with scope rules for department/program</p>
              </div>
              <button 
                onClick={() => setShowRoleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create Role</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {/* Role Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Total Roles</span>
                </div>
                <p className="text-lg font-bold text-blue-800 mt-1">{roles.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Avg Modules</span>
                </div>
                <p className="text-lg font-bold text-green-800 mt-1">
                  {Math.round(roles.reduce((sum, r) => sum + r.moduleAccess.length, 0) / roles.length)}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Dept Scoped</span>
                </div>
                <p className="text-lg font-bold text-purple-800 mt-1">
                  {roles.filter(r => r.scopeRules.some(s => s.type === "department")).length}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-900">Program Scoped</span>
                </div>
                <p className="text-lg font-bold text-amber-800 mt-1">
                  {roles.filter(r => r.scopeRules.some(s => s.type === "program")).length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {roles.map((role) => (
                <div key={role.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-lg sm:text-xl">{role.roleName}</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{role.moduleAccess.length}</span> modules • <span className="font-medium">{role.scopeRules.length}</span> scope rules
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Module Access
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {role.moduleAccess.map((module, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                          <p className="text-sm font-semibold text-blue-900 mb-1">{module.module}</p>
                          <div className="flex flex-wrap gap-1">
                            {module.permissions.map((perm, permIdx) => (
                              <span key={permIdx} className="text-xs font-medium px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Scope Rules
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {role.scopeRules.map((scope, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                          <span className="font-semibold">{scope.type}:</span>
                          <span>{scope.values.join(", ")}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditRole(role);
                        setShowRoleModal(true);
                      }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit Permissions
                    </button>
                    <button 
                      onClick={() => {
                        setRoles(prev => prev.filter(r => r.id !== role.id));
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E7. Subscription Settings */}
        {activeTab === "subscription" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <SubscriptionSettingsSection />
          </div>
        )}
        </div>

        {/* Modals */}
        <AcademicCalendarModal
          isOpen={showAcademicModal}
          onClose={() => {
            setShowAcademicModal(false);
            setEditAcademicCalendar(null);
          }}
          calendar={editAcademicCalendar}
          onSaved={handleSaveAcademicCalendar}
        />

        <SubjectModal
          isOpen={showSubjectModal}
          onClose={() => {
            setShowSubjectModal(false);
            setEditSubject(null);
          }}
          subject={editSubject}
          onSaved={handleSaveSubject}
        />

        <AssessmentTypeModal
          isOpen={showAssessmentModal}
          onClose={() => {
            setShowAssessmentModal(false);
            setEditAssessmentType(null);
          }}
          assessmentType={editAssessmentType}
          onSaved={handleSaveAssessmentType}
        />

        <GradingSystemModal
          isOpen={showGradingModal}
          onClose={() => {
            setShowGradingModal(false);
            setEditGradingSystem(null);
          }}
          grade={editGradingSystem}
          onSaved={handleSaveGradingSystem}
        />

        <AttendancePolicyModal
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false);
            setEditAttendancePolicy(null);
          }}
          policy={editAttendancePolicy}
          onSaved={handleSaveAttendancePolicy}
        />

        <RolePermissionModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setEditRole(null);
          }}
          role={editRole}
          onSaved={handleSaveRole}
        />
      </div>
    </div>
  );
};

export default Settings;
