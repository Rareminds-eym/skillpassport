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
  TrashIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../common/SearchBar";
import Pagination from "../Pagination";
import { FileTextIcon } from "lucide-react";
import { uploadFile, validateFile, deleteFile, getDocumentUrl } from "../../../services/fileUploadService";
import type { CollegeLessonPlan } from "../../../services/college/lessonPlanService";

/* ==============================
   TYPES & INTERFACES (College-adapted)
   ============================== */
interface ResourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  tempFile?: File; // For temporary files before upload
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
  plan: CollegeLessonPlan;
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
          <span className="truncate">
            {getPlanProperty(plan, 'courseName') || getPlanProperty(plan, 'course')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sem {plan.semester}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {plan.session_date ? new Date(plan.session_date).toLocaleDateString() : 'No date'}
          </span>
        </div>
        {plan.duration_minutes && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {`${plan.duration_minutes} min`}
            </span>
          </div>
        )}
      </div>

      {/* Unit and Session Objectives Preview */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Unit:</p>
          <p className="text-sm font-semibold text-indigo-700">
            {plan.unit_name || 'No unit selected'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Session Objectives:
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {plan.session_objectives}
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

// Helper function to safely access plan properties (handles both camelCase and snake_case)
const getPlanProperty = (plan: CollegeLessonPlan, property: string): any => {
  // Map of camelCase to snake_case properties
  const propertyMap: Record<string, string> = {
    'course': 'course_id',
    'courseName': 'course_name',
    'department': 'department_id',
    'departmentName': 'department_name',
    'program': 'program_id',
    'programName': 'program_name',
    'academicYear': 'academic_year',
    'sessionDate': 'session_date',
    'unitId': 'unit_id',
    'unitName': 'unit_name',
    'sessionObjectives': 'session_objectives',
    'teachingMethodology': 'teaching_methodology',
    'requiredMaterials': 'required_materials',
    'resourceFiles': 'resource_files',
    'resourceLinks': 'resource_links',
    'evaluationCriteria': 'evaluation_criteria',
    'evaluationItems': 'evaluation_items',
    'selectedLearningOutcomes': 'selected_learning_outcomes',
    'followUpActivities': 'follow_up_activities',
    'additionalNotes': 'additional_notes',
  };

  const snakeCase = propertyMap[property] || property;
  return (plan as any)[property] || (plan as any)[snakeCase];
};

/* ==============================
   VIEW LESSON PLAN MODAL (College-adapted)
   ============================== */
const ViewLessonPlanModal = ({
  plan,
  isOpen,
  onClose,
}: {
  plan: CollegeLessonPlan | null;
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
            <p className="text-sm font-semibold text-gray-900">
              {plan.course_name || 'No course'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Department</p>
            <p className="text-sm font-semibold text-gray-900">
              {plan.department_name || 'No department'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Program</p>
            <p className="text-sm font-semibold text-gray-900">
              {plan.program_name || 'No program'}
            </p>
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
              {plan.session_date ? new Date(plan.session_date).toLocaleDateString() : 'No date'}
            </p>
          </div>
          {plan.duration_minutes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Duration</p>
              <p className="text-sm font-semibold text-gray-900">
                {`${plan.duration_minutes} min`}
              </p>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs font-medium text-indigo-600 mb-1">
            Unit (from Curriculum)
          </p>
          <p className="text-sm font-semibold text-indigo-900">
            {plan.unit_name || 'No unit selected'}
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
              {plan.session_objectives}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-purple-600" />
              Teaching Methodology
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.teaching_methodology}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-blue-600" />
              Required Materials
            </h4>
            {plan.required_materials && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {plan.required_materials}
              </p>
            )}

            {/* Files */}
            {plan.resource_files && plan.resource_files.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Attached Files:</p>
                <div className="space-y-2">
                  {plan.resource_files.map((file) => {
                    const { icon: FileIcon, color } = getFileIcon(file.name);
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(
                      file.name.split('.').pop()?.toLowerCase() || ''
                    );
                    const isVideo = ['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'].includes(
                      file.name.split('.').pop()?.toLowerCase() || ''
                    );
                    
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <FileIcon className={`h-6 w-6 ${color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                            {isImage && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Image
                              </span>
                            )}
                            {isVideo && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Video
                              </span>
                            )}
                          </div>
                        </div>
                        {file.url && (
                          <div className="flex items-center gap-1">
                            <a
                              href={getDocumentUrl(file.url, 'inline')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View file"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </a>
                            <a
                              href={getDocumentUrl(file.url, 'download')}
                              download={file.name}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Download file"
                            >
                              <ArrowUpTrayIcon className="h-4 w-4 rotate-180" />
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            {plan.resource_links && plan.resource_links.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Resource Links:</p>
                <div className="space-y-2">
                  {plan.resource_links.map((link) => (
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

            {!plan.required_materials &&
             (!plan.resource_files || plan.resource_files.length === 0) &&
             (!plan.resource_links || plan.resource_links.length === 0) && (
              <p className="text-sm text-gray-500 italic">No materials added</p>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              Evaluation Criteria
            </h4>

            {plan.evaluation_criteria && !plan.evaluation_items?.length && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {plan.evaluation_criteria}
              </p>
            )}

            {plan.evaluation_items && plan.evaluation_items.length > 0 && (
              <div className="space-y-2">
                {plan.evaluation_items.map((item, index) => (
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
                      plan.evaluation_items.reduce((sum, item) => sum + item.percentage, 0) === 100
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {plan.evaluation_items.reduce((sum, item) => sum + item.percentage, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!plan.evaluation_criteria && (!plan.evaluation_items || plan.evaluation_items.length === 0) && (
              <p className="text-sm text-gray-500 italic">No evaluation criteria added</p>
            )}
          </div>

          {/* Optional Fields */}
          {plan.follow_up_activities && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <DocumentIcon className="h-4 w-4 text-amber-600" />
                Follow-up Activities
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.follow_up_activities}
              </p>
            </div>
          )}

          {plan.additional_notes && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="h-4 w-4 text-purple-600" />
                Additional Notes
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.additional_notes}
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
  courses?: any[];
  departments?: any[];
  programs?: any[];
  semesters?: string[];
  academicYears?: string[];
  // Data
  lessonPlans?: CollegeLessonPlan[];
  units?: Unit[];
  learningOutcomes?: LearningOutcome[];
  saveStatus?: "idle" | "saving" | "saved";
  loading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  // Handlers
  onAddLessonPlan?: (lessonPlan: CollegeLessonPlan) => Promise<void>;
  onDeleteLessonPlan?: (id: string) => Promise<void>;
  onPublishLessonPlan?: (id: string) => Promise<void>;
  // Dynamic handlers for form
  onDepartmentChange?: (departmentId: string) => Promise<{ programs: any[]; courses: any[]; }>;
  onProgramChange?: (programId: string) => Promise<{ semesters: string[]; courses: any[]; }>;
  onSemesterChange?: (semester: string, programId: string) => Promise<{ courses: any[]; }>;
  onCurriculumContextChange?: (courseId: string, programId: string, academicYear: string) => Promise<void>;
  onUnitChange?: (unitId: string) => Promise<void>;
}

/* ==============================
   MAIN COMPONENT (College-adapted)
   ============================== */
const CollegeLessonPlanUI: React.FC<CollegeLessonPlanProps> = (props) => {
  // Configuration data - use props or fallback to defaults
  const courses = props.courses ?? [];
  const departments = props.departments ?? [];
  const semesters = props.semesters ?? [];
  const academicYears = props.academicYears ?? [];
  const units = props.units ?? [];
  const learningOutcomes = props.learningOutcomes ?? [];
  const loading = props.loading ?? false;

  // State - use props if provided, otherwise use local state
  const [localLessonPlans, localSetLessonPlans] = useState<CollegeLessonPlan[]>([]);
  const [localSearchQuery, localSetSearchQuery] = useState("");

  const lessonPlans = props.lessonPlans ?? localLessonPlans;
  const setLessonPlans = localSetLessonPlans;
  const searchQuery = props.searchQuery ?? localSearchQuery;
  const setSearchQuery = props.setSearchQuery ?? localSetSearchQuery;
  const saveStatus = props.saveStatus ?? "idle";

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CollegeLessonPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<CollegeLessonPlan | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [programFilter, setProgramFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 lesson plans per page

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
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Form-specific state for dynamic loading
  const [formPrograms, setFormPrograms] = useState<any[]>([]);
  const [formCourses, setFormCourses] = useState<any[]>([]);
  const [formUnits, setFormUnits] = useState<any[]>([]);
  const [formLearningOutcomes, setFormLearningOutcomes] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false); // New loading state for edit

  // Generate filter options from actual lesson plans data
  const filterOptions = useMemo(() => {
    const coursesMap = new Map<string, {id: string, name: string, code: string}>();
    const departmentsMap = new Map<string, {id: string, name: string}>();
    const programsMap = new Map<string, {id: string, name: string}>();
    const semestersSet = new Set<number>();
    const academicYearsSet = new Set<string>();
    const statusesSet = new Set<string>();

    lessonPlans.forEach((plan) => {
      // Handle different possible data structures
      const courseId = plan.course_id;
      const courseName = plan.course_name || plan.course?.course_name;
      const courseCode = plan.course_code || plan.course?.course_code;
      
      const departmentId = plan.department_id;
      const departmentName = plan.department_name || plan.department?.name;
      
      const programId = plan.program_id;
      const programName = plan.program_name || plan.program?.name;
      
      // Courses
      if (courseId && courseName) {
        coursesMap.set(courseId, {
          id: courseId,
          name: courseName,
          code: courseCode || ''
        });
      }
      
      // Departments
      if (departmentId && departmentName) {
        departmentsMap.set(departmentId, {
          id: departmentId,
          name: departmentName
        });
      }
      
      // Programs
      if (programId && programName) {
        programsMap.set(programId, {
          id: programId,
          name: programName
        });
      }
      
      // Semesters
      if (plan.semester) {
        semestersSet.add(plan.semester);
      }
      
      // Academic Years
      if (plan.academic_year) {
        academicYearsSet.add(plan.academic_year);
      }
      
      // Status
      if (plan.status) {
        statusesSet.add(plan.status);
      }
    });

    // Fallback to props data if lesson plans don't have joined data
    const fallbackCourses = Array.isArray(courses) ? courses.map(c => ({
      id: c.id,
      name: c.course_name || c.name || 'Unknown Course',
      code: c.course_code || c.code || ''
    })) : [];
    
    const fallbackDepartments = Array.isArray(departments) ? departments.map(d => ({
      id: d.id,
      name: d.name || 'Unknown Department'
    })) : [];

    return {
      courses: coursesMap.size > 0 ? Array.from(coursesMap.values()).sort((a, b) => a.name.localeCompare(b.name)) : fallbackCourses,
      departments: departmentsMap.size > 0 ? Array.from(departmentsMap.values()).sort((a, b) => a.name.localeCompare(b.name)) : fallbackDepartments,
      programs: Array.from(programsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      semesters: Array.from(semestersSet).sort((a, b) => a - b),
      academicYears: Array.from(academicYearsSet).sort().reverse(), // Most recent first
      statuses: Array.from(statusesSet).sort()
    };
  }, [lessonPlans, courses, departments]);

  // Filter lesson plans
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lessonPlans.filter((plan) => {
      const matchesSearch =
        q === "" ||
        plan.title.toLowerCase().includes(q) ||
        (plan.course_name || '').toLowerCase().includes(q) ||
        (plan.department_name || '').toLowerCase().includes(q) ||
        (plan.program_name || '').toLowerCase().includes(q);
        
      const matchesCourse =
        courseFilter === "" || plan.course_id === courseFilter;
        
      const matchesDepartment =
        departmentFilter === "" || plan.department_id === departmentFilter;
        
      const matchesProgram =
        programFilter === "" || plan.program_id === programFilter;
        
      const matchesSemester =
        semesterFilter === "" || plan.semester?.toString() === semesterFilter;
        
      const matchesAcademicYear =
        academicYearFilter === "" || plan.academic_year === academicYearFilter;
        
      const matchesStatus =
        statusFilter === "" || plan.status === statusFilter;
        
      return matchesSearch && matchesCourse && matchesDepartment && 
             matchesProgram && matchesSemester && matchesAcademicYear && matchesStatus;
    });
  }, [lessonPlans, searchQuery, courseFilter, departmentFilter, programFilter, 
      semesterFilter, academicYearFilter, statusFilter]);

  // Paginated plans
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPlans.slice(startIndex, endIndex);
  }, [filteredPlans, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, departmentFilter, programFilter, semesterFilter, academicYearFilter, statusFilter]);

  // Stats
  const stats = {
    total: lessonPlans.length,
    thisWeek: lessonPlans.filter((p) => {
      const sessionDate = p.session_date;
      if (!sessionDate) return false;
      const planDate = new Date(sessionDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return planDate >= today && planDate <= weekFromNow;
    }).length,
    published: lessonPlans.filter(p => p.status === 'published').length,
    draft: lessonPlans.filter(p => p.status === 'draft').length,
    byCourse: filterOptions.courses.reduce((acc, course) => {
      acc[course.id] = lessonPlans.filter(p => p.course_id === course.id).length;
      return acc;
    }, {} as Record<string, number>),
  };

  // Get available units for selected context (use form-specific units)
  const availableUnits = useMemo(() => {
    return formUnits;
  }, [formUnits]);

  // Get learning outcomes for selected unit (use form-specific outcomes)
  const availableLearningOutcomes = useMemo(() => {
    if (!formData.unitId) return [];
    
    // First try to get from formLearningOutcomes (form-specific)
    let outcomes = formLearningOutcomes.filter(lo => 
      (lo as any).unit_id === formData.unitId || lo.unitId === formData.unitId
    );
    
    // If not found in formLearningOutcomes, try from props learningOutcomes (fallback)
    if (outcomes.length === 0 && learningOutcomes.length > 0) {
      outcomes = learningOutcomes.filter(lo => 
        (lo as any).unit_id === formData.unitId || lo.unitId === formData.unitId
      );
    }
    
    return outcomes;
  }, [formLearningOutcomes, learningOutcomes, formData.unitId]);

  // Get selected unit details
  const selectedUnit = useMemo(() => {
    if (!formData.unitId) return null;
    
    // First try to find in formUnits (form-specific units)
    let unit = availableUnits.find((unit: any) => unit.id === formData.unitId);
    
    // If not found in formUnits, try to find in the props units (fallback)
    if (!unit && units.length > 0) {
      unit = units.find((unit: any) => unit.id === formData.unitId);
    }
    
    return unit || null;
  }, [formData.unitId, availableUnits, units]);

  // Handle department change in form
  const handleFormDepartmentChange = async (departmentId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      department: departmentId, 
      program: "", 
      course: "",
      unitId: "" 
    }));
    setSelectedLearningOutcomes([]);
    setFormUnits([]);
    setFormLearningOutcomes([]);
    
    if (departmentId && props.onDepartmentChange) {
      setLoadingPrograms(true);
      setLoadingCourses(true);
      try {
        const result = await props.onDepartmentChange(departmentId);
        if (result) {
          setFormPrograms(result.programs);
          setFormCourses(result.courses);
        }
      } catch (error) {
        console.error('Error loading programs/courses:', error);
        setFormPrograms([]);
        setFormCourses([]);
      } finally {
        setLoadingPrograms(false);
        setLoadingCourses(false);
      }
    } else {
      setFormPrograms([]);
      setFormCourses([]);
    }
  };

  // Handle program change in form
  const handleFormProgramChange = async (programId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      program: programId, 
      course: "",
      semester: "", // Reset semester when program changes
      unitId: "" 
    }));
    setSelectedLearningOutcomes([]);
    setFormUnits([]);
    setFormLearningOutcomes([]);
    
    if (programId && props.onProgramChange) {
      setLoadingCourses(true);
      try {
        const result = await props.onProgramChange(programId);
        if (result) {
          setFormCourses(result.courses);
        }
      } catch (error) {
        console.error('Error in onProgramChange:', error);
      } finally {
        setLoadingCourses(false);
      }
    }
  };

  // Handle semester change in form
  const handleFormSemesterChange = async (semester: string) => {
    setFormData(prev => ({ 
      ...prev, 
      semester: semester,
      course: "", // Reset course when semester changes
      unitId: "" 
    }));
    setSelectedLearningOutcomes([]);
    setFormUnits([]);
    setFormLearningOutcomes([]);
    
    if (semester && formData.program && props.onSemesterChange) {
      setLoadingCourses(true);
      try {
        const result = await props.onSemesterChange(semester, formData.program);
        if (result) {
          setFormCourses(result.courses);
        }
      } catch (error) {
        console.error('Error loading courses for semester:', error);
        setFormCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
  };

  // Handle curriculum context change (course + program + academic year)
  const handleCurriculumContextChange = async () => {
    const { course, program, academicYear } = formData;
    
    if (course && program && academicYear && props.onCurriculumContextChange) {
      setLoadingUnits(true);
      
      // Only reset unitId if we're not in edit mode or if the unit is not already set
      if (!loadingEdit && !editingPlan) {
        setFormData(prev => ({ ...prev, unitId: "" }));
        setSelectedLearningOutcomes([]);
      }
      
      try {
        await props.onCurriculumContextChange(course, program, academicYear);
        // useEffect will handle updating formUnits when units prop changes
      } catch (error) {
        console.error('Error loading curriculum data:', error);
        setFormUnits([]);
        setFormLearningOutcomes([]);
      } finally {
        setLoadingUnits(false);
      }
    } else {
      setFormUnits([]);
      setFormLearningOutcomes([]);
    }
  };

  // Handle unit selection change to load learning outcomes
  const handleUnitChange = async (unitId: string) => {
    setFormData(prev => ({ ...prev, unitId }));
    setSelectedLearningOutcomes([]);
    
    if (unitId && props.onUnitChange) {
      try {
        await props.onUnitChange(unitId);
        // No need for setTimeout - useEffect will handle the prop updates
      } catch (error) {
        console.error('Error loading learning outcomes for unit:', error);
      }
    } else {
      // Clear learning outcomes when no unit is selected
      setFormLearningOutcomes([]);
    }
  };

  // Update form units when props change
  useEffect(() => {
    if (units && units.length > 0) {
      setFormUnits(units);
    } else {
      setFormUnits([]);
    }
  }, [units]);

  // Update form learning outcomes when props change and we have a selected unit
  useEffect(() => {
    if (formData.unitId && learningOutcomes && learningOutcomes.length > 0) {
      // Filter learning outcomes for the selected unit (try both unitId and unit_id)
      const unitOutcomes = learningOutcomes.filter(lo => 
        (lo as any).unit_id === formData.unitId || lo.unitId === formData.unitId
      );
      setFormLearningOutcomes(unitOutcomes);
    } else if (!formData.unitId) {
      // Clear learning outcomes when no unit is selected
      setFormLearningOutcomes([]);
    }
  }, [learningOutcomes, formData.unitId]);

  // Update form units and outcomes when props change (for editor mode)
  useEffect(() => {
    if (showEditor) {
      // Update form units when units prop changes
      if (units && units.length > 0) {
        setFormUnits(units);
      }
      
      // Update form learning outcomes when learningOutcomes prop changes and we have a unit selected
      if (formData.unitId && learningOutcomes && learningOutcomes.length > 0) {
        const unitOutcomes = learningOutcomes.filter(lo => 
          (lo as any).unit_id === formData.unitId || lo.unitId === formData.unitId
        );
        setFormLearningOutcomes(unitOutcomes);
      }
    }
  }, [units, learningOutcomes, showEditor, formData.unitId]);

  // Initialize form data when opening editor (only once)
  useEffect(() => {
    if (showEditor) {
      // Initialize form courses with all available courses
      setFormCourses(courses);
      // Only reset programs if we don't have a department selected
      if (!formData.department) {
        setFormPrograms([]);
      }
      setFormUnits([]);
      setFormLearningOutcomes([]);
    }
  }, [showEditor]); // Remove courses dependency to prevent reset when courses change

  // Separate effect to update courses when they change (but don't reset programs)
  useEffect(() => {
    if (showEditor && !formData.department) {
      // Only update courses if no department is selected
      setFormCourses(courses);
    }
  }, [courses, showEditor, formData.department]);

  // Trigger curriculum context change when relevant fields change (but not during edit)
  useEffect(() => {
    if (formData.course && formData.program && formData.academicYear && !loadingEdit) {
      handleCurriculumContextChange();
    }
  }, [formData.course, formData.program, formData.academicYear, loadingEdit]);

  // Auto-fill duration when unit is selected
  useEffect(() => {
    if (selectedUnit && selectedUnit.estimatedDuration) {
      // Duration is auto-filled from unit, no need to set in formData
    }
  }, [selectedUnit]);

  // Handle file upload with temporary storage (only upload to R2 when saving)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newTempFiles: ResourceFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        const validation = validateFile(file, {
          maxSize: 50, // 50MB max
          allowedTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm']
        });

        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          continue;
        }

        // Create temporary file object (no upload yet)
        const fileId = `temp_${Date.now()}_${i}`;
        const tempFile: ResourceFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          // Store the actual File object temporarily for later upload
          tempFile: file,
          // No URL yet - will be set after upload during save
        };
        
        newTempFiles.push(tempFile);
      }

      // Add temporary files to the list (no R2 upload yet)
      if (newTempFiles.length > 0) {
        setResourceFiles(prev => [...prev, ...newTempFiles]);
      }

    } catch (error) {
      console.error('File preparation error:', error);
      alert('Error preparing files. Please try again.');
    } finally {
      setUploadingFiles(false);
      e.target.value = ""; // Reset input
    }
  };

  // Upload temporary files to R2 storage (called during save)
  const uploadTemporaryFiles = async (tempFiles: ResourceFile[]): Promise<ResourceFile[]> => {
    const uploadedFiles: ResourceFile[] = [];
    
    for (const tempFile of tempFiles) {
      if (tempFile.tempFile) {
        // This is a temporary file that needs to be uploaded
        try {
          const uploadResult = await uploadFile(
            tempFile.tempFile,
            'college-lesson-plans'
          );
          
          if (uploadResult.success && uploadResult.url) {
            uploadedFiles.push({
              id: tempFile.id,
              name: tempFile.name,
              size: tempFile.size,
              type: tempFile.type,
              url: uploadResult.url,
              // Remove tempFile reference after upload
            });
          } else {
            // Skip this file but continue with others
          }
        } catch (error) {
          console.error(`Error uploading ${tempFile.name}:`, error);
          // Skip this file but continue with others
        }
      } else {
        // This file was already uploaded (editing existing lesson plan)
        uploadedFiles.push(tempFile);
      }
    }
    
    return uploadedFiles;
  };

  // Remove file (delete from R2 only if it was already uploaded)
  const handleRemoveFile = async (fileId: string) => {
    const fileToRemove = resourceFiles.find(f => f.id === fileId);
    if (fileToRemove?.url) {
      // File was already uploaded to R2, delete it
      try {
        await deleteFile(fileToRemove.url);
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        // Continue with removal from UI even if storage deletion fails
      }
    }
    // Remove from UI (works for both temporary and uploaded files)
    setResourceFiles(resourceFiles.filter((f) => f.id !== fileId));
  };

  // Clean up temporary files when canceling
  const cleanupTemporaryFiles = () => {
    // No need to delete from R2 since temporary files aren't uploaded yet
    // Just clear the state
    setResourceFiles([]);
  };

  // Reset form
  const resetForm = () => {
    // Clean up any temporary files first
    cleanupTemporaryFiles();
    
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
    // Reset form-specific state
    setFormPrograms([]);
    setFormCourses([]);
    setFormUnits([]);
    setFormLearningOutcomes([]);
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
    } else {
      // Validate that the date is not in the past (optional - can be removed if past dates are allowed)
      const selectedDate = new Date(formData.sessionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.sessionDate = "Please enter a valid date";
      }
      // Uncomment the following lines if you want to prevent past dates
      // else if (selectedDate < today) {
      //   newErrors.sessionDate = "Session date cannot be in the past";
      // }
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
      // Materials are optional now - remove this validation
      // newErrors.requiredMaterials = "Please provide at least one material (text, file, or link)";
    }
    if (!formData.evaluationCriteria.trim() && evaluationItems.length === 0) {
      // Evaluation criteria are optional now - remove this validation
      // newErrors.evaluationCriteria = "Evaluation Criteria are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    if (!validateForm()) {
      return;
    }

    // Additional validation before submission
    if (!formData.sessionDate || formData.sessionDate.trim() === '') {
      setErrors(prev => ({ ...prev, sessionDate: "Session date is required" }));
      return;
    }

    setSubmitting(true);

    try {
      // Upload temporary files to R2 storage before saving
      const uploadedFiles = await uploadTemporaryFiles(resourceFiles);
      
      const unit = selectedUnit;

      const submitData: CollegeLessonPlan = {
        id: editingPlan?.id || Date.now().toString(),
        title: formData.title.trim(),
        session_date: formData.sessionDate, // This should be in YYYY-MM-DD format from date input
        duration_minutes: unit?.estimatedDuration ? parseInt(unit.estimatedDuration.toString()) : undefined,
        department_id: formData.department,
        program_id: formData.program,
        course_id: formData.course,
        semester: parseInt(formData.semester),
        academic_year: formData.academicYear,
        unit_id: formData.unitId,
        selected_learning_outcomes: selectedLearningOutcomes,
        session_objectives: formData.sessionObjectives.trim(),
        teaching_methodology: formData.teachingMethodology.trim(),
        required_materials: formData.requiredMaterials.trim(),
        resource_files: uploadedFiles, // Use uploaded files with R2 URLs
        resource_links: resourceLinks,
        evaluation_criteria: formData.evaluationCriteria.trim(),
        evaluation_items: evaluationItems,
        follow_up_activities: formData.followUpActivities.trim(),
        additional_notes: formData.additionalNotes.trim(),
        status: status,
        metadata: {},
        // Required database fields - these will be set by the service layer
        college_id: editingPlan?.college_id || '',
        created_by: editingPlan?.created_by || '',
        created_at: editingPlan?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (props.onAddLessonPlan) {
        await props.onAddLessonPlan(submitData);
      } else {
        // Fallback to local state
        if (editingPlan) {
          setLessonPlans((prev) =>
            prev.map((p) => (p.id === editingPlan.id ? { ...submitData } : p))
          );
        } else {
          setLessonPlans((prev) => [{ ...submitData }, ...prev]);
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
  const handleEdit = async (plan: CollegeLessonPlan) => {
    setLoadingEdit(true);
    
    try {
      // Extract IDs directly from the database fields (snake_case)
      const deptId = plan.department_id;
      const programId = plan.program_id;
      const courseId = plan.course_id;
      const unitId = plan.unit_id;
      const semester = plan.semester?.toString() || '';
      const academicYear = plan.academic_year;
      
      // Set basic form data first using direct database fields
      setFormData({
        title: plan.title,
        course: courseId || '',
        department: deptId || '',
        program: programId || '',
        semester: semester,
        academicYear: academicYear || '',
        sessionDate: plan.session_date || '',
        unitId: unitId || '',
        sessionObjectives: plan.session_objectives || '',
        teachingMethodology: plan.teaching_methodology || '',
        requiredMaterials: plan.required_materials || '',
        evaluationCriteria: plan.evaluation_criteria || '',
        followUpActivities: plan.follow_up_activities || '',
        additionalNotes: plan.additional_notes || '',
      });
      
      // Set other form state using direct database fields
      setSelectedLearningOutcomes(plan.selected_learning_outcomes || []);
      setResourceFiles(plan.resource_files || []);
      setResourceLinks(plan.resource_links || []);
      setEvaluationItems(plan.evaluation_items || []);
      setEditingPlan(plan);
      
      // Show editor first
      setShowEditor(true);
      
      // Small delay to ensure form data is set and UI is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now load dependent data in sequence
      
      // 1. Load programs for the department
      if (deptId && props.onDepartmentChange) {
        const deptResult = await props.onDepartmentChange(deptId);
        if (deptResult) {
          setFormPrograms(deptResult.programs);
        }
      }
      
      // 2. Load semesters and courses for the program
      if (programId && props.onProgramChange) {
        await props.onProgramChange(programId);
      }
      
      // 3. Load courses for the program and semester
      if (programId && semester && props.onSemesterChange) {
        const semesterResult = await props.onSemesterChange(semester, programId);
        if (semesterResult) {
          setFormCourses(semesterResult.courses);
        }
      }
      
      // 4. Load curriculum units for the course/program/academic year
      if (courseId && programId && academicYear && props.onCurriculumContextChange) {
        await props.onCurriculumContextChange(courseId, programId, academicYear);
        // useEffect will handle updating formUnits when units prop changes
      }
      
      // 5. Load learning outcomes for the unit (if not already loaded)
      if (unitId && props.onUnitChange) {
        await props.onUnitChange(unitId);
        // useEffect will handle updating formLearningOutcomes when learningOutcomes prop changes
      }
      
    } catch (error) {
      console.error('Error loading dependent data for edit:', error);
    } finally {
      setLoadingEdit(false);
    }
  };

  // Handle duplicate
  const handleDuplicate = async (plan: CollegeLessonPlan) => {
    try {
      // Extract IDs directly from the database fields (snake_case)
      const deptId = plan.department_id;
      const programId = plan.program_id;
      const courseId = plan.course_id;
      const unitId = plan.unit_id;
      const semester = plan.semester?.toString() || '';
      const academicYear = plan.academic_year;
      
      // Set basic form data first (with copy title and empty date)
      setFormData({
        title: `${plan.title} (Copy)`,
        course: courseId || '',
        department: deptId || '',
        program: programId || '',
        semester: semester,
        academicYear: academicYear || '',
        sessionDate: '', // Empty for new session
        unitId: unitId || '',
        sessionObjectives: plan.session_objectives || '',
        teachingMethodology: plan.teaching_methodology || '',
        requiredMaterials: plan.required_materials || '',
        evaluationCriteria: plan.evaluation_criteria || '',
        followUpActivities: plan.follow_up_activities || '',
        additionalNotes: plan.additional_notes || '',
      });
      
      // Set other form state using direct database fields
      setSelectedLearningOutcomes(plan.selected_learning_outcomes || []);
      setResourceFiles(plan.resource_files || []);
      setResourceLinks(plan.resource_links || []);
      setEvaluationItems(plan.evaluation_items || []);
      setEditingPlan(null); // Not editing, duplicating
      
      // Show editor first
      setShowEditor(true);
      
      // Small delay to ensure form data is set and UI is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load all dependent data in sequence (same as edit)
      if (deptId && props.onDepartmentChange) {
        const deptResult = await props.onDepartmentChange(deptId);
        if (deptResult) {
          setFormPrograms(deptResult.programs);
        }
      }
      
      if (programId && props.onProgramChange) {
        await props.onProgramChange(programId);
      }
      
      if (programId && semester && props.onSemesterChange) {
        const semesterResult = await props.onSemesterChange(semester, programId);
        if (semesterResult) {
          setFormCourses(semesterResult.courses);
        }
      }
      
      if (courseId && programId && academicYear && props.onCurriculumContextChange) {
        await props.onCurriculumContextChange(courseId, programId, academicYear);
        // useEffect will handle updating formUnits when units prop changes
      }
      
      if (unitId && props.onUnitChange) {
        await props.onUnitChange(unitId);
        // useEffect will handle updating formLearningOutcomes when learningOutcomes prop changes
      }
      
    } catch (error) {
      console.error('Error loading dependent data for duplicate:', error);
    }
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
                // Set current academic year as default (2025-2026)
                const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
                setFormData(prev => ({ 
                  ...prev, 
                  academicYear: "2025-2026",
                  sessionDate: today // Set today as default session date
                }));
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              label="Published"
              value={stats.published}
              icon={CheckCircleIcon}
              color="green"
            />
            <StatsCard
              label="Drafts"
              value={stats.draft}
              icon={DocumentIcon}
              color="blue"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by title, course, department, or program..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Departments</option>
                  {filterOptions.departments.length > 0 ? (
                    filterOptions.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No departments found</option>
                  )}
                </select>

                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Programs</option>
                  {filterOptions.programs.length > 0 ? (
                    filterOptions.programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No programs found</option>
                  )}
                </select>

                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Courses</option>
                  {filterOptions.courses.length > 0 ? (
                    filterOptions.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} {course.code && `(${course.code})`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No courses found</option>
                  )}
                </select>

                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Semesters</option>
                  {filterOptions.semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>

                <select
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Academic Years</option>
                  {filterOptions.academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Status</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(searchQuery || courseFilter || departmentFilter || programFilter || semesterFilter || academicYearFilter || statusFilter) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{paginatedPlans.length}</span> of{" "}
                    <span className="font-semibold text-gray-900">{filteredPlans.length}</span> filtered session plans
                    {filteredPlans.length !== lessonPlans.length && (
                      <span className="text-gray-500"> ({lessonPlans.length} total)</span>
                    )}
                  </p>
                  
                  {/* Active Filters Summary */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Search: "{searchQuery}"
                        <button onClick={() => setSearchQuery("")} className="hover:bg-blue-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {departmentFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Dept: {filterOptions.departments.find(d => d.id === departmentFilter)?.name}
                        <button onClick={() => setDepartmentFilter("")} className="hover:bg-green-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {programFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Program: {filterOptions.programs.find(p => p.id === programFilter)?.name}
                        <button onClick={() => setProgramFilter("")} className="hover:bg-purple-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {courseFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        Course: {filterOptions.courses.find(c => c.id === courseFilter)?.name}
                        <button onClick={() => setCourseFilter("")} className="hover:bg-indigo-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {semesterFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Semester {semesterFilter}
                        <button onClick={() => setSemesterFilter("")} className="hover:bg-yellow-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {academicYearFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {academicYearFilter}
                        <button onClick={() => setAcademicYearFilter("")} className="hover:bg-orange-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        <button onClick={() => setStatusFilter("")} className="hover:bg-gray-200 rounded-full p-0.5">
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCourseFilter("");
                    setDepartmentFilter("");
                    setProgramFilter("");
                    setSemesterFilter("");
                    setAcademicYearFilter("");
                    setStatusFilter("");
                    setCurrentPage(1); // Reset to first page
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  My Session Plans ({filteredPlans.length})
                </h2>
                {filteredPlans.length > itemsPerPage && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(filteredPlans.length / itemsPerPage)}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Loading session plans...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please wait while we fetch your data
                  </p>
                </div>
              ) : paginatedPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FileTextIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filteredPlans.length === 0 && lessonPlans.length === 0
                      ? "No lesson plans yet"
                      : filteredPlans.length === 0
                      ? "No matching lesson plans"
                      : `No plans on page ${currentPage}`}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {filteredPlans.length === 0 && lessonPlans.length === 0
                      ? "Create your first lesson plan to get started with structured teaching"
                      : filteredPlans.length === 0
                      ? "Try adjusting your search or filter criteria"
                      : `Go to page 1 to see the first ${Math.min(itemsPerPage, filteredPlans.length)} plans`}
                  </p>
                  {filteredPlans.length === 0 && lessonPlans.length === 0 && (
                    <button
                      onClick={() => {
                        resetForm();
                        const today = new Date().toISOString().split('T')[0];
                        setFormData(prev => ({ 
                          ...prev, 
                          academicYear: "2025-2026",
                          sessionDate: today
                        }));
                        setShowEditor(true);
                      }}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      Create Your First Lesson Plan
                    </button>
                  )}
                  {filteredPlans.length > 0 && paginatedPlans.length === 0 && (
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Go to First Page
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginatedPlans.map((plan) => (
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
            
            {/* Pagination */}
            {filteredPlans.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredPlans.length / itemsPerPage)}
                totalItems={filteredPlans.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
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
                  {loadingEdit ? "Loading lesson plan data..." : "Fill in all required fields for your teaching session"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditor(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                disabled={loadingEdit}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loadingEdit && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Loading Lesson Plan Data
                    </h4>
                    <p className="text-xs text-blue-700">
                      Please wait while we populate the form with the lesson plan details...
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                      {Array.isArray(academicYears) && academicYears.map((year) => (
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
                      min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Allow dates up to 30 days in the past
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
                      onChange={(e) => handleFormDepartmentChange(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.department ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
                    >
                      <option value="">Select Department</option>
                      {Array.isArray(departments) && departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
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
                      onChange={(e) => handleFormProgramChange(e.target.value)}
                      disabled={!formData.department || loadingPrograms}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.program ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {!formData.department 
                          ? "Select Department First" 
                          : loadingPrograms 
                          ? "Loading Programs..." 
                          : formPrograms.length === 0
                          ? "No Programs Available for this Department"
                          : "Select Program"
                        }
                      </option>
                      {Array.isArray(formPrograms) && formPrograms.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </option>
                      ))}
                    </select>
                    {errors.program && (
                      <p className="mt-1 text-xs text-red-600">{errors.program}</p>
                    )}
                    {loadingPrograms && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading programs...
                      </div>
                    )}
                    {!loadingPrograms && formData.department && formPrograms.length === 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                        No programs available for this department.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => handleFormSemesterChange(e.target.value)}
                      disabled={!formData.program}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.semester ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {!formData.program ? "Select Program First" : "Select Semester"}
                      </option>
                      {semesters.length === 0 && formData.program ? (
                        <option value="" disabled>
                          No semesters available for this program
                        </option>
                      ) : (
                        Array.isArray(semesters) && semesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.semester && (
                      <p className="mt-1 text-xs text-red-600">{errors.semester}</p>
                    )}
                    {formData.program && semesters.length === 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                        No semesters available for this program.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value, unitId: "" })
                      }
                      disabled={loadingCourses}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.course ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {loadingCourses ? "Loading Courses..." : "Select Course"}
                      </option>
                      {Array.isArray(formCourses) && formCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                    {errors.course && (
                      <p className="mt-1 text-xs text-red-600">{errors.course}</p>
                    )}
                    {loadingCourses && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading courses...
                      </div>
                    )}
                    {!loadingCourses && formCourses.length === 0 && formData.department && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                        No courses available for this selection.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Curriculum Link */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-green-600" />
                  Curriculum Link
                  {loadingUnits && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading curriculum...
                    </div>
                  )}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      disabled={!formData.course || !formData.program || !formData.academicYear || loadingUnits}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.unitId ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {!formData.course || !formData.program || !formData.academicYear
                          ? "Select Course, Program & Academic Year First"
                          : loadingUnits
                          ? "Loading Units..."
                          : availableUnits.length === 0
                          ? "No Units Available (Check Curriculum)"
                          : "Choose a unit from curriculum"
                        }
                      </option>
                      {Array.isArray(availableUnits) && availableUnits.map((unit) => (
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
                        <p className="text-sm text-green-700 font-semibold">{selectedUnit.name}</p>
                        <p className="text-sm text-green-700">{selectedUnit.description}</p>
                        {selectedUnit.estimated_duration && (
                          <p className="text-xs text-green-600 mt-1">
                            Duration: {selectedUnit.estimated_duration} {selectedUnit.duration_unit}
                          </p>
                        )}
                        {selectedUnit.credits && (
                          <p className="text-xs text-green-600 mt-1">
                            Credits: {selectedUnit.credits}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {Array.isArray(availableLearningOutcomes) && availableLearningOutcomes.length > 0 && (
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
                              <p className="text-sm text-gray-900">{outcome.outcome_text}</p>
                              {outcome.bloom_level && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Bloom's Level: {outcome.bloom_level}
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

                  {formData.unitId && availableLearningOutcomes.length === 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        No learning outcomes available for this unit.
                      </p>
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
                      Materials Description
                    </label>
                    <textarea
                      value={formData.requiredMaterials}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredMaterials: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      placeholder="List the materials, resources, or equipment needed for this session"
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files (PDF, DOC, PPT, Images, Videos)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.wmv,.mkv,.webm"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploadingFiles}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`cursor-pointer inline-flex flex-col items-center ${
                          uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">
                          {uploadingFiles ? 'Uploading...' : 'Click to upload files'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PDF, DOC, PPT, Images, Videos (Max 50MB each)
                        </span>
                      </label>
                    </div>

                    {/* Files Display */}
                    {resourceFiles.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Files:</h4>
                        <div className="space-y-2">
                          {resourceFiles.map((file) => {
                            const { icon: FileIcon, color } = getFileIcon(file.name);
                            const isTemporary = !!file.tempFile;
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(
                              file.name.split('.').pop()?.toLowerCase() || ''
                            );
                            const isVideo = ['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'].includes(
                              file.name.split('.').pop()?.toLowerCase() || ''
                            );
                            
                            return (
                              <div
                                key={file.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  isTemporary 
                                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300' 
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <FileIcon className={`h-5 w-5 ${color} flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                    {isImage && (
                                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                        Image
                                      </span>
                                    )}
                                    {isVideo && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                        Video
                                      </span>
                                    )}
                                    {isTemporary && (
                                      <span className="text-xs text-amber-600 font-medium">
                                        • Will upload when saved
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {file.url && !isTemporary && (
                                    <div className="flex items-center gap-1">
                                      <a
                                        href={getDocumentUrl(file.url, 'inline')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                        title="View file"
                                      >
                                        <EyeIcon className="h-3 w-3" />
                                        View
                                      </a>
                                      <a
                                        href={getDocumentUrl(file.url, 'download')}
                                        download={file.name}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-100 rounded transition-colors"
                                        title="Download file"
                                      >
                                        <ArrowUpTrayIcon className="h-3 w-3 rotate-180" />
                                        Download
                                      </a>
                                    </div>
                                  )}
                                  {isTemporary && (
                                    <span className="text-xs text-amber-600 italic">
                                      Save to view
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveFile(file.id)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Remove file"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resource Links Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Links (URLs)
                    </label>
                    <div className="space-y-2">
                      {resourceLinks.map((link, index) => (
                        <div key={link.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => {
                              const newLinks = [...resourceLinks];
                              newLinks[index].title = e.target.value;
                              setResourceLinks(newLinks);
                            }}
                            placeholder="Link title"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...resourceLinks];
                              newLinks[index].url = e.target.value;
                              setResourceLinks(newLinks);
                            }}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                          />
                          <button
                            onClick={() => {
                              setResourceLinks(resourceLinks.filter((_, i) => i !== index));
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setResourceLinks([
                            ...resourceLinks,
                            { id: Date.now().toString(), title: '', url: '' }
                          ]);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                        Add Resource Link
                      </button>
                    </div>
                  </div>

                  {/* Validation Message */}
                  {errors.requiredMaterials && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.requiredMaterials}</p>
                    </div>
                  )}
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