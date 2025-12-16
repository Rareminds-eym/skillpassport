/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  ArrowPathIcon,
  CheckIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  InformationCircleIcon,
  LinkIcon,
  DocumentIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../common/SearchBar";
import { FileTextIcon } from "lucide-react";

/* ==============================
   TYPES & INTERFACES (College-adapted)
   ============================== */
interface ResourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface ResourceLink {
  id: string;
  title: string;
  url: string;
}

interface EvaluationCriteria {
  id: string;
  criterion: string;
  percentage: number;
}

// College-specific interfaces
interface Unit {
  id: string;
  name: string;
  code?: string;
  description: string;
  credits?: number;
  estimatedDuration?: number;
  durationUnit?: "hours" | "weeks";
}

interface LearningOutcome {
  id: string;
  unitId: string; // Changed from chapterId
  outcome: string;
  bloomLevel?: string;
  assessmentMappings: Array<{
    assessmentType: string;
    weightage?: number;
  }>;
}

interface LessonPlan {
  id: string;
  title: string;
  course: string; // Changed from subject
  department: string; // College-specific
  program: string; // College-specific
  semester: string; // Changed from class
  academicYear: string;
  sessionDate: string; // Changed from date
  unitId: string; // Changed from chapterId
  unitName: string; // Changed from chapterName
  duration?: string;
  selectedLearningOutcomes: string[];
  sessionObjectives: string; // Changed from learningObjectives
  teachingMethodology: string;
  requiredMaterials: string;
  resourceFiles: ResourceFile[];
  resourceLinks: ResourceLink[];
  evaluationCriteria: string;
  evaluationItems: EvaluationCriteria[];
  followUpActivities?: string; // Changed from homework
  additionalNotes?: string; // Changed from differentiationNotes
  status?: string;
}
/* ==============================
   STATS CARD COMPONENT
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
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
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MODAL WRAPPER COMPONENT
   ============================== */
const ModalWrapper = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  size = "2xl",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "lg" | "2xl" | "4xl";
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    lg: "max-w-lg",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}
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
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
/* ==============================
   LESSON PLAN CARD COMPONENT (College-adapted)
   ============================== */
const LessonPlanCard = ({
  plan,
  onEdit,
  onDuplicate,
  onView,
}: {
  plan: LessonPlan;
  onEdit: () => void;
  onDuplicate: () => void;
  onView: () => void;
}) => {
  return (
    <div className="group bg-white rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-indigo-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 mb-2">
            {plan.title}
          </h3>
          {/* Status Badge */}
          <div>
            {plan.status === 'published' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <CheckCircleIcon className="h-3 w-3" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                <DocumentIcon className="h-3 w-3" />
                Draft
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <button
            onClick={onView}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{plan.course}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sem {plan.semester}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {new Date(plan.sessionDate).toLocaleDateString()}
          </span>
        </div>
        {plan.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{plan.duration}</span>
          </div>
        )}
      </div>

      {/* Unit and Session Objectives Preview */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Unit:</p>
          <p className="text-sm font-semibold text-indigo-700">
            {plan.unitName}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Session Objectives:
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {plan.sessionObjectives}
          </p>
        </div>
      </div>
    </div>
  );
};
/* ==============================
   HELPER FUNCTIONS
   ============================== */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  
  if (extension && videoExtensions.includes(extension)) {
    return { icon: VideoCameraIcon, color: 'text-purple-600' };
  } else if (extension && imageExtensions.includes(extension)) {
    return { icon: PhotoIcon, color: 'text-green-600' };
  } else {
    return { icon: DocumentIcon, color: 'text-blue-600' };
  }
};

/* ==============================
   VIEW LESSON PLAN MODAL (College-adapted)
   ============================== */
