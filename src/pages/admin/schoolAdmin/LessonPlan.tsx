/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
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
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import { FileTextIcon } from "lucide-react";

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

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  teacher: string;
  learningOutcomes: string;
  activities: string;
  resources: string;
  resourceFiles: ResourceFile[];
  resourceLinks: ResourceLink[];
  evaluationCriteria: string;
  evaluationItems: EvaluationCriteria[];
  status: "draft" | "pending" | "approved" | "rejected";
  submittedAt?: string;
  reviewedBy?: string;
  reviewComments?: string;
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
  color?: "blue" | "green" | "amber" | "red" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
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
  const statusConfig = {
    draft: {
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      label: "Draft",
      icon: FileTextIcon,
    },
    pending: {
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      label: "Pending Review",
      icon: ClockIcon,
    },
    approved: {
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      label: "Approved",
      icon: CheckCircleIcon,
    },
    rejected: {
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      label: "Rejected",
      icon: XCircleIcon,
    },
  };

  const status = statusConfig[plan.status];
  const StatusIcon = status.icon;

  return (
    <div className="group bg-white rounded-xl border-2 border-gray-200 p-5 transition-all hover:border-indigo-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
              {plan.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${status.bgColor} ${status.textColor} border ${status.borderColor}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {plan.submittedAt
              ? new Date(plan.submittedAt).toLocaleDateString()
              : "Not submitted"}
          </span>
        </div>
      </div>

      {/* Learning Outcome Preview */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-1">
          Learning Outcome:
        </p>
        <p className="text-sm text-gray-700 line-clamp-2">
          {plan.learningOutcomes}
        </p>
      </div>

      {/* Review Status */}
      {plan.status === "rejected" && plan.reviewComments && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-900 mb-1">
            Review Comments:
          </p>
          <p className="text-xs text-red-700">{plan.reviewComments}</p>
        </div>
      )}

      {plan.status === "approved" && plan.reviewedBy && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            <span className="font-semibold">Approved by:</span> {plan.reviewedBy}
          </p>
        </div>
      )}
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

  const statusConfig = {
    draft: {
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      label: "Draft",
      icon: FileTextIcon,
    },
    pending: {
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
      label: "Pending Review",
      icon: ClockIcon,
    },
    approved: {
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      label: "Approved",
      icon: CheckCircleIcon,
    },
    rejected: {
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      label: "Rejected",
      icon: XCircleIcon,
    },
  };

  const status = statusConfig[plan.status];
  const StatusIcon = status.icon;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={plan.title}
      subtitle="Lesson Plan Details"
      size="4xl"
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${status.bgColor} ${status.textColor}`}
          >
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </span>
          <div className="text-sm text-gray-500">
            Teacher: <span className="font-medium text-gray-900">{plan.teacher}</span>
          </div>
        </div>

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
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Submitted</p>
            <p className="text-sm font-semibold text-gray-900">
              {plan.submittedAt
                ? new Date(plan.submittedAt).toLocaleDateString()
                : "Not yet"}
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
              Learning Outcomes
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.learningOutcomes}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-purple-600" />
              Teaching Activities
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {plan.activities}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-blue-600" />
              Required Resources
            </h4>
            {plan.resources && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {plan.resources}
              </p>
            )}

            {/* Files */}
            {plan.resourceFiles && plan.resourceFiles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Attached Files:</p>
                <div className="space-y-2">
                  {plan.resourceFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <DocumentIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
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

            {!plan.resources &&
             (!plan.resourceFiles || plan.resourceFiles.length === 0) &&
             (!plan.resourceLinks || plan.resourceLinks.length === 0) && (
              <p className="text-sm text-gray-500 italic">No resources added</p>
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
        </div>

        {/* Review Information */}
        {plan.status === "rejected" && plan.reviewComments && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Coordinator's Comments
            </h4>
            <p className="text-sm text-red-700 leading-relaxed">
              {plan.reviewComments}
            </p>
            {plan.reviewedBy && (
              <p className="text-xs text-red-600 mt-2">
                Reviewed by: {plan.reviewedBy}
              </p>
            )}
          </div>
        )}

        {plan.status === "approved" && plan.reviewedBy && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4" />
              Approval Information
            </h4>
            <p className="text-sm text-green-700">
              This lesson plan has been approved by {plan.reviewedBy} and is ready for use in your journal.
            </p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN COMPONENT
   ============================== */
const LessonPlan: React.FC = () => {
  // Sample data
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];
  const classes = ["9", "10", "11", "12"];

  // State
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([
    {
      id: "1",
      title: "Introduction to Algebra",
      subject: "Mathematics",
      class: "9",
      date: "2025-12-01",
      teacher: "Mrs. Sarah Johnson",
      learningOutcomes: "Students will understand basic algebraic concepts and operations, including variables, expressions, and simple equations. They will be able to solve linear equations and apply algebraic thinking to real-world problems.",
      activities: "Interactive teaching with practical examples, group problem-solving sessions, and hands-on activities with algebraic manipulatives. Students will work in pairs to solve progressively challenging problems.",
      resources: "Whiteboard, Algebra worksheets, Calculator, Algebraic manipulatives, Online interactive tools",
      resourceFiles: [
        { id: "f1", name: "Algebra_Worksheet.pdf", size: 245000, type: "application/pdf" },
        { id: "f2", name: "Practice_Problems.docx", size: 128000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      ],
      resourceLinks: [
        { id: "l1", title: "Khan Academy - Algebra Basics", url: "https://www.khanacademy.org/math/algebra" },
        { id: "l2", title: "Interactive Algebra Tool", url: "https://www.desmos.com/calculator" },
      ],
      evaluationCriteria: "Written test (40%), Class participation (30%), Homework assignments (20%), Group activity performance (10%)",
      evaluationItems: [
        { id: "e1", criterion: "Written test", percentage: 40 },
        { id: "e2", criterion: "Class participation", percentage: 30 },
        { id: "e3", criterion: "Homework assignments", percentage: 20 },
        { id: "e4", criterion: "Group activity performance", percentage: 10 },
      ],
      status: "approved",
      submittedAt: "2025-11-20",
      reviewedBy: "Academic Coordinator - Mrs. Anderson",
    },
    {
      id: "2",
      title: "Newton's Laws of Motion",
      subject: "Physics",
      class: "10",
      date: "2025-12-03",
      teacher: "Mr. David Chen",
      learningOutcomes: "Students will explain and demonstrate Newton's three laws of motion, understand the concepts of force, mass, and acceleration, and apply these principles to everyday situations.",
      activities: "Demonstration-based learning with real-world examples, laboratory experiments showing each law, video demonstrations of forces in action, and student-led presentations on applications.",
      resources: "Physics lab equipment, demonstration models, spring scales, toy cars, ramps, video projector, online simulation software",
      resourceFiles: [],
      resourceLinks: [
        { id: "l3", title: "PhET Physics Simulations", url: "https://phet.colorado.edu/en/simulations/filter?subjects=motion" },
      ],
      evaluationCriteria: "Practical demonstration (35%), Theoretical test (35%), Lab report (20%), Class participation (10%)",
      evaluationItems: [
        { id: "e5", criterion: "Practical demonstration", percentage: 35 },
        { id: "e6", criterion: "Theoretical test", percentage: 35 },
        { id: "e7", criterion: "Lab report", percentage: 20 },
        { id: "e8", criterion: "Class participation", percentage: 10 },
      ],
      status: "pending",
      submittedAt: "2025-11-24",
    },
    {
      id: "3",
      title: "Photosynthesis Process",
      subject: "Biology",
      class: "9",
      date: "2025-11-28",
      teacher: "Dr. Emily Roberts",
      learningOutcomes: "Students will understand the complete process of photosynthesis, identify the key components involved, explain the importance of photosynthesis for life on Earth, and recognize factors affecting the rate of photosynthesis.",
      activities: "Visual presentation with detailed diagrams, hands-on lab experiment observing photosynthesis, microscope work examining plant cells, and group discussions on environmental impact.",
      resources: "Microscope, plant samples, presentation slides, lab equipment, photosynthesis model, test tubes, indicator solutions",
      resourceFiles: [],
      resourceLinks: [],
      evaluationCriteria: "Lab report and quiz",
      evaluationItems: [],
      status: "rejected",
      submittedAt: "2025-11-18",
      reviewedBy: "Academic Coordinator - Dr. Martinez",
      reviewComments: "The evaluation criteria need to be more detailed with specific percentage breakdowns. Please expand the activities section to include more hands-on experiments and extend the practical component with specific observation tasks. Also add more detail on how the lab report will be graded.",
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    date: "",
    learningOutcomes: "",
    activities: "",
    resources: "",
    evaluationCriteria: "",
  });

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

  // Filter lesson plans
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lessonPlans.filter((plan) => {
      const matchesSearch =
        q === "" ||
        plan.title.toLowerCase().includes(q) ||
        plan.subject.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "" || plan.status === statusFilter;
      const matchesSubject =
        subjectFilter === "" || plan.subject === subjectFilter;
      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [lessonPlans, searchQuery, statusFilter, subjectFilter]);

  // Stats
  const stats = {
    total: lessonPlans.length,
    pending: lessonPlans.filter((p) => p.status === "pending").length,
    approved: lessonPlans.filter((p) => p.status === "approved").length,
    rejected: lessonPlans.filter((p) => p.status === "rejected").length,
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      class: "",
      date: "",
      learningOutcomes: "",
      activities: "",
      resources: "",
      evaluationCriteria: "",
    });
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
  const validateForm = (isDraft: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isDraft) {
      if (!formData.learningOutcomes.trim()) {
        newErrors.learningOutcomes = "Learning Outcomes are mandatory";
      }
      if (!formData.activities.trim()) {
        newErrors.activities = "Teaching Activities are mandatory";
      }
      if (!formData.resources.trim() && resourceFiles.length === 0 && resourceLinks.length === 0) {
        newErrors.resources = "Please provide at least one resource (text, file, or link)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (isDraft: boolean) => {
    if (!validateForm(isDraft)) {
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      if (editingPlan) {
        setLessonPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? {
                  ...p,
                  ...formData,
                  resourceFiles,
                  resourceLinks,
                  evaluationItems,
                  status: isDraft ? "draft" : "pending",
                  submittedAt: isDraft ? p.submittedAt : new Date().toISOString(),
                }
              : p
          )
        );
      } else {
        const newPlan: LessonPlan = {
          id: Date.now().toString(),
          ...formData,
          resourceFiles,
          resourceLinks,
          evaluationItems,
          teacher: "Current User",
          status: isDraft ? "draft" : "pending",
          submittedAt: isDraft ? undefined : new Date().toISOString(),
        };
        setLessonPlans([newPlan, ...lessonPlans]);
      }

      setSubmitting(false);
      resetForm();
      setShowEditor(false);
    }, 800);
  };

  // Handle edit
  const handleEdit = (plan: LessonPlan) => {
    setFormData({
      title: plan.title,
      subject: plan.subject,
      class: plan.class,
      date: plan.date,
      learningOutcomes: plan.learningOutcomes,
      activities: plan.activities,
      resources: plan.resources,
      evaluationCriteria: plan.evaluationCriteria,
    });
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
      subject: plan.subject,
      class: plan.class,
      date: "",
      learningOutcomes: plan.learningOutcomes,
      activities: plan.activities,
      resources: plan.resources,
      evaluationCriteria: plan.evaluationCriteria,
    });
    setResourceFiles(plan.resourceFiles || []);
    setResourceLinks(plan.resourceLinks || []);
    setEvaluationItems(plan.evaluationItems || []);
    setEditingPlan(null);
    setShowEditor(true);
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              label="Total Plans"
              value={stats.total}
              icon={FileTextIcon}
              color="blue"
            />
            <StatsCard
              label="Pending Review"
              value={stats.pending}
              icon={ClockIcon}
              color="amber"
            />
            <StatsCard
              label="Approved"
              value={stats.approved}
              icon={CheckCircleIcon}
              color="green"
            />
            <StatsCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircleIcon}
              color="red"
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

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {(searchQuery || statusFilter || subjectFilter) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredPlans.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{lessonPlans.length}</span> lesson plans
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
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
                    Submission Requirements
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Learning Outcomes, Activities, and Resources are mandatory for submission</li>
                    <li>• Plans must be approved by Academic Coordinator before teaching</li>
                    <li>• Approved plans will appear in your teaching journal</li>
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
                  <div>
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
                      Lesson Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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
                </div>
              </div>

              {/* Learning Outcomes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentCheckIcon className="h-4 w-4 text-indigo-600" />
                  Learning Outcomes <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={formData.learningOutcomes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      learningOutcomes: e.target.value,
                    })
                  }
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.learningOutcomes ? "border-red-300" : "border-gray-300"
                  } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                  placeholder="What should students learn and be able to do after this lesson? Describe specific, measurable learning outcomes..."
                />
                {errors.learningOutcomes && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.learningOutcomes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Required for submission to coordinator
                </p>
              </div>

              {/* Teaching Activities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-purple-600" />
                  Teaching Activities <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={formData.activities}
                  onChange={(e) =>
                    setFormData({ ...formData, activities: e.target.value })
                  }
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.activities ? "border-red-300" : "border-gray-300"
                  } text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
                  placeholder="Describe your teaching methodology and activities in detail. Include interactive elements, demonstrations, group work, etc..."
                />
                {errors.activities && (
                  <p className="text-red-500 text-xs mt-1">{errors.activities}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Required for submission to coordinator
                </p>
              </div>

              {/* Required Resources */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-blue-600" />
                  Required Resources <span className="text-red-500">*</span>
                </h3>

                {/* Text Description */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Resource Description (Optional)
                  </label>
                  <textarea
                    value={formData.resources}
                    onChange={(e) =>
                      setFormData({ ...formData, resources: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                    placeholder="List materials, equipment, or general resources needed..."
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
                          PDF, DOC, PPT, Images (Max 10MB)
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {resourceFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {resourceFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <DocumentIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
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
                      ))}
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
                            placeholder="Link Title (e.g., Khan Academy Tutorial)"
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

                {errors.resources && (
                  <p className="text-red-500 text-xs mt-1">{errors.resources}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Add at least one resource (description, file, or link) for submission
                </p>
              </div>

              {/* Evaluation Criteria */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  Evaluation Criteria
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

                {/* Optional Text Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Additional Notes (Optional)
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                    placeholder="Add any additional notes about grading criteria, rubrics, or special considerations..."
                  />
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
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileTextIcon className="h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Submit for Approval
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