/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpenIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  CheckIcon,
  TrashIcon,
  PencilSquareIcon,
  DocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

/* ==============================
   TYPES & INTERFACES
   ============================== */
interface Chapter {
  id: string;
  name: string;
  code?: string; // Chapter Code/Number
  description: string;
  order: number;
  estimatedDuration?: number; // Duration in hours
  durationUnit?: "hours" | "weeks"; // Unit for duration
}

interface AssessmentMapping {
  assessmentType: string;
  weightage?: number; // Weightage percentage for this assessment type
}

interface LearningOutcome {
  id: string;
  chapterId: string;
  outcome: string;
  assessmentMappings: AssessmentMapping[]; // Multiple assessment type mappings
  bloomLevel?: string; // Bloom's Taxonomy level
}

interface AssessmentType {
  id: string;
  name: string;
  description: string;
}

interface Curriculum {
  id: string;
  subject: string;
  class: string;
  academicYear: string; // Academic Year
  chapters: Chapter[];
  learningOutcomes: LearningOutcome[];
  assessmentTypes: AssessmentType[];
  status: "draft" | "pending_approval" | "approved" | "rejected";
  lastModified: string;
  createdBy: string; // Teacher ID (required)
  approvedBy?: string; // Academic Coordinator ID
  approvalDate?: string;
  rejectionReason?: string;
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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
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
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
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
  color?: "blue" | "green" | "purple" | "amber" | "red";
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
   ADD CHAPTER MODAL
   ============================== */
const AddChapterModal = ({
  isOpen,
  onClose,
  onCreated,
  editChapter,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (chapter: Chapter) => void;
  editChapter?: Chapter | null;
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"hours" | "weeks">("hours");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editChapter) {
      setName(editChapter.name);
      setCode(editChapter.code || "");
      setDescription(editChapter.description);
      setEstimatedDuration(editChapter.estimatedDuration?.toString() || "");
      setDurationUnit(editChapter.durationUnit || "hours");
    } else {
      setName("");
      setCode("");
      setDescription("");
      setEstimatedDuration("");
      setDurationUnit("hours");
    }
  }, [editChapter, isOpen]);

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setEstimatedDuration("");
    setDurationUnit("hours");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!name || name.length < 3) {
      setError("Chapter name must be at least 3 characters long");
      return;
    }

    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      onCreated({
        id: editChapter?.id || Date.now().toString(),
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim(),
        order: editChapter?.order || 0,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        durationUnit: estimatedDuration ? durationUnit : undefined,
      });
      setSubmitting(false);
      handleClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={editChapter ? "Edit Chapter" : "Add New Chapter"}
      subtitle={
        editChapter
          ? "Update chapter details"
          : "Add a new chapter to your curriculum"
      }
    >
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-lg border ${
                error ? "border-red-300" : "border-gray-300"
              } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
              placeholder="e.g., Introduction to Algebra"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 3 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Code/Number
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              placeholder="e.g., CH-01 or 1.1"
            />
            <p className="mt-1 text-xs text-gray-500">Optional identifier</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="e.g., 8"
                min="1"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as "hours" | "weeks")}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="hours">Hours</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Optional teaching time</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
            placeholder="Brief description of what this chapter covers..."
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleClose}
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
              {editChapter ? "Updating..." : "Adding..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editChapter ? "Update Chapter" : "Add Chapter"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   ADD LEARNING OUTCOME MODAL
   ============================== */
const AddLearningOutcomeModal = ({
  isOpen,
  onClose,
  onCreated,
  chapters,
  editOutcome,
  assessmentTypes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (outcome: LearningOutcome) => void;
  chapters: Chapter[];
  editOutcome?: LearningOutcome | null;
  assessmentTypes: AssessmentType[];
}) => {
  const bloomLevels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];

  const [chapterId, setChapterId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [bloomLevel, setBloomLevel] = useState("");
  const [assessmentMappings, setAssessmentMappings] = useState<AssessmentMapping[]>([]);
  const [currentAssessmentType, setCurrentAssessmentType] = useState("");
  const [currentWeightage, setCurrentWeightage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editOutcome) {
      setChapterId(editOutcome.chapterId);
      setOutcome(editOutcome.outcome);
      setBloomLevel(editOutcome.bloomLevel || "");
      setAssessmentMappings(editOutcome.assessmentMappings || []);
    } else {
      setChapterId("");
      setOutcome("");
      setBloomLevel("");
      setAssessmentMappings([]);
    }
    setCurrentAssessmentType("");
    setCurrentWeightage("");
  }, [editOutcome, isOpen]);

  const resetForm = () => {
    setChapterId("");
    setOutcome("");
    setBloomLevel("");
    setAssessmentMappings([]);
    setCurrentAssessmentType("");
    setCurrentWeightage("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddAssessmentMapping = () => {
    if (!currentAssessmentType) {
      setError("Please select an assessment type");
      return;
    }

    // Check if already added
    if (assessmentMappings.some(m => m.assessmentType === currentAssessmentType)) {
      setError("This assessment type is already added");
      return;
    }

    const newMapping: AssessmentMapping = {
      assessmentType: currentAssessmentType,
      weightage: currentWeightage ? parseFloat(currentWeightage) : undefined,
    };

    setAssessmentMappings([...assessmentMappings, newMapping]);
    setCurrentAssessmentType("");
    setCurrentWeightage("");
    setError(null);
  };

  const handleRemoveAssessmentMapping = (assessmentType: string) => {
    setAssessmentMappings(assessmentMappings.filter(m => m.assessmentType !== assessmentType));
  };

  const handleSubmit = () => {
    if (!chapterId) {
      setError("Please select a chapter");
      return;
    }
    if (!outcome.trim()) {
      setError("Learning Outcome required.");
      return;
    }
    if (assessmentMappings.length === 0) {
      setError("Please add at least one assessment type mapping");
      return;
    }

    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      onCreated({
        id: editOutcome?.id || Date.now().toString(),
        chapterId,
        outcome: outcome.trim(),
        assessmentMappings,
        bloomLevel: bloomLevel || undefined,
      });
      setSubmitting(false);
      handleClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={editOutcome ? "Edit Learning Outcome" : "Add Learning Outcome"}
      subtitle={
        editOutcome
          ? "Update learning outcome details"
          : "Define what students should achieve"
      }
    >
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Chapter <span className="text-red-500">*</span>
          </label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className={`w-full rounded-lg border ${
              error && !chapterId ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
          >
            <option value="">Choose a chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Outcome <span className="text-red-500">*</span>
          </label>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={4}
            className={`w-full rounded-lg border ${
              error && !outcome.trim() ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none`}
            placeholder="Describe what students should be able to do after this chapter..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bloom's Taxonomy Level
          </label>
          <select
            value={bloomLevel}
            onChange={(e) => setBloomLevel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Select Bloom's Level (Optional)</option>
            {bloomLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Cognitive complexity level for this outcome
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Type Mappings <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Map this learning outcome to one or more assessment types
          </p>

          {/* Add Assessment Mapping */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assessment Type
                </label>
                <select
                  value={currentAssessmentType}
                  onChange={(e) => setCurrentAssessmentType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                >
                  <option value="">Select Type</option>
                  {assessmentTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Weightage % (Optional)
                </label>
                <input
                  type="number"
                  value={currentWeightage}
                  onChange={(e) => setCurrentWeightage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  placeholder="e.g., 20"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAssessmentMapping}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add Assessment Mapping
            </button>
          </div>

          {/* Display Added Mappings */}
          {assessmentMappings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Added Mappings ({assessmentMappings.length}):
              </p>
              {assessmentMappings.map((mapping, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {mapping.assessmentType}
                      </p>
                      {mapping.weightage && (
                        <p className="text-xs text-gray-600">
                          Weightage: {mapping.weightage}%
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssessmentMapping(mapping.assessmentType)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove mapping"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {assessmentMappings.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Please add at least one assessment type mapping
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editOutcome ? "Updating..." : "Adding..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editOutcome ? "Update Outcome" : "Add Outcome"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   CHAPTER CARD COMPONENT
   ============================== */
const ChapterCard = ({
  chapter,
  index,
  outcomesCount,
  onEdit,
  onDelete,
  onAddOutcome,
}: {
  chapter: Chapter;
  index: number;
  outcomesCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddOutcome: () => void;
}) => {
  return (
    <div className="group relative rounded-lg border-2 border-gray-200 bg-white p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
              {chapter.name}
            </h3>
            {chapter.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {chapter.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <AcademicCapIcon className="h-4 w-4" />
          {outcomesCount} Outcome{outcomesCount !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onAddOutcome}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Add Learning Outcome"
          >
            <PlusCircleIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Chapter"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Chapter"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};



/* ==============================
   COPY CURRICULUM MODAL
   ============================== */
const CopyCurriculumModal = ({
  isOpen,
  onClose,
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceClass: string, sourceSubject: string) => void;
}) => {
  const [sourceClass, setSourceClass] = useState("");
  const [sourceSubject, setSourceSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const classes = ["9", "10", "11", "12"];
  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Computer Science",
    "Economics",
  ];

  const handleCopy = () => {
    if (!sourceClass || !sourceSubject) {
      alert("Please select both class and subject");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      onCopy(sourceClass, sourceSubject);
      setSubmitting(false);
      onClose();
      alert(`Curriculum copied from Class ${sourceClass} - ${sourceSubject}`);
    }, 800);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Copy Curriculum Template"
      subtitle="Copy chapters and learning outcomes from another curriculum"
    >
      <div className="space-y-5">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            This will copy all chapters and learning outcomes from the selected curriculum as a template. You can then modify them as needed.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Class <span className="text-red-500">*</span>
          </label>
          <select
            value={sourceClass}
            onChange={(e) => setSourceClass(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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
            Source Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={sourceSubject}
            onChange={(e) => setSourceSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
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
          onClick={handleCopy}
          disabled={submitting}
          className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Copying...
            </>
          ) : (
            <>
              <DocumentDuplicateIcon className="h-4 w-4" />
              Copy Curriculum
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   EXPORT CURRICULUM MODAL
   ============================== */
const ExportCurriculumModal = ({
  isOpen,
  onClose,
  onExport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "pdf" | "excel") => void;
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel">("pdf");
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      onExport(selectedFormat);
      setExporting(false);
      onClose();
      alert(`Curriculum exported as ${selectedFormat.toUpperCase()}`);
    }, 1000);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Export Curriculum"
      subtitle="Download curriculum in your preferred format"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedFormat("pdf")}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedFormat === "pdf"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  selectedFormat === "pdf"
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <DocumentCheckIcon className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">PDF</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Formatted document
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat("excel")}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedFormat === "excel"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  selectedFormat === "excel"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <ArrowDownTrayIcon className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">Excel</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Spreadsheet format
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Export will include:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ All chapters with descriptions</li>
            <li>✓ Learning outcomes per chapter</li>
            <li>✓ Assessment type mappings</li>
            <li>✓ Bloom's taxonomy levels</li>
            <li>✓ Duration estimates</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={exporting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {exporting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export as {selectedFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN CURRICULUM BUILDER COMPONENT
   ============================== */
const CurriculumBuilder: React.FC = () => {
  // Sample data
  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Computer Science",
    "Economics",
  ];

  const classes = ["9", "10", "11", "12"];
  
  const academicYears = [
    "2024-2025",
    "2025-2026",
    "2026-2027",
  ];

  const bloomLevels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];

  // Assessment Types (as per requirements)
  const assessmentTypes: AssessmentType[] = [
    { id: "1", name: "Written Test", description: "Traditional written examination" },
    { id: "2", name: "Practical Exam", description: "Hands-on practical assessment" },
    { id: "3", name: "Project", description: "Project-based evaluation" },
    { id: "4", name: "Assignment", description: "Take-home assignments" },
    { id: "5", name: "Presentation", description: "Oral presentation" },
    { id: "6", name: "Quiz", description: "Short quiz assessment" },
    { id: "7", name: "Lab Work", description: "Laboratory work evaluation" },
    { id: "8", name: "Class Participation", description: "Active participation in class" },
  ];

  // State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>(
    []
  );
  const [status, setStatus] = useState<"draft" | "pending_approval" | "approved" | "rejected">("draft");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [createdBy] = useState("current_teacher_id"); // TODO: Get from auth context
  const [approvedBy, setApprovedBy] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Modal states
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showAddOutcomeModal, setShowAddOutcomeModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingOutcome, setEditingOutcome] = useState<LearningOutcome | null>(
    null
  );
  const [selectedChapterForOutcome, setSelectedChapterForOutcome] = useState<
    string | null
  >(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track changes
  useEffect(() => {
    if (chapters.length > 0 || learningOutcomes.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [chapters, learningOutcomes]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && (status === "draft" || status === "rejected")) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, chapters, learningOutcomes, status]);

  const handleAutoSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  // Filtered chapters based on search
  const filteredChapters = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (chapter) =>
        chapter.name.toLowerCase().includes(q) ||
        chapter.description.toLowerCase().includes(q)
    );
  }, [chapters, searchQuery]);

  // Validation
  const validateCurriculum = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedAcademicYear) {
      newErrors.academicYear = "Academic Year is mandatory";
    }
    if (!selectedSubject) {
      newErrors.subject = "Subject is mandatory";
    }
    if (!selectedClass) {
      newErrors.class = "Class is mandatory";
    }
    if (chapters.length === 0) {
      newErrors.chapters = "At least one chapter is required";
    }
    if (learningOutcomes.length === 0) {
      newErrors.outcomes = "Learning Outcomes cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Chapter handlers
  const handleAddChapter = (chapter: Chapter) => {
    if (editingChapter) {
      setChapters((prev) =>
        prev.map((ch) => (ch.id === chapter.id ? chapter : ch))
      );
      setEditingChapter(null);
    } else {
      setChapters((prev) => [
        ...prev,
        { ...chapter, order: prev.length + 1 },
      ]);
    }
    setShowAddChapterModal(false);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowAddChapterModal(true);
  };

  const handleDeleteChapter = (id: string) => {
    if (window.confirm("Are you sure you want to delete this chapter?")) {
      setChapters((prev) => prev.filter((ch) => ch.id !== id));
      setLearningOutcomes((prev) => prev.filter((lo) => lo.chapterId !== id));
    }
  };

  // Learning outcome handlers
  const handleAddOutcome = (outcome: LearningOutcome) => {
    if (editingOutcome) {
      setLearningOutcomes((prev) =>
        prev.map((lo) => (lo.id === outcome.id ? outcome : lo))
      );
      setEditingOutcome(null);
    } else {
      setLearningOutcomes((prev) => [...prev, outcome]);
    }
    setShowAddOutcomeModal(false);
    setSelectedChapterForOutcome(null);
  };

  const handleEditOutcome = (outcome: LearningOutcome) => {
    setEditingOutcome(outcome);
    setShowAddOutcomeModal(true);
  };

  const handleDeleteOutcome = (id: string) => {
    if (window.confirm("Are you sure you want to delete this outcome?")) {
      setLearningOutcomes((prev) => prev.filter((lo) => lo.id !== id));
    }
  };

  const handleAddOutcomeToChapter = (chapterId: string) => {
    setSelectedChapterForOutcome(chapterId);
    setShowAddOutcomeModal(true);
  };

  // Submit for approval handler
  const handleSubmitForApproval = () => {
    if (!validateCurriculum()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to submit this curriculum for Academic Coordinator approval?"
      )
    ) {
      setStatus("pending_approval");
      setHasUnsavedChanges(false);
      alert("Curriculum submitted for approval! The Academic Coordinator will review it.");
    }
  };

  // Approve handler (for Academic Coordinator only)
  const handleApprove = () => {
    if (window.confirm("Approve this curriculum?")) {
      setStatus("approved");
      setApprovedBy("academic_coordinator_id"); // TODO: Get from auth context
      setHasUnsavedChanges(false);
      alert("Curriculum approved successfully!");
    }
  };

  // Reject handler (for Academic Coordinator only)
  const handleReject = () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      setStatus("rejected");
      setRejectionReason(reason);
      setHasUnsavedChanges(false);
      alert("Curriculum rejected. Teacher will be notified.");
    }
  };

  // Save draft handler
  const handleSaveDraft = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  // Copy curriculum handler
  const handleCopyCurriculum = (sourceClass: string, sourceSubject: string) => {
    // TODO: Fetch curriculum from source and copy
    // For now, just show a success message
    console.log(`Copying from Class ${sourceClass} - ${sourceSubject}`);
  };

  // Export curriculum handler
  const handleExportCurriculum = (format: "pdf" | "excel") => {
    // TODO: Implement actual export logic
    console.log(`Exporting as ${format}`);
  };

  // Stats
  const totalChapters = chapters.length;
  const totalOutcomes = learningOutcomes.length;
  const completionRate =
    totalChapters > 0
      ? Math.round(
          (chapters.filter((ch) =>
            learningOutcomes.some((lo) => lo.chapterId === ch.id)
          ).length /
            totalChapters) *
            100
        )
      : 0;

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
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Curriculum Builder
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage curriculum for subjects & classes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCopyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              title="Copy from another curriculum"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Copy Template
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={chapters.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Export curriculum"
            >
              <ArrowUpIcon className="h-4 w-4" />
              Export
            </button>
            {status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Approved
              </span>
            )}
            {status === "pending_approval" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                <ClockIcon className="h-4 w-4" />
                Pending Approval
              </span>
            )}
            {status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Rejected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">
                Please fix the following errors:
              </h3>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {Object.values(errors).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Banner */}
      {status === "rejected" && rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">
                Curriculum Rejected by Academic Coordinator
              </h3>
              <p className="text-red-700 text-sm">{rejectionReason}</p>
              <p className="text-red-600 text-xs mt-2">
                Please make the necessary changes and resubmit for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-80 space-y-5 flex-shrink-0">
          {/* Subject & Class Selection */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                disabled={status === "approved" || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.academicYear ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={status === "approved" || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.subject ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={status === "approved" || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.class ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
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

          {/* Stats */}
          <div className="space-y-3">
            <StatsCard
              label="Total Chapters"
              value={totalChapters}
              icon={BookOpenIcon}
              color="blue"
            />
            <StatsCard
              label="Learning Outcomes"
              value={totalOutcomes}
              icon={AcademicCapIcon}
              color="green"
            />
            <StatsCard
              label="Completion"
              value={`${completionRate}%`}
              icon={DocumentCheckIcon}
              color="purple"
            />
          </div>

          {/* Status Card */}
          <div className={`rounded-xl border p-5 ${
            status === "approved"
              ? "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200"
              : status === "pending_approval"
              ? "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200"
              : status === "rejected"
              ? "bg-gradient-to-br from-red-50 to-rose-100 border-red-200"
              : "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg ${
                  status === "approved"
                    ? "bg-green-500 text-white"
                    : status === "pending_approval"
                    ? "bg-amber-500 text-white"
                    : status === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-indigo-500 text-white"
                }`}
              >
                {status === "approved" ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : status === "pending_approval" ? (
                  <ClockIcon className="h-4 w-4" />
                ) : status === "rejected" ? (
                  <ExclamationTriangleIcon className="h-4 w-4" />
                ) : (
                  <DocumentCheckIcon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold mb-1 ${
                  status === "approved" ? "text-green-900" :
                  status === "pending_approval" ? "text-amber-900" :
                  status === "rejected" ? "text-red-900" : "text-indigo-900"
                }`}>
                  {status === "approved" ? "Approved" :
                   status === "pending_approval" ? "Pending Approval" :
                   status === "rejected" ? "Rejected" : "Draft"}
                </h3>
                <p className={`text-xs ${
                  status === "approved" ? "text-green-700" :
                  status === "pending_approval" ? "text-amber-700" :
                  status === "rejected" ? "text-red-700" : "text-indigo-700"
                }`}>
                  {status === "approved"
                    ? "This curriculum is approved and active"
                    : status === "pending_approval"
                    ? "Waiting for Academic Coordinator approval"
                    : status === "rejected"
                    ? "Needs revision before resubmission"
                    : "Save your progress or submit for approval when ready"}
                </p>
              </div>
            </div>
            {hasUnsavedChanges && status === "draft" && (
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <p className="text-xs font-medium text-indigo-800">
                  ⚠️ You have unsaved changes
                </p>
              </div>
            )}
            {approvedBy && status === "approved" && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-medium text-green-800">
                  ✓ Approved by Academic Coordinator
                </p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Need Help?
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Select subject and class, add chapters, then define learning
                  outcomes for each chapter. All fields marked with * are
                  required.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 space-y-6">
          {/* Chapters Section */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Chapters ({totalChapters})
                </h2>
                <button
                  onClick={() => {
                    setEditingChapter(null);
                    setShowAddChapterModal(true);
                  }}
                  disabled={status === "approved" || status === "pending_approval"}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Add Chapter
                </button>
              </div>

              {chapters.length > 0 && (
                <div className="mt-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search chapters..."
                  />
                </div>
              )}
            </div>

            <div className="p-5">
              {filteredChapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {chapters.length === 0
                      ? "No chapters yet"
                      : "No chapters found"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {chapters.length === 0
                      ? "Start building your curriculum by adding chapters"
                      : "Try adjusting your search criteria"}
                  </p>
                  {chapters.length === 0 && status !== "approved" && status !== "pending_approval" && (
                    <button
                      onClick={() => {
                        setEditingChapter(null);
                        setShowAddChapterModal(true);
                      }}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      Add Your First Chapter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChapters.map((chapter, index) => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      index={index}
                      outcomesCount={
                        learningOutcomes.filter(
                          (lo) => lo.chapterId === chapter.id
                        ).length
                      }
                      onEdit={() => handleEditChapter(chapter)}
                      onDelete={() => handleDeleteChapter(chapter.id)}
                      onAddOutcome={() =>
                        handleAddOutcomeToChapter(chapter.id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Learning Outcomes Section */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Learning Outcomes by Chapter
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalOutcomes} total outcome{totalOutcomes !== 1 ? "s" : ""} across {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {chapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No chapters added yet
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Add chapters first, then you can define learning outcomes for each chapter
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {chapters.map((chapter, idx) => {
                    const outcomes = learningOutcomes.filter(
                      (lo) => lo.chapterId === chapter.id
                    );

                    return (
                      <div
                        key={chapter.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
                      >
                        {/* Chapter Header */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white text-sm font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-base">
                                  {chapter.name}
                                </h3>
                                {chapter.description && (
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold">
                                <AcademicCapIcon className="h-4 w-4" />
                                {outcomes.length} Outcome{outcomes.length !== 1 ? "s" : ""}
                              </span>
                              {status !== "approved" && status !== "pending_approval" && (
                                <button
                                  onClick={() =>
                                    handleAddOutcomeToChapter(chapter.id)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                                >
                                  <PlusCircleIcon className="h-4 w-4" />
                                  Add Outcome
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Outcomes List */}
                        <div className="p-5">
                          {outcomes.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                No learning outcomes defined for this chapter yet
                              </p>
                              {status !== "approved" && status !== "pending_approval" && (
                                <button
                                  onClick={() =>
                                    handleAddOutcomeToChapter(chapter.id)
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                  <PlusCircleIcon className="h-4 w-4" />
                                  Add First Outcome
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {outcomes.map((outcome, outcomeIdx) => (
                                <div
                                  key={outcome.id}
                                  className="group relative rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                                      {outcomeIdx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <p className="text-sm text-gray-800 leading-relaxed">
                                        {outcome.outcome}
                                      </p>
                                      
                                      {/* Display Bloom's Level */}
                                      {outcome.bloomLevel && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500">Bloom's Level:</span>
                                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            {outcome.bloomLevel}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Display Assessment Mappings */}
                                      {outcome.assessmentMappings && outcome.assessmentMappings.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs text-gray-500">Assessments:</span>
                                          {outcome.assessmentMappings.map((mapping, mapIdx) => (
                                            <span
                                              key={mapIdx}
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                                            >
                                              {mapping.assessmentType}
                                              {mapping.weightage && (
                                                <span className="text-indigo-900 font-semibold">
                                                  {mapping.weightage}%
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {status !== "approved" && status !== "pending_approval" && (
                                        <>
                                          <button
                                            onClick={() => handleEditOutcome(outcome)}
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Edit Outcome"
                                          >
                                            <PencilSquareIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOutcome(outcome.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Outcome"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pb-6">
            {(status === "draft" || status === "rejected") && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={!hasUnsavedChanges}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <ArchiveBoxIcon className="h-5 w-5" />
                  Save Draft
                </button>
                <button
                  onClick={handleSubmitForApproval}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md hover:shadow-lg"
                >
                  <DocumentCheckIcon className="h-5 w-5" />
                  Submit for Approval
                </button>
              </>
            )}
            {status === "pending_approval" && (
              <div className="text-sm text-amber-600 font-medium">
                ⏳ Waiting for Academic Coordinator approval...
              </div>
            )}
            {/* TODO: Show these buttons only for Academic Coordinator role */}
            {status === "pending_approval" && false && ( // Change false to role check
              <>
                <button
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md hover:shadow-lg"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Approve Curriculum
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddChapterModal
        isOpen={showAddChapterModal}
        onClose={() => {
          setShowAddChapterModal(false);
          setEditingChapter(null);
        }}
        onCreated={handleAddChapter}
        editChapter={editingChapter}
      />

      <AddLearningOutcomeModal
        isOpen={showAddOutcomeModal}
        onClose={() => {
          setShowAddOutcomeModal(false);
          setEditingOutcome(null);
          setSelectedChapterForOutcome(null);
        }}
        onCreated={(outcome) => {
          if (selectedChapterForOutcome && !editingOutcome) {
            handleAddOutcome({
              ...outcome,
              chapterId: selectedChapterForOutcome,
            });
          } else {
            handleAddOutcome(outcome);
          }
        }}
        chapters={chapters}
        editOutcome={editingOutcome}
        assessmentTypes={assessmentTypes}
      />

      <CopyCurriculumModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopy={handleCopyCurriculum}
      />

      <ExportCurriculumModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportCurriculum}
      />
    </div>
  );
};

export default CurriculumBuilder;