const ViewLessonPlanModal = ({
  plan,
  isOpen,
  onClose,
}: {
  plan: LessonPlan | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!plan) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={plan.title}
      subtitle="Session Plan Details"
      size="4xl"
    >
      <div className="space-y-6">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Course</p>
            <p className="text-sm font-semibold text-gray-900">{plan.course}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Department</p>
            <p className="text-sm font-semibold text-gray-900">{plan.department}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Program</p>
            <p className="text-sm font-semibold text-gray-900">{plan.program}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Semester</p>
            <p className="text-sm font-semibold text-gray-900">Semester {plan.semester}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Session Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(plan.sessionDate).toLocaleDateString()}
            </p>
          </div>
          {plan.duration && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{plan.duration}</p>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs font-medium text-indigo-600 mb-1">
            Unit (from Curriculum)
          </p>
          <p className="text-sm font-semibold text-indigo-900">
            {plan.unitName}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
              Session Objectives
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.sessionObjectives}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-purple-600" />
              Teaching Methodology
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.teachingMethodology}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-blue-600" />
              Required Materials
            </h4>
            {plan.requiredMaterials && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {plan.requiredMaterials}
              </p>
            )}

            {/* Files */}
            {plan.resourceFiles && plan.resourceFiles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Attached Files:</p>
                <div className="space-y-2">
                  {plan.resourceFiles.map((file) => {
                    const { icon: FileIcon, color } = getFileIcon(file.name);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <FileIcon className={`h-5 w-5 ${color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            {plan.resourceLinks && plan.resourceLinks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Resource Links:</p>
                <div className="space-y-2">
                  {plan.resourceLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <LinkIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {link.title}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!plan.requiredMaterials &&
             (!plan.resourceFiles || plan.resourceFiles.length === 0) &&
             (!plan.resourceLinks || plan.resourceLinks.length === 0) && (
              <p className="text-sm text-gray-500 italic">No materials added</p>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              Evaluation Criteria
            </h4>

            {plan.evaluationCriteria && !plan.evaluationItems?.length && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {plan.evaluationCriteria}
              </p>
            )}

            {plan.evaluationItems && plan.evaluationItems.length > 0 && (
              <div className="space-y-2">
                {plan.evaluationItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-bold text-green-700">{index + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.criterion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className={`text-sm font-bold ${
                      plan.evaluationItems.reduce((sum, item) => sum + item.percentage, 0) === 100
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {plan.evaluationItems.reduce((sum, item) => sum + item.percentage, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!plan.evaluationCriteria && (!plan.evaluationItems || plan.evaluationItems.length === 0) && (
              <p className="text-sm text-gray-500 italic">No evaluation criteria added</p>
            )}
          </div>

          {/* Optional Fields */}
          {plan.followUpActivities && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <DocumentIcon className="h-4 w-4 text-amber-600" />
                Follow-up Activities
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.followUpActivities}
              </p>
            </div>
          )}

          {plan.additionalNotes && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="h-4 w-4 text-purple-600" />
                Additional Notes
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.additionalNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
/* ==============================
   PROPS INTERFACE (College-adapted)
   ============================== */
interface CollegeLessonPlanProps {
  // College-specific selections
  selectedCourse?: string;
  setSelectedCourse?: (value: string) => void;
  selectedDepartment?: string;
  setSelectedDepartment?: (value: string) => void;
  selectedProgram?: string;
  setSelectedProgram?: (value: string) => void;
  selectedSemester?: string;
  setSelectedSemester?: (value: string) => void;
  selectedAcademicYear?: string;
  setSelectedAcademicYear?: (value: string) => void;
  // Configuration data
  courses?: string[];
  departments?: string[];
  programs?: string[];
  semesters?: string[];
  academicYears?: string[];
  // Data
  lessonPlans?: LessonPlan[];
  units?: Unit[];
  learningOutcomes?: LearningOutcome[];
  saveStatus?: "idle" | "saving" | "saved";
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  // Handlers
  onAddLessonPlan?: (lessonPlan: LessonPlan) => Promise<void>;
  onDeleteLessonPlan?: (id: string) => Promise<void>;
  onPublishLessonPlan?: (id: string) => Promise<void>;
}

/* ==============================
   MAIN COMPONENT (College-adapted)
   ============================== */
const CollegeLessonPlanUI: React.FC<CollegeLessonPlanProps> = (props) => {
  // Configuration data - use props or fallback to defaults
  const courses = props.courses ?? [];
  const departments = props.departments ?? [];
  const programs = props.programs ?? [];
  const semesters = props.semesters ?? [];
  const academicYears = props.academicYears ?? [];
  const units = props.units ?? [];
  const learningOutcomes = props.learningOutcomes ?? [];

  // State - use props if provided, otherwise use local state
  const [localLessonPlans, localSetLessonPlans] = useState<LessonPlan[]>([]);
  const [localSearchQuery, localSetSearchQuery] = useState("");

  // Use props or local state
  const lessonPlans = props.lessonPlans ?? localLessonPlans;
  const setLessonPlans = localSetLessonPlans;
  const searchQuery = props.searchQuery ?? localSearchQuery;
  const setSearchQuery = props.setSearchQuery ?? localSetSearchQuery;
  const saveStatus = props.saveStatus ?? "idle";

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    department: "",
    program: "",
    semester: "",
    academicYear: "",
    sessionDate: "",
    unitId: "",
    sessionObjectives: "",
    teachingMethodology: "",
    requiredMaterials: "",
    evaluationCriteria: "",
    followUpActivities: "",
    additionalNotes: "",
  });

  const [selectedLearningOutcomes, setSelectedLearningOutcomes] = useState<string[]>([]);
  const [resourceFiles, setResourceFiles] = useState<ResourceFile[]>([]);
  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>([]);
  const [evaluationItems, setEvaluationItems] = useState<EvaluationCriteria[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter lesson plans
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lessonPlans.filter((plan) => {
      const matchesSearch =
        q === "" ||
        plan.title.toLowerCase().includes(q) ||
        plan.course.toLowerCase().includes(q);
      const matchesCourse =
        courseFilter === "" || plan.course === courseFilter;
      const matchesSemester =
        semesterFilter === "" || plan.semester === semesterFilter;
      const matchesAcademicYear =
        academicYearFilter === "" || plan.academicYear === academicYearFilter;
      return matchesSearch && matchesCourse && matchesSemester && matchesAcademicYear;
    });
  }, [lessonPlans, searchQuery, courseFilter, semesterFilter, academicYearFilter]);

  // Stats
  const stats = {
    total: lessonPlans.length,
    thisWeek: lessonPlans.filter((p) => {
      const planDate = new Date(p.sessionDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return planDate >= today && planDate <= weekFromNow;
    }).length,
    byCourse: courses.reduce((acc, course) => {
      acc[course] = lessonPlans.filter((p) => p.course === course).length;
      return acc;
    }, {} as Record<string, number>),
  };

  // Get available units for selected context
  const availableUnits = useMemo(() => {
    // In a real implementation, this would filter units based on selected course/department/program/semester
    return units;
  }, [units]);

  // Get learning outcomes for selected unit
  const availableLearningOutcomes = useMemo(() => {
    if (!formData.unitId) return [];
    return learningOutcomes.filter(lo => lo.unitId === formData.unitId);
  }, [learningOutcomes, formData.unitId]);

  // Get selected unit details
  const selectedUnit = useMemo(() => {
    if (!formData.unitId) return null;
    return availableUnits.find((unit: any) => unit.id === formData.unitId);
  }, [formData.unitId, availableUnits]);

  // Auto-fill duration when unit is selected
  useEffect(() => {
    if (selectedUnit && selectedUnit.estimatedDuration) {
      // Duration is auto-filled from unit, no need to set in formData
    }
  }, [selectedUnit]);
  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      course: "",
      department: "",
      program: "",
      semester: "",
      academicYear: "",
      sessionDate: "",
      unitId: "",
      sessionObjectives: "",
      teachingMethodology: "",
      requiredMaterials: "",
      evaluationCriteria: "",
      followUpActivities: "",
      additionalNotes: "",
    });
    setSelectedLearningOutcomes([]);
    setResourceFiles([]);
    setResourceLinks([]);
    setEvaluationItems([]);
    setErrors({});
    setEditingPlan(null);
  };

  // Note: File upload, links, and evaluation criteria handlers can be added later if needed

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!formData.title.trim()) {
      newErrors.title = "Session title is required";
    }
    if (!formData.course) {
      newErrors.course = "Please select a course";
    }
    if (!formData.department) {
      newErrors.department = "Please select a department";
    }
    if (!formData.program) {
      newErrors.program = "Please select a program";
    }
    if (!formData.semester) {
      newErrors.semester = "Please select a semester";
    }
    if (!formData.academicYear) {
      newErrors.academicYear = "Please select an academic year";
    }
    if (!formData.sessionDate) {
      newErrors.sessionDate = "Please select a date for the session";
    }
    
    // Curriculum-linked fields
    if (!formData.unitId) {
      newErrors.unitId = "Please select a unit from curriculum";
    }
    if (selectedLearningOutcomes.length === 0) {
      newErrors.learningOutcomes = "Please select at least one learning outcome";
    }
    
    // Content fields
    if (!formData.sessionObjectives.trim()) {
      newErrors.sessionObjectives = "Session Objectives are required";
    }
    if (!formData.teachingMethodology.trim()) {
      newErrors.teachingMethodology = "Teaching Methodology is required";
    }
    if (!formData.requiredMaterials.trim() && resourceFiles.length === 0 && resourceLinks.length === 0) {
      newErrors.requiredMaterials = "Please provide at least one material (text, file, or link)";
    }
    if (!formData.evaluationCriteria.trim() && evaluationItems.length === 0) {
      newErrors.evaluationCriteria = "Evaluation Criteria are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const unit = selectedUnit;
      const duration = unit?.estimatedDuration
        ? `${unit.estimatedDuration} ${unit.durationUnit}`
        : undefined;

      const submitData: LessonPlan = {
        id: editingPlan?.id || Date.now().toString(),
        ...formData,
        unitName: unit?.name || "",
        duration,
        selectedLearningOutcomes,
        resourceFiles,
        resourceLinks,
        evaluationItems,
        status,
      };

      if (props.onAddLessonPlan) {
        await props.onAddLessonPlan(submitData);
      } else {
        // Fallback to local state
        if (editingPlan) {
          setLessonPlans((prev) =>
            prev.map((p) => (p.id === editingPlan.id ? submitData : p))
          );
        } else {
          setLessonPlans((prev) => [submitData, ...prev]);
        }
      }

      resetForm();
      setShowEditor(false);
    } catch (error: any) {
      console.error("Error saving lesson plan:", error);
      alert("Error: " + (error.message || "Failed to save lesson plan"));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (plan: LessonPlan) => {
    setFormData({
      title: plan.title,
      course: plan.course,
      department: plan.department,
      program: plan.program,
      semester: plan.semester,
      academicYear: plan.academicYear,
      sessionDate: plan.sessionDate,
      unitId: plan.unitId || "",
      sessionObjectives: plan.sessionObjectives,
      teachingMethodology: plan.teachingMethodology,
      requiredMaterials: plan.requiredMaterials,
      evaluationCriteria: plan.evaluationCriteria,
      followUpActivities: plan.followUpActivities || "",
      additionalNotes: plan.additionalNotes || "",
    });
    setSelectedLearningOutcomes(plan.selectedLearningOutcomes || []);
    setResourceFiles(plan.resourceFiles || []);
    setResourceLinks(plan.resourceLinks || []);
    setEvaluationItems(plan.evaluationItems || []);
    setEditingPlan(plan);
    setShowEditor(true);
  };

  // Handle duplicate
  const handleDuplicate = (plan: LessonPlan) => {
    setFormData({
      title: `${plan.title} (Copy)`,
      course: plan.course,
      department: plan.department,
      program: plan.program,
      semester: plan.semester,
      academicYear: plan.academicYear,
      sessionDate: "",
      unitId: plan.unitId || "",
      sessionObjectives: plan.sessionObjectives,
      teachingMethodology: plan.teachingMethodology,
      requiredMaterials: plan.requiredMaterials,
      evaluationCriteria: plan.evaluationCriteria,
      followUpActivities: plan.followUpActivities || "",
      additionalNotes: plan.additionalNotes || "",
    });
    setSelectedLearningOutcomes(plan.selectedLearningOutcomes || []);
    setResourceFiles(plan.resourceFiles || []);
    setResourceLinks(plan.resourceLinks || []);
    setEvaluationItems(plan.evaluationItems || []);
    setEditingPlan(null);
    setShowEditor(true);
  };

  // Note: Delete and publish handlers are available via props but not used in current UI
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Auto-save indicator */}
      {saveStatus !== "idle" && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
              saveStatus === "saving"
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Saved
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
              <FileTextIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Session Plans
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage your teaching session plans
              </p>
            </div>
          </div>

          {!showEditor && (
            <button
              onClick={() => {
                resetForm();
                // Set current academic year as default
                setFormData(prev => ({ ...prev, academicYear: "2024-2025" }));
                setShowEditor(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <PlusCircleIcon className="h-5 w-5" />
              New Session Plan
            </button>
          )}
        </div>
      </div>

      {!showEditor ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatsCard
              label="Total Plans"
              value={stats.total}
              icon={FileTextIcon}
              color="blue"
            />
            <StatsCard
              label="This Week"
              value={stats.thisWeek}
              icon={CalendarIcon}
              color="purple"
            />
            <StatsCard
              label="Courses Covered"
              value={Object.keys(stats.byCourse).filter(c => stats.byCourse[c] > 0).length}
              icon={BookOpenIcon}
              color="green"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by title or course..."
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Semesters</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>

                <select
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(searchQuery || courseFilter || semesterFilter || academicYearFilter) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredPlans.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{lessonPlans.length}</span> session plans
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCourseFilter("");
                    setSemesterFilter("");
                    setAcademicYearFilter("");
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Session Plans Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                My Session Plans ({filteredPlans.length})
              </h2>
            </div>

            <div className="p-5">
              {filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FileTextIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {lessonPlans.length === 0
                      ? "No session plans yet"
                      : "No matching session plans"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {lessonPlans.length === 0
                      ? "Create your first session plan to get started with structured teaching"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                  {lessonPlans.length === 0 && (
                    <button
                      onClick={() => {
                        resetForm();
                        setShowEditor(true);
                      }}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      Create Your First Session Plan
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPlans.map((plan) => (
                    <LessonPlanCard
                      key={plan.id}
                      plan={plan}
                      onEdit={() => handleEdit(plan)}
                      onDuplicate={() => handleDuplicate(plan)}
                      onView={() => setViewingPlan(plan)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Editor Form - College-adapted */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPlan ? "Edit Session Plan" : "Create New Session Plan"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in all required fields for your teaching session
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditor(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Session Plan Requirements
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• All mandatory fields must be completed</li>
                    <li>• Link session plans to curriculum units for better tracking</li>
                    <li>• Evaluation criteria should align with session objectives</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-indigo-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.title ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                      placeholder="e.g., Introduction to Data Structures"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.academicYear}
                      onChange={(e) => {
                        setFormData({ ...formData, academicYear: e.target.value, unitId: "" });
                        setSelectedLearningOutcomes([]);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.academicYear ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors.academicYear && (
                      <p className="mt-1 text-xs text-red-600">{errors.academicYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.sessionDate}
                      onChange={(e) =>
                        setFormData({ ...formData, sessionDate: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.sessionDate ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    />
                    {errors.sessionDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.sessionDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* College Context */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-purple-600" />
                  College Context
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.department ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.program}
                      onChange={(e) =>
                        setFormData({ ...formData, program: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.program ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Program</option>
                      {programs.map((program) => (
                        <option key={program} value={program}>
                          {program}
                        </option>
                      ))}
                    </select>
                    {errors.program && (
                      <p className="mt-1 text-xs text-red-600">{errors.program}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.semester ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    {errors.semester && (
                      <p className="mt-1 text-xs text-red-600">{errors.semester}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.course ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                    {errors.course && (
                      <p className="mt-1 text-xs text-red-600">{errors.course}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Curriculum Link */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-green-600" />
                  Curriculum Link
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => {
                        setFormData({ ...formData, unitId: e.target.value });
                        setSelectedLearningOutcomes([]);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.unitId ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Choose a unit from curriculum</option>
                      {availableUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} {unit.credits && `(${unit.credits} credits)`}
                        </option>
                      ))}
                    </select>
                    {errors.unitId && (
                      <p className="mt-1 text-xs text-red-600">{errors.unitId}</p>
                    )}
                    {selectedUnit && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-800 mb-1">Selected Unit:</p>
                        <p className="text-sm text-green-700">{selectedUnit.description}</p>
                        {selectedUnit.estimatedDuration && (
                          <p className="text-xs text-green-600 mt-1">
                            Duration: {selectedUnit.estimatedDuration} {selectedUnit.durationUnit}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {availableLearningOutcomes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Outcomes <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableLearningOutcomes.map((outcome) => (
                          <label key={outcome.id} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedLearningOutcomes.includes(outcome.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLearningOutcomes([...selectedLearningOutcomes, outcome.id]);
                                } else {
                                  setSelectedLearningOutcomes(
                                    selectedLearningOutcomes.filter((id) => id !== outcome.id)
                                  );
                                }
                              }}
                              className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{outcome.outcome}</p>
                              {outcome.bloomLevel && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Bloom's Level: {outcome.bloomLevel}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.learningOutcomes && (
                        <p className="mt-1 text-xs text-red-600">{errors.learningOutcomes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Session Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentCheckIcon className="h-4 w-4 text-blue-600" />
                  Session Content
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Objectives <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.sessionObjectives}
                      onChange={(e) =>
                        setFormData({ ...formData, sessionObjectives: e.target.value })
                      }
                      rows={4}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.sessionObjectives ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                      placeholder="What should students achieve by the end of this session?"
                    />
                    {errors.sessionObjectives && (
                      <p className="mt-1 text-xs text-red-600">{errors.sessionObjectives}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Methodology <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.teachingMethodology}
                      onChange={(e) =>
                        setFormData({ ...formData, teachingMethodology: e.target.value })
                      }
                      rows={4}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.teachingMethodology ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                      placeholder="How will you teach this session? (lecture, discussion, hands-on, etc.)"
                    />
                    {errors.teachingMethodology && (
                      <p className="mt-1 text-xs text-red-600">{errors.teachingMethodology}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Required Materials */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-blue-600" />
                  Required Materials
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.requiredMaterials}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredMaterials: e.target.value })
                      }
                      rows={3}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.requiredMaterials ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                      placeholder="List the materials, resources, or equipment needed for this session"
                    />
                    {errors.requiredMaterials && (
                      <p className="mt-1 text-xs text-red-600">{errors.requiredMaterials}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Evaluation Criteria */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  Evaluation Criteria
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.evaluationCriteria}
                      onChange={(e) =>
                        setFormData({ ...formData, evaluationCriteria: e.target.value })
                      }
                      rows={3}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.evaluationCriteria ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                      placeholder="How will you assess student understanding and participation?"
                    />
                    {errors.evaluationCriteria && (
                      <p className="mt-1 text-xs text-red-600">{errors.evaluationCriteria}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4 text-purple-600" />
                  Additional Information (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Activities
                    </label>
                    <textarea
                      value={formData.followUpActivities}
                      onChange={(e) =>
                        setFormData({ ...formData, followUpActivities: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      placeholder="Any assignments, readings, or activities for students to complete after this session"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.additionalNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, additionalNotes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      placeholder="Any special notes, accommodations, or reminders for this session"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <DocumentIcon className="h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSubmit('published')}
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Publish Session Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <ViewLessonPlanModal
        plan={viewingPlan}
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
      />
    </div>
  );
};

export default CollegeLessonPlanUI;