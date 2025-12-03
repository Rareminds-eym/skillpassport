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
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  InformationCircleIcon,
  LinkIcon,
  DocumentIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import { FileTextIcon } from "lucide-react";
<<<<<<< HEAD
import { useCurriculum } from "../../../hooks/useLessonPlans";
import type { LessonPlan as LessonPlanType } from "../../../services/lessonPlansService";
=======
import { lessonPlanService } from "../../../services/lessonPlanService";
import { supabase } from "../../../lib/supabaseClient";
import { 
  getSubjects, 
  getClasses, 
  getCurriculum, 
  getChapters, 
  getLearningOutcomes,
  getCurrentEducatorSchoolId,
  getCurrentAcademicYear,
  type Chapter as CurriculumChapter,
  type LearningOutcome as CurriculumLearningOutcome
} from "../../../services/curriculumService";
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b

/* ==============================
   TYPES & INTERFACES
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

// Curriculum-related interfaces
interface Chapter {
  id: string;
  name: string;
  code?: string;
  description: string;
  order: number;
  estimatedDuration?: number;
  durationUnit?: "hours" | "weeks";
}

interface LearningOutcome {
  id: string;
  chapterId: string;
  outcome: string;
  bloomLevel?: string;
}

interface Curriculum {
  id: string;
  subject: string;
  class: string;
  academicYear: string;
  chapters: Chapter[];
  learningOutcomes: LearningOutcome[];
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  chapterId: string; // Link to curriculum chapter
  chapterName: string; // Display name
  duration?: string; // Auto-filled from chapter
  selectedLearningOutcomes: string[]; // IDs of selected learning outcomes
  learningObjectives: string; // Lesson Objectives (editable, derived from curriculum)
  teachingMethodology: string; // Teaching Methodology
  requiredMaterials: string; // Required Materials (text description)
  resourceFiles: ResourceFile[];
  resourceLinks: ResourceLink[];
  evaluationCriteria: string; // Evaluation Criteria (text description)
  evaluationItems: EvaluationCriteria[];
  homework?: string; // Homework/Follow-up (optional)
  differentiationNotes?: string; // Differentiation notes (optional)
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
   LESSON PLAN CARD COMPONENT
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
          {/* Status Badge on New Row */}
          <div>
            {plan.status === 'approved' ? (
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
          <span className="truncate">{plan.subject}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Class {plan.class}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {new Date(plan.date).toLocaleDateString()}
          </span>
        </div>
        {plan.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{plan.duration}</span>
          </div>
        )}
      </div>

      {/* Chapter and Learning Objectives Preview */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Chapter:</p>
          <p className="text-sm font-semibold text-indigo-700">
            {plan.chapterName}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Lesson Objectives:
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {plan.learningObjectives}
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
   VIEW LESSON PLAN MODAL
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
      subtitle="Lesson Plan Details"
      size="4xl"
    >
      <div className="space-y-6">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
            <p className="text-sm font-semibold text-gray-900">{plan.subject}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Class</p>
            <p className="text-sm font-semibold text-gray-900">Class {plan.class}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(plan.date).toLocaleDateString()}
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
            Chapter (from Curriculum)
          </p>
          <p className="text-sm font-semibold text-indigo-900">
            {plan.chapterName}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
              Lesson Objectives
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.learningObjectives}
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
          {plan.homework && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <DocumentIcon className="h-4 w-4 text-amber-600" />
                Homework / Follow-up
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.homework}
              </p>
            </div>
          )}

          {plan.differentiationNotes && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="h-4 w-4 text-purple-600" />
                Differentiation Notes
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {plan.differentiationNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   PROPS INTERFACE
   ============================== */
interface LessonPlanProps {
  initialLessonPlans?: LessonPlanType[];
  onCreateLessonPlan?: (formData: any, classId: string) => Promise<{ data: any; error: any }>;
  onUpdateLessonPlan?: (id: string, formData: any, classId: string) => Promise<{ data: any; error: any }>;
  onDeleteLessonPlan?: (id: string) => Promise<{ error: any }>;
  subjects?: string[];
  classes?: any[];
  schoolId?: string;
}

/* ==============================
   MAIN COMPONENT
   ============================== */
<<<<<<< HEAD
const LessonPlan: React.FC<LessonPlanProps> = ({
  initialLessonPlans = [],
  onCreateLessonPlan,
  onUpdateLessonPlan,
  onDeleteLessonPlan,
  subjects: propSubjects,
  classes: propClasses,
  schoolId,
}) => {
  // Use props or fallback to sample data
  const subjects = propSubjects || ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];
  const classes = propClasses?.map(c => c.grade || c) || ["9", "10", "11", "12"];
=======
const LessonPlan: React.FC = () => {
  // State for dynamic data
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

<<<<<<< HEAD
  // Convert backend data to UI format
  const convertToUIFormat = (backendPlans: LessonPlanType[]): LessonPlan[] => {
    return backendPlans.map(plan => ({
      id: plan.id,
      title: plan.title,
      subject: plan.subject,
      class: plan.class_name,
      date: plan.date,
      chapterId: plan.chapter_id || "",
      chapterName: plan.chapter_name || "",
      duration: plan.duration ? `${plan.duration} minutes` : "",
      selectedLearningOutcomes: plan.selected_learning_outcomes || [],
      learningObjectives: plan.learning_objectives,
      teachingMethodology: plan.teaching_methodology || "",
      requiredMaterials: plan.required_materials || "",
      resourceFiles: plan.resource_files || [],
      resourceLinks: plan.resource_links || [],
      evaluationCriteria: plan.evaluation_criteria || "",
      evaluationItems: plan.evaluation_items || [],
      homework: plan.homework,
      differentiationNotes: plan.differentiation_notes,
    }));
  };

  // State
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(
    initialLessonPlans ? convertToUIFormat(initialLessonPlans) : []
  );
=======
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Get school ID and academic year
      const [fetchedSchoolId, fetchedAcademicYear, fetchedSubjects, fetchedClasses] = await Promise.all([
        getCurrentEducatorSchoolId(),
        getCurrentAcademicYear(),
        getSubjects(),
        getClasses(),
      ]);

      setSchoolId(fetchedSchoolId);
      setCurrentAcademicYear(fetchedAcademicYear || "2024-2025");
      setSubjects(fetchedSubjects);
      setClasses(fetchedClasses);

      // Load lesson plans if school ID is available
      if (fetchedSchoolId) {
        const plans = await lessonPlanService.getLessonPlans(fetchedSchoolId);
        setLessonPlans(plans.map(plan => ({
          ...plan,
          class: plan.class_name, // Map class_name to class for form compatibility
          chapterId: plan.chapter_id || "", // Map chapter_id to chapterId
          chapterName: plan.chapter_name || "",
          duration: plan.duration ? `${plan.duration} minutes` : "",
          selectedLearningOutcomes: plan.selected_learning_outcomes || [],
          learningObjectives: plan.learning_objectives || "",
          teachingMethodology: plan.teaching_methodology || "",
          requiredMaterials: plan.required_materials || "",
          resourceFiles: plan.resource_files || [],
          resourceLinks: plan.resource_links || [],
          evaluationCriteria: plan.evaluation_criteria || "",
          evaluationItems: plan.evaluation_items || [],
          homework: plan.homework || "",
          differentiationNotes: plan.differentiation_notes || "",
        })));
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load curriculum when subject and class change
  const loadCurriculumData = async (subject: string, className: string) => {
    if (!subject || !className || !currentAcademicYear) return;

    try {
      const curriculum = await getCurriculum(subject, className, currentAcademicYear);
      if (!curriculum) return;

      const [chapters, learningOutcomes] = await Promise.all([
        getChapters(curriculum.id),
        getLearningOutcomes(curriculum.id),
      ]);

      // Map to the expected format
      const mappedCurriculum: Curriculum = {
        id: curriculum.id,
        subject: curriculum.subject,
        class: curriculum.class,
        academicYear: curriculum.academic_year,
        chapters: chapters.map(ch => ({
          id: ch.id,
          name: ch.name,
          code: ch.code,
          description: ch.description,
          order: ch.order_number,
          estimatedDuration: ch.estimated_duration,
          durationUnit: ch.duration_unit,
        })),
        learningOutcomes: learningOutcomes.map(lo => ({
          id: lo.id,
          chapterId: lo.chapter_id,
          outcome: lo.outcome,
          bloomLevel: lo.bloom_level,
        })),
      };

      // Update or add curriculum to state
      setCurriculums(prev => {
        const existing = prev.findIndex(c => c.id === mappedCurriculum.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = mappedCurriculum;
          return updated;
        }
        return [...prev, mappedCurriculum];
      });
    } catch (error) {
      console.error("Error loading curriculum:", error);
    }
  };
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b

  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    date: "",
    chapterId: "",
    learningObjectives: "",
    teachingMethodology: "",
    requiredMaterials: "",
    evaluationCriteria: "",
    homework: "",
    differentiationNotes: "",
  });

  // Load curriculum when subject or class changes
  useEffect(() => {
    if (formData.subject && formData.class) {
      loadCurriculumData(formData.subject, formData.class);
    }
  }, [formData.subject, formData.class]);

  const [selectedLearningOutcomes, setSelectedLearningOutcomes] = useState<string[]>([]);

  const [resourceFiles, setResourceFiles] = useState<ResourceFile[]>([]);
  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);

  const [evaluationItems, setEvaluationItems] = useState<EvaluationCriteria[]>([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [showAddCriterion, setShowAddCriterion] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Use curriculum hook for backend data
  const { chapters, learningOutcomes, loadChapters, loadLearningOutcomes } = 
    useCurriculum(formData.subject, formData.class);

  // Load chapters when subject and class are selected
  useEffect(() => {
    if (formData.subject && formData.class && chapters.length > 0) {
      // Chapters are automatically loaded by the hook
    }
  }, [formData.subject, formData.class, chapters]);

  // Load learning outcomes when chapter is selected
  useEffect(() => {
    if (formData.chapterId) {
      loadLearningOutcomes(formData.chapterId);
    }
  }, [formData.chapterId, loadLearningOutcomes]);

  // Filter lesson plans
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lessonPlans.filter((plan) => {
      const matchesSearch =
        q === "" ||
        plan.title.toLowerCase().includes(q) ||
        plan.subject.toLowerCase().includes(q);
      const matchesSubject =
        subjectFilter === "" || plan.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [lessonPlans, searchQuery, subjectFilter]);

  // Stats
  const stats = {
    total: lessonPlans.length,
    thisWeek: lessonPlans.filter((p) => {
      const planDate = new Date(p.date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return planDate >= today && planDate <= weekFromNow;
    }).length,
    bySubject: subjects.reduce((acc, subject) => {
      acc[subject] = lessonPlans.filter((p) => p.subject === subject).length;
      return acc;
    }, {} as Record<string, number>),
  };

<<<<<<< HEAD
  // Get available chapters from curriculum hook
  const availableChapters = chapters;
=======
  // Get available curriculums based on selected subject and class
  const availableCurriculums = useMemo(() => {
    if (!formData.subject || !formData.class) return [];
    return curriculums.filter(
      (c) => c.subject === formData.subject && c.class === formData.class
    );
  }, [formData.subject, formData.class, curriculums]);

  // Get chapters from selected curriculum
  const availableChapters = useMemo(() => {
    if (availableCurriculums.length === 0) return [];
    return availableCurriculums[0].chapters;
  }, [availableCurriculums]);
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b

  // Get learning outcomes for selected chapter
  const availableLearningOutcomes = learningOutcomes;

  // Get selected chapter details
  const selectedChapter = useMemo(() => {
    if (!formData.chapterId) return null;
    return availableChapters.find((ch: any) => ch.id === formData.chapterId);
  }, [formData.chapterId, availableChapters]);

  // Auto-fill duration when chapter is selected
  useEffect(() => {
    if (selectedChapter && selectedChapter.estimatedDuration) {
      // Duration is auto-filled from chapter, no need to set in formData
    }
  }, [selectedChapter]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      class: "",
      date: "",
      chapterId: "",
      learningObjectives: "",
      teachingMethodology: "",
      requiredMaterials: "",
      evaluationCriteria: "",
      homework: "",
      differentiationNotes: "",
    });
    setSelectedLearningOutcomes([]);
    setResourceFiles([]);
    setResourceLinks([]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowAddLink(false);
    setEvaluationItems([]);
    setNewCriterion("");
    setNewPercentage("");
    setShowAddCriterion(false);
    setErrors({});
    setEditingPlan(null);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: ResourceFile[] = Array.from(files).map((file) => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setResourceFiles([...resourceFiles, ...newFiles]);
    }
    e.target.value = ""; // Reset input
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setResourceFiles(resourceFiles.filter((f) => f.id !== fileId));
  };

  // Add link
  const handleAddLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      const newLink: ResourceLink = {
        id: Date.now().toString() + Math.random(),
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim(),
      };
      setResourceLinks([...resourceLinks, newLink]);
      setNewLinkTitle("");
      setNewLinkUrl("");
      setShowAddLink(false);
    }
  };

  // Remove link
  const handleRemoveLink = (linkId: string) => {
    setResourceLinks(resourceLinks.filter((l) => l.id !== linkId));
  };

  // Add evaluation criterion
  const handleAddCriterion = () => {
    const percentage = parseFloat(newPercentage);
    if (newCriterion.trim() && !isNaN(percentage) && percentage > 0 && percentage <= 100) {
      const currentTotal = evaluationItems.reduce((sum, item) => sum + item.percentage, 0);
      if (currentTotal + percentage > 100) {
        alert(`Total percentage cannot exceed 100%. Current total: ${currentTotal}%`);
        return;
      }

      const newItem: EvaluationCriteria = {
        id: Date.now().toString() + Math.random(),
        criterion: newCriterion.trim(),
        percentage: percentage,
      };
      setEvaluationItems([...evaluationItems, newItem]);
      setNewCriterion("");
      setNewPercentage("");
      setShowAddCriterion(false);
    }
  };

  // Remove evaluation criterion
  const handleRemoveCriterion = (criterionId: string) => {
    setEvaluationItems(evaluationItems.filter((c) => c.id !== criterionId));
  };

  // Calculate total percentage
  const getTotalPercentage = (): number => {
    return evaluationItems.reduce((sum, item) => sum + item.percentage, 0);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!formData.title.trim()) {
      newErrors.title = "Lesson title is required";
    }
    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }
    if (!formData.class) {
      newErrors.class = "Please select a class";
    }
    if (!formData.date) {
      newErrors.date = "Please select a date for the lesson";
    }
    
    // Curriculum-linked fields
    if (!formData.chapterId) {
      newErrors.chapterId = "Please select a chapter from curriculum";
    }
    if (selectedLearningOutcomes.length === 0) {
      newErrors.learningOutcomes = "Please select at least one learning outcome";
    }
    
    // Content fields
    if (!formData.learningObjectives.trim()) {
      newErrors.learningObjectives = "Lesson Objectives are required";
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

<<<<<<< HEAD
  // Handle submit
  const handleSubmit = async () => {
=======
  // Handle submit with status parameter
  const handleSubmit = async (status: 'draft' | 'approved' = 'draft') => {
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
<<<<<<< HEAD
      // Find class ID
      const classObj = propClasses?.find((c: any) => c.grade === formData.class || c === formData.class);
      const classId = classObj?.id || "";

      if (!classId) {
        alert("Class not found. Please select a valid class.");
        setSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        selectedLearningOutcomes,
        resourceFiles,
        resourceLinks,
        evaluationItems,
      };

      if (editingPlan) {
        // Update existing lesson plan
        if (onUpdateLessonPlan) {
          const { data, error } = await onUpdateLessonPlan(editingPlan.id, submitData, classId);
          if (error) {
            alert("Error updating lesson plan: " + error);
            setSubmitting(false);
            return;
          }
          if (data) {
            const converted = convertToUIFormat([data])[0];
            setLessonPlans((prev) =>
              prev.map((p) => (p.id === editingPlan.id ? converted : p))
            );
          }
        } else {
          // Fallback to local state update
          const chapter = selectedChapter;
          const duration = chapter?.estimatedDuration
            ? `${chapter.estimatedDuration} ${chapter.durationUnit}`
            : undefined;
          setLessonPlans((prev) =>
            prev.map((p) =>
              p.id === editingPlan.id
                ? {
                    ...p,
                    ...formData,
                    chapterName: chapter?.name || "",
                    duration,
                    selectedLearningOutcomes,
                    resourceFiles,
                    resourceLinks,
                    evaluationItems,
                  }
                : p
            )
          );
        }
      } else {
        // Create new lesson plan
        if (onCreateLessonPlan) {
          const { data, error } = await onCreateLessonPlan(submitData, classId);
          if (error) {
            alert("Error creating lesson plan: " + error);
            setSubmitting(false);
            return;
          }
          if (data) {
            const converted = convertToUIFormat([data])[0];
            setLessonPlans([converted, ...lessonPlans]);
          }
        } else {
          // Fallback to local state update
          const chapter = selectedChapter;
          const duration = chapter?.estimatedDuration
            ? `${chapter.estimatedDuration} ${chapter.durationUnit}`
            : undefined;
          const newPlan: LessonPlan = {
            id: Date.now().toString(),
            ...formData,
            chapterName: chapter?.name || "",
            duration,
            selectedLearningOutcomes,
            resourceFiles,
            resourceLinks,
            evaluationItems,
          };
          setLessonPlans([newPlan, ...lessonPlans]);
        }
=======
      // Get the current educator's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User not authenticated");
        setSubmitting(false);
        return;
      }

      // Get educator_id from school_educators table
      const { data: educatorData, error: educatorError } = await supabase
        .from('school_educators')
        .select('id, school_id')
        .eq('user_id', user.id)
        .single();

      if (educatorError || !educatorData) {
        console.error("Educator not found:", educatorError);
        alert("Educator profile not found. Please contact administrator.");
        setSubmitting(false);
        return;
      }

      // Get class_id from school_classes based on grade and school
      let classId = null;
      if (formData.class && educatorData.school_id) {
        const { data: classData, error: classError } = await supabase
          .from('school_classes')
          .select('id, name, grade, section')
          .eq('school_id', educatorData.school_id)
          .eq('grade', formData.class)
          .eq('academic_year', currentAcademicYear)
          .limit(1);
        
        if (classError) {
          console.error("Error fetching class:", classError);
        }
        
        // Take the first matching class if multiple sections exist
        if (classData && classData.length > 0) {
          classId = classData[0].id;
          console.log("Linked to class:", classData[0].name, "ID:", classId);
        } else {
          console.warn("No matching school_class found for grade:", formData.class);
        }
      }

      const chapter = selectedChapter;
      const duration = chapter?.estimatedDuration || 45; // Default 45 minutes

      const lessonPlanData = {
        educator_id: educatorData.id, // Use the actual educator ID from school_educators
        class_id: classId, // Link to school_classes
        title: formData.title,
        subject: formData.subject,
        class_name: formData.class,
        date: formData.date,
        duration,
        chapter_id: formData.chapterId || null,
        chapter_name: chapter?.name || null,
        selected_learning_outcomes: selectedLearningOutcomes,
        learning_objectives: formData.learningObjectives,
        teaching_methodology: formData.teachingMethodology || null,
        required_materials: formData.requiredMaterials || null,
        resource_files: resourceFiles,
        resource_links: resourceLinks,
        evaluation_criteria: formData.evaluationCriteria || null,
        evaluation_items: evaluationItems,
        homework: formData.homework || null,
        differentiation_notes: formData.differentiationNotes || null,
        status: status, // Use the status parameter
        activities: [],
        resources: [],
        assessment_methods: null,
        notes: null,
        submitted_at: status === 'approved' ? new Date().toISOString() : null,
        reviewed_by: status === 'approved' ? user.id : null,
        reviewed_at: status === 'approved' ? new Date().toISOString() : null,
        review_comments: null,
      };

      if (editingPlan) {
        const updated = await lessonPlanService.updateLessonPlan(editingPlan.id, lessonPlanData);
        setLessonPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? {
                  ...updated,
                  class: updated.class_name, // Map class_name to class
                  chapterId: updated.chapter_id || "", // Map chapter_id to chapterId
                  chapterName: updated.chapter_name || "",
                  duration: updated.duration ? `${updated.duration} minutes` : "",
                  selectedLearningOutcomes: updated.selected_learning_outcomes || [],
                  learningObjectives: updated.learning_objectives || "",
                  teachingMethodology: updated.teaching_methodology || "",
                  requiredMaterials: updated.required_materials || "",
                  resourceFiles: updated.resource_files || [],
                  resourceLinks: updated.resource_links || [],
                  evaluationCriteria: updated.evaluation_criteria || "",
                  evaluationItems: updated.evaluation_items || [],
                  homework: updated.homework || "",
                  differentiationNotes: updated.differentiation_notes || "",
                }
              : p
          )
        );
      } else {
        const created = await lessonPlanService.createLessonPlan(lessonPlanData);
        const newPlan: LessonPlan = {
          ...created,
          class: created.class_name, // Map class_name to class
          chapterId: created.chapter_id || "", // Map chapter_id to chapterId
          chapterName: created.chapter_name || "",
          duration: created.duration ? `${created.duration} minutes` : "",
          selectedLearningOutcomes: created.selected_learning_outcomes || [],
          learningObjectives: created.learning_objectives || "",
          teachingMethodology: created.teaching_methodology || "",
          requiredMaterials: created.required_materials || "",
          resourceFiles: created.resource_files || [],
          resourceLinks: created.resource_links || [],
          evaluationCriteria: created.evaluation_criteria || "",
          evaluationItems: created.evaluation_items || [],
          homework: created.homework || "",
          differentiationNotes: created.differentiation_notes || "",
        };
        setLessonPlans([newPlan, ...lessonPlans]);
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b
      }

      resetForm();
      setShowEditor(false);
<<<<<<< HEAD
    } catch (error: any) {
      alert("Error: " + error.message);
=======
    } catch (error) {
      console.error("Error saving lesson plan:", error);
      alert("Failed to save lesson plan. Please try again.");
>>>>>>> 3fe6fb4c99b79d361a01cf4693905b24ade8886b
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (plan: LessonPlan) => {
    // Load curriculum data first if subject and class are available
    if (plan.subject && plan.class) {
      await loadCurriculumData(plan.subject, plan.class);
    }
    
    setFormData({
      title: plan.title,
      subject: plan.subject,
      class: plan.class,
      date: plan.date,
      chapterId: plan.chapterId || "",
      learningObjectives: plan.learningObjectives,
      teachingMethodology: plan.teachingMethodology,
      requiredMaterials: plan.requiredMaterials,
      evaluationCriteria: plan.evaluationCriteria,
      homework: plan.homework || "",
      differentiationNotes: plan.differentiationNotes || "",
    });
    setSelectedLearningOutcomes(plan.selectedLearningOutcomes || []);
    setResourceFiles(plan.resourceFiles || []);
    setResourceLinks(plan.resourceLinks || []);
    setEvaluationItems(plan.evaluationItems || []);
    setEditingPlan(plan);
    setShowEditor(true);
  };

  // Handle duplicate
  const handleDuplicate = async (plan: LessonPlan) => {
    // Load curriculum data first if subject and class are available
    if (plan.subject && plan.class) {
      await loadCurriculumData(plan.subject, plan.class);
    }
    
    setFormData({
      title: `${plan.title} (Copy)`,
      subject: plan.subject,
      class: plan.class,
      date: "",
      chapterId: plan.chapterId || "",
      learningObjectives: plan.learningObjectives,
      teachingMethodology: plan.teachingMethodology,
      requiredMaterials: plan.requiredMaterials,
      evaluationCriteria: plan.evaluationCriteria,
      homework: plan.homework || "",
      differentiationNotes: plan.differentiationNotes || "",
    });
    setSelectedLearningOutcomes(plan.selectedLearningOutcomes || []);
    setResourceFiles(plan.resourceFiles || []);
    setResourceLinks(plan.resourceLinks || []);
    setEvaluationItems(plan.evaluationItems || []);
    setEditingPlan(null);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading lesson plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
              <FileTextIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Lesson Plans
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, submit, and manage your teaching plans
              </p>
            </div>
          </div>

          {!showEditor && (
            <button
              onClick={() => {
                resetForm();
                setShowEditor(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <PlusCircleIcon className="h-5 w-5" />
              New Lesson Plan
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
              label="Subjects Covered"
              value={Object.keys(stats.bySubject).filter(s => stats.bySubject[s] > 0).length}
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
                  placeholder="Search by title or subject..."
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

              </div>
            </div>

            {(searchQuery || subjectFilter) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredPlans.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{lessonPlans.length}</span> lesson plans
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSubjectFilter("");
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Lesson Plans Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                My Lesson Plans ({filteredPlans.length})
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
                      ? "No lesson plans yet"
                      : "No matching lesson plans"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {lessonPlans.length === 0
                      ? "Create your first lesson plan to get started with structured teaching"
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
                      Create Your First Lesson Plan
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
        /* Editor Form */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPlan ? "Edit Lesson Plan" : "Create New Lesson Plan"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in all required fields and submit for coordinator approval
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
                    Lesson Plan Requirements
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• All mandatory fields must be completed</li>
                    <li>• Link lesson plans to curriculum chapters for better tracking</li>
                    <li>• Evaluation criteria should align with learning objectives</li>
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
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      placeholder="e.g., Introduction to Algebra"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <select
                      value={formData.class}
                      onChange={(e) =>
                        setFormData({ ...formData, class: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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
                      Chapter <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.chapterId}
                      onChange={(e) => {
                        setFormData({ ...formData, chapterId: e.target.value });
                        setSelectedLearningOutcomes([]); // Reset learning outcomes when chapter changes
                      }}
                      disabled={!formData.subject || !formData.class}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.chapterId ? "border-red-300" : "border-gray-300"
                      } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {!formData.subject || !formData.class
                          ? "Select subject and class first"
                          : "Select Chapter from Curriculum"}
                      </option>
                      {availableChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.code ? `${chapter.code} - ` : ""}
                          {chapter.name}
                          {chapter.estimatedDuration
                            ? ` (${chapter.estimatedDuration} ${chapter.durationUnit})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {errors.chapterId && (
                      <p className="text-red-500 text-xs mt-1">{errors.chapterId}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Chapter from approved curriculum
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                      {selectedChapter?.estimatedDuration
                        ? `${selectedChapter.estimatedDuration} ${selectedChapter.durationUnit}`
                        : "Select chapter to see duration"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-filled from curriculum chapter
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:ring-2 transition-colors ${
                        errors.date
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        {errors.date}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Outcomes Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-indigo-600" />
                  Select Learning Outcomes <span className="text-red-500">*</span>
                </h3>
                {availableLearningOutcomes.length > 0 ? (
                  <div className="space-y-2">
                    {availableLearningOutcomes.map((outcome) => (
                      <label
                        key={outcome.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLearningOutcomes.includes(outcome.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLearningOutcomes([
                                ...selectedLearningOutcomes,
                                outcome.id,
                              ]);
                            } else {
                              setSelectedLearningOutcomes(
                                selectedLearningOutcomes.filter(
                                  (id) => id !== outcome.id
                                )
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{outcome.outcome}</p>
                          {outcome.bloomLevel && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              {outcome.bloomLevel}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                      {formData.chapterId
                        ? "No learning outcomes found for this chapter"
                        : "Select a chapter to see available learning outcomes"}
                    </p>
                  </div>
                )}
                {errors.learningOutcomes && (
                  <p className="text-red-500 text-xs mt-2">
                    {errors.learningOutcomes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Select mapped learning outcomes from curriculum
                </p>
              </div>

              {/* Lesson Objectives */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
                  Lesson Objectives <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={formData.learningObjectives}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      learningObjectives: e.target.value,
                    })
                  }
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.learningObjectives ? "border-red-300" : "border-gray-300"
                  } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                  placeholder="What should students learn and be able to do after this lesson? Describe specific, measurable learning objectives derived from the selected outcomes above..."
                />
                {errors.learningObjectives && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.learningObjectives}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Editable text derived from selected learning outcomes
                </p>
              </div>

              {/* Teaching Methodology */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-purple-600" />
                  Teaching Methodology <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={formData.teachingMethodology}
                  onChange={(e) =>
                    setFormData({ ...formData, teachingMethodology: e.target.value })
                  }
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.teachingMethodology ? "border-red-300" : "border-gray-300"
                  } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                  placeholder="Describe your teaching methodology and activities. Examples: Inquiry-based learning, Lecture + Discussion, Activity-based, etc..."
                />
                {errors.teachingMethodology && (
                  <p className="text-red-500 text-xs mt-1">{errors.teachingMethodology}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Include interactive elements, demonstrations, group work, etc.
                </p>
              </div>

              {/* Required Materials */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-blue-600" />
                  Required Materials <span className="text-red-500">*</span>
                </h3>

                {/* Text Description */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Materials Description
                  </label>
                  <textarea
                    value={formData.requiredMaterials}
                    onChange={(e) =>
                      setFormData({ ...formData, requiredMaterials: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                    placeholder="List materials, equipment, worksheets, lab kits, PPT, videos, etc..."
                  />
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Upload Files
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                    <div className="flex items-center justify-center">
                      <label className="flex flex-col items-center cursor-pointer">
                        <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 mb-1">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF, DOC, PPT, Images, Videos (Max 50MB)
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov,.avi,.wmv,.mkv,.webm"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {resourceFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {resourceFiles.map((file) => {
                        const { icon: FileIcon, color } = getFileIcon(file.name);
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
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
                            <button
                              onClick={() => handleRemoveFile(file.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              title="Remove file"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resource Links */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-600">
                      Resource Links
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddLink(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      Add Link
                    </button>
                  </div>

                  {/* Add Link Form */}
                  {showAddLink && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-3">
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="Link Title (e.g., Google Drive, YouTube Video, etc.)"
                            className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <input
                            type="url"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddLink}
                            disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddLink(false);
                              setNewLinkTitle("");
                              setNewLinkUrl("");
                            }}
                            className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resource Links List */}
                  {resourceLinks.length > 0 && (
                    <div className="space-y-2">
                      {resourceLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
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
                          <button
                            onClick={() => handleRemoveLink(link.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Remove link"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {errors.requiredMaterials && (
                  <p className="text-red-500 text-xs mt-1">{errors.requiredMaterials}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Add at least one material (description, file, or link)
                </p>
              </div>

              {/* Evaluation Criteria */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  Evaluation Criteria <span className="text-red-500">*</span>
                </h3>

                {/* Add Criterion Button */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-600">
                      Assessment Components
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCriterion(true)}
                      className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      Add Criterion
                    </button>
                  </div>

                  {/* Add Criterion Form */}
                  {showAddCriterion && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Assessment Type
                          </label>
                          <input
                            type="text"
                            value={newCriterion}
                            onChange={(e) => setNewCriterion(e.target.value)}
                            placeholder="e.g., Written test, Lab report, Class participation"
                            className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Percentage (%)
                          </label>
                          <input
                            type="number"
                            value={newPercentage}
                            onChange={(e) => setNewPercentage(e.target.value)}
                            placeholder="0-100"
                            min="0"
                            max="100"
                            step="1"
                            className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining: {100 - getTotalPercentage()}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddCriterion}
                            disabled={!newCriterion.trim() || !newPercentage.trim()}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCriterion(false);
                              setNewCriterion("");
                              setNewPercentage("");
                            }}
                            className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Items List */}
                  {evaluationItems.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {evaluationItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                              <span className="text-sm font-bold text-green-700">{index + 1}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{item.criterion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                              {item.percentage}%
                            </span>
                            <button
                              onClick={() => handleRemoveCriterion(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              title="Remove criterion"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Total Percentage Indicator */}
                      <div className={`p-3 rounded-lg border ${
                        getTotalPercentage() === 100
                          ? 'bg-green-50 border-green-200'
                          : getTotalPercentage() > 100
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Total Percentage</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${
                              getTotalPercentage() === 100
                                ? 'text-green-600'
                                : getTotalPercentage() > 100
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}>
                              {getTotalPercentage()}%
                            </span>
                            {getTotalPercentage() === 100 && (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            )}
                            {getTotalPercentage() > 100 && (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                        {getTotalPercentage() !== 100 && (
                          <p className={`text-xs mt-1 ${
                            getTotalPercentage() > 100 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {getTotalPercentage() > 100
                              ? `Exceeds 100% by ${getTotalPercentage() - 100}%`
                              : `${100 - getTotalPercentage()}% remaining`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Evaluation Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Evaluation Description
                  </label>
                  <textarea
                    value={formData.evaluationCriteria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evaluationCriteria: e.target.value,
                      })
                    }
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.evaluationCriteria ? "border-red-300" : "border-gray-300"
                    } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                    placeholder="Describe how learning will be checked. Examples: Exit ticket, Quiz, Observation rubric, etc..."
                  />
                  {errors.evaluationCriteria && (
                    <p className="text-red-500 text-xs mt-1">{errors.evaluationCriteria}</p>
                  )}
                </div>
              </div>

              {/* Optional Fields */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4 text-gray-600" />
                  Additional Information (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Homework / Follow-up
                    </label>
                    <textarea
                      value={formData.homework}
                      onChange={(e) =>
                        setFormData({ ...formData, homework: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      placeholder="Assignments or follow-up activities for students..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Differentiation Notes
                    </label>
                    <textarea
                      value={formData.differentiationNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, differentiationNotes: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      placeholder="Notes on how to adapt the lesson for different learning needs..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
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
                  onClick={() => handleSubmit('approved')}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Publish
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

export default LessonPlan;