/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpenIcon,
  PlusCircleIcon,
  XMarkIcon,
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
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../common/SearchBar";
import Pagination from "../Pagination";
import toast from "react-hot-toast";

/* ==============================
   TYPES & INTERFACES (College-adapted)
   ============================== */
interface Unit {
  id: string;
  name: string;
  code?: string; // Unit Code/Number
  description: string;
  order: number;
  estimatedDuration?: number; // Duration in hours
  durationUnit?: "hours" | "weeks"; // Unit for duration
  credits?: number; // College-specific: Credits for this unit
}

interface AssessmentMapping {
  assessmentType: string;
  weightage?: number; // Weightage percentage for this assessment type
}

interface LearningOutcome {
  id: string;
  unitId: string; // Changed from chapterId to unitId
  outcome: string;
  assessmentMappings: AssessmentMapping[]; // Multiple assessment type mappings
  bloomLevel?: string; // Bloom's Taxonomy level
}

interface AssessmentType {
  id: string;
  name: string;
  description: string;
}
// Curriculum interface - keeping for reference but not used in component
// interface Curriculum {
//   id: string;
//   course: string; // Changed from subject
//   department: string; // College-specific
//   program: string; // College-specific  
//   semester: string; // Changed from class
//   academicYear: string;
//   units: Unit[]; // Changed from chapters
//   learningOutcomes: LearningOutcome[];
//   assessmentTypes: AssessmentType[];
//   status: "draft" | "pending_approval" | "approved" | "rejected";
//   lastModified: string;
//   createdBy: string; // Faculty ID (required)
//   approvedBy?: string; // Academic Head ID
//   approvalDate?: string;
//   rejectionReason?: string;
// }

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
   ADD UNIT MODAL (College-adapted)
   ============================== */
const AddUnitModal = ({
  isOpen,
  onClose,
  onCreated,
  editUnit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (unit: Unit) => void;
  editUnit?: Unit | null;
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"hours" | "weeks">("hours");
  const [credits, setCredits] = useState(""); // College-specific
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editUnit) {
      setName(editUnit.name);
      setCode(editUnit.code || "");
      setDescription(editUnit.description);
      setEstimatedDuration(editUnit.estimatedDuration?.toString() || "");
      setDurationUnit(editUnit.durationUnit || "hours");
      setCredits(editUnit.credits?.toString() || "");
    } else {
      setName("");
      setCode("");
      setDescription("");
      setEstimatedDuration("");
      setDurationUnit("hours");
      setCredits("");
    }
  }, [editUnit, isOpen]);

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setEstimatedDuration("");
    setDurationUnit("hours");
    setCredits("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  const handleSubmit = () => {
    if (!name || name.length < 3) {
      setError("Unit name must be at least 3 characters long");
      return;
    }

    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      onCreated({
        id: editUnit?.id || Date.now().toString(),
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim(),
        order: editUnit?.order || 0,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        durationUnit: estimatedDuration ? durationUnit : undefined,
        credits: credits ? parseFloat(credits) : undefined,
      });
      setSubmitting(false);
      handleClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={editUnit ? "Edit Unit/Module" : "Add New Unit/Module"}
      subtitle={
        editUnit
          ? "Update unit details"
          : "Add a new unit/module to your curriculum"
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
              Unit/Module Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-lg border ${
                error ? "border-red-300" : "border-gray-300"
              } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
              placeholder="e.g., Introduction to Data Structures"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 3 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Code/Number
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              placeholder="e.g., UNIT-01 or 1.1"
            />
            <p className="mt-1 text-xs text-gray-500">Optional identifier</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits
            </label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              placeholder="e.g., 3"
              min="0"
              step="0.5"
            />
            <p className="mt-1 text-xs text-gray-500">Credit hours for this unit</p>
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
            placeholder="Brief description of what this unit covers..."
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
              {editUnit ? "Updating..." : "Adding..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editUnit ? "Update Unit" : "Add Unit"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};
/* ==============================
   ADD LEARNING OUTCOME MODAL (College-adapted)
   ============================== */
const AddLearningOutcomeModal = ({
  isOpen,
  onClose,
  onCreated,
  units,
  editOutcome,
  assessmentTypes,
  selectedUnitForOutcome,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (outcome: LearningOutcome) => void;
  units: Unit[];
  editOutcome?: LearningOutcome | null;
  assessmentTypes: AssessmentType[];
  selectedUnitForOutcome?: string | null;
}) => {
  const bloomLevels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];

  const [unitId, setUnitId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [bloomLevel, setBloomLevel] = useState("");
  const [assessmentMappings, setAssessmentMappings] = useState<AssessmentMapping[]>([]);
  const [currentAssessmentType, setCurrentAssessmentType] = useState("");
  const [currentWeightage, setCurrentWeightage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editOutcome) {
      setUnitId(editOutcome.unitId);
      setOutcome(editOutcome.outcome);
      setBloomLevel(editOutcome.bloomLevel || "");
      setAssessmentMappings(editOutcome.assessmentMappings || []);
    } else {
      // If opened from a specific unit, pre-select it
      setUnitId(selectedUnitForOutcome || "");
      setOutcome("");
      setBloomLevel("");
      setAssessmentMappings([]);
    }
    setCurrentAssessmentType("");
    setCurrentWeightage("");
  }, [editOutcome, isOpen, selectedUnitForOutcome]);
  const resetForm = () => {
    setUnitId("");
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
    if (!unitId) {
      setError("Please select a unit");
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
        unitId,
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
            Select Unit/Module <span className="text-red-500">*</span>
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className={`w-full rounded-lg border ${
              error && !unitId ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors`}
          >
            <option value="">Choose a unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
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
            placeholder="Describe what students should be able to do after this unit..."
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
                  disabled={assessmentTypes.length === 0}
                >
                  <option value="">
                    {assessmentTypes.length === 0 ? "Loading assessment types..." : "Select Type"}
                  </option>
                  {assessmentTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {assessmentTypes.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Loading available assessment types...
                  </p>
                )}
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
              disabled={assessmentTypes.length === 0}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <PlusCircleIcon className="h-4 w-4" />
              {assessmentTypes.length === 0 ? "Loading..." : "Add Assessment Mapping"}
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
                {assessmentTypes.length === 0 && " (Loading assessment types...)"}
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
   UNIT CARD COMPONENT (College-adapted)
   ============================== */
const UnitCard = ({
  unit,
  index,
  outcomesCount,
  onEdit,
  onDelete,
  onAddOutcome,
}: {
  unit: Unit;
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
              {unit.name}
            </h3>
            {unit.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {unit.description}
              </p>
            )}
            {unit.credits && (
              <p className="text-xs text-indigo-600 font-medium mt-1">
                {unit.credits} Credit{unit.credits !== 1 ? 's' : ''}
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
            title="Edit Unit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Unit"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
/* ==============================
   MAIN COLLEGE CURRICULUM BUILDER COMPONENT
   ============================== */
interface CollegeCurriculumBuilderProps {
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
  courses?: Array<{ id: string; value: string; label: string; code: string; name: string; credits?: number; type?: string }>;
  departments?: Array<{ id: string; name: string }>;
  programs?: Array<{ id: string; name: string }>;
  semesters?: string[];
  academicYears?: string[];
  // Data
  curriculumId?: string | null;
  units?: Unit[]; // Changed from chapters
  learningOutcomes?: LearningOutcome[];
  assessmentTypes?: AssessmentType[];
  status?: "draft" | "pending_approval" | "approved" | "rejected";
  rejectionReason?: string;
  loading?: boolean;
  saveStatus?: "idle" | "saving" | "saved";
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  // Handlers (adapted for college)
  onAddUnit?: (unit: Unit) => Promise<void>;
  onDeleteUnit?: (id: string) => Promise<void>;
  onAddOutcome?: (outcome: LearningOutcome) => Promise<void>;
  onDeleteOutcome?: (id: string) => Promise<void>;
  onSubmitForApproval?: () => Promise<void>;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
}
const CollegeCurriculumBuilder: React.FC<CollegeCurriculumBuilderProps> = (props) => {
  // Mock user role (no database connection)
  const [isCollegeAdmin] = React.useState(true); // College admin has direct approval authority

  // College-specific assessment types (as per requirements)
  const defaultCollegeAssessmentTypes: AssessmentType[] = [
    { id: "1", name: "IA (Internal Assessment)", description: "Continuous internal assessment" },
    { id: "2", name: "End-Semester Exam", description: "Final semester examination" },
    { id: "3", name: "Practical Exam", description: "Hands-on practical assessment" },
    { id: "4", name: "Viva", description: "Oral examination/interview" },
    { id: "5", name: "Arrears", description: "Supplementary examination" },
    { id: "6", name: "Project", description: "Project-based evaluation" },
    { id: "7", name: "Assignment", description: "Take-home assignments" },
    { id: "8", name: "Presentation", description: "Oral presentation" },
  ];

  const assessmentTypes = props.assessmentTypes ?? defaultCollegeAssessmentTypes;

  // Configuration data - use props or fallback to defaults
  const courses = props.courses ?? [];
  const departments = props.departments ?? [];
  const programs = props.programs ?? [];
  const semesters = props.semesters ?? [];
  const academicYears = props.academicYears ?? [];

  // State - use props if provided, otherwise use local state
  const [localSelectedCourse, localSetSelectedCourse] = useState("");
  const [localSelectedDepartment, localSetSelectedDepartment] = useState("");
  const [localSelectedProgram, localSetSelectedProgram] = useState("");
  const [localSelectedSemester, localSetSelectedSemester] = useState("");
  const [localSelectedAcademicYear, localSetSelectedAcademicYear] = useState("");
  const [localUnits, localSetUnits] = useState<Unit[]>([]);
  const [localLearningOutcomes, localSetLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [localStatus, localSetStatus] = useState<"draft" | "pending_approval" | "approved" | "rejected">("draft");
  const [localSearchQuery, localSetSearchQuery] = useState("");
  const [localSaveStatus, localSetSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [localRejectionReason] = useState<string | undefined>();

  // Pagination state
  const [unitsCurrentPage, setUnitsCurrentPage] = useState(1);
  const [outcomesCurrentPage, setOutcomesCurrentPage] = useState(1);
  const unitsPerPage = 6; // Show 6 units per page
  const outcomesPerPage = 8; // Show 8 units with outcomes per page (increased for compact design)
  // Use props or local state
  const selectedCourse = props.selectedCourse ?? localSelectedCourse;
  const setSelectedCourse = props.setSelectedCourse ?? localSetSelectedCourse;
  const selectedDepartment = props.selectedDepartment ?? localSelectedDepartment;
  const setSelectedDepartment = props.setSelectedDepartment ?? localSetSelectedDepartment;
  const selectedProgram = props.selectedProgram ?? localSelectedProgram;
  const setSelectedProgram = props.setSelectedProgram ?? localSetSelectedProgram;
  const selectedSemester = props.selectedSemester ?? localSelectedSemester;
  const setSelectedSemester = props.setSelectedSemester ?? localSetSelectedSemester;
  const selectedAcademicYear = props.selectedAcademicYear ?? localSelectedAcademicYear;
  const setSelectedAcademicYear = props.setSelectedAcademicYear ?? localSetSelectedAcademicYear;
  const units = props.units ?? localUnits;
  const setUnits = localSetUnits;
  const learningOutcomes = props.learningOutcomes ?? localLearningOutcomes;
  const setLearningOutcomes = localSetLearningOutcomes;
  const status = props.status ?? localStatus;
  const setStatus = localSetStatus;
  const searchQuery = props.searchQuery ?? localSearchQuery;
  const setSearchQuery = props.setSearchQuery ?? localSetSearchQuery;
  const saveStatus = props.saveStatus ?? localSaveStatus;
  const setSaveStatus = localSetSaveStatus;
  const rejectionReason = props.rejectionReason ?? localRejectionReason;
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [approvedBy] = useState<string | undefined>();
  
  // State for outcomes search
  const [outcomesSearchQuery, setOutcomesSearchQuery] = useState("");

  // Modal states
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddOutcomeModal, setShowAddOutcomeModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingOutcome, setEditingOutcome] = useState<LearningOutcome | null>(null);
  const [selectedUnitForOutcome, setSelectedUnitForOutcome] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track changes
  useEffect(() => {
    if (units.length > 0 || learningOutcomes.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [units, learningOutcomes]);

  // Reset pagination when search changes
  useEffect(() => {
    setUnitsCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setOutcomesCurrentPage(1);
  }, [outcomesSearchQuery]);
  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && (status === "draft" || status === "rejected")) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, units, learningOutcomes, status]);

  const handleAutoSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  // Filtered units based on search
  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return units;
    return units.filter(
      (unit) =>
        unit.name.toLowerCase().includes(q) ||
        unit.description.toLowerCase().includes(q)
    );
  }, [units, searchQuery]);

  // Paginated units
  const paginatedUnits = useMemo(() => {
    const startIndex = (unitsCurrentPage - 1) * unitsPerPage;
    const endIndex = startIndex + unitsPerPage;
    return filteredUnits.slice(startIndex, endIndex);
  }, [filteredUnits, unitsCurrentPage, unitsPerPage]);

  const unitsTotalPages = Math.ceil(filteredUnits.length / unitsPerPage);

  // Filtered learning outcomes based on search
  const filteredLearningOutcomes = useMemo(() => {
    const q = outcomesSearchQuery.toLowerCase();
    if (!q) return learningOutcomes;
    return learningOutcomes.filter(
      (outcome) =>
        outcome.outcome.toLowerCase().includes(q) ||
        outcome.bloomLevel?.toLowerCase().includes(q) ||
        outcome.assessmentMappings.some(m => 
          m.assessmentType.toLowerCase().includes(q)
        )
    );
  }, [learningOutcomes, outcomesSearchQuery]);

  // Filtered units that have matching outcomes
  const unitsWithFilteredOutcomes = useMemo(() => {
    if (!outcomesSearchQuery) return units;
    
    const outcomeUnitIds = new Set(
      filteredLearningOutcomes.map(o => o.unitId)
    );
    
    return units.filter(unit => outcomeUnitIds.has(unit.id));
  }, [units, filteredLearningOutcomes, outcomesSearchQuery]);

  // Paginated units with outcomes
  const paginatedUnitsWithOutcomes = useMemo(() => {
    const startIndex = (outcomesCurrentPage - 1) * outcomesPerPage;
    const endIndex = startIndex + outcomesPerPage;
    return unitsWithFilteredOutcomes.slice(startIndex, endIndex);
  }, [unitsWithFilteredOutcomes, outcomesCurrentPage, outcomesPerPage]);

  const outcomesTotalPages = Math.ceil(unitsWithFilteredOutcomes.length / outcomesPerPage);
  // Validation
  const validateCurriculum = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedAcademicYear) {
      newErrors.academicYear = "Academic Year is mandatory";
    }
    if (!selectedCourse) {
      newErrors.course = "Course is mandatory";
    }
    if (!selectedDepartment) {
      newErrors.department = "Department is mandatory";
    }
    if (!selectedProgram) {
      newErrors.program = "Program is mandatory";
    }
    if (!selectedSemester) {
      newErrors.semester = "Semester is mandatory";
    }
    if (units.length === 0) {
      newErrors.units = "At least one unit is required";
    }
    if (learningOutcomes.length === 0) {
      newErrors.outcomes = "Learning Outcomes cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Unit handlers
  const handleAddUnit = async (unit: Unit) => {
    if (props.onAddUnit) {
      await props.onAddUnit(unit);
      setShowAddUnitModal(false);
      setEditingUnit(null);
    } else {
      // Fallback to local state
      if (editingUnit) {
        setUnits((prev) =>
          prev.map((u) => (u.id === unit.id ? unit : u))
        );
        setEditingUnit(null);
      } else {
        setUnits((prev) => [
          ...prev,
          { ...unit, order: prev.length + 1 },
        ]);
      }
      setShowAddUnitModal(false);
    }
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowAddUnitModal(true);
  };

  const handleDeleteUnit = async (id: string) => {
    if (props.onDeleteUnit) {
      await props.onDeleteUnit(id);
    } else {
      // Fallback to local state
      if (window.confirm("Are you sure you want to delete this unit?")) {
        setUnits((prev) => prev.filter((u) => u.id !== id));
        setLearningOutcomes((prev) => prev.filter((lo) => lo.unitId !== id));
      }
    }
  };
  // Learning outcome handlers
  const handleAddOutcome = async (outcome: LearningOutcome) => {
    if (props.onAddOutcome) {
      await props.onAddOutcome(outcome);
      setShowAddOutcomeModal(false);
      setEditingOutcome(null);
      setSelectedUnitForOutcome(null);
    } else {
      // Fallback to local state
      if (editingOutcome) {
        setLearningOutcomes((prev) =>
          prev.map((lo) => (lo.id === outcome.id ? outcome : lo))
        );
        setEditingOutcome(null);
      } else {
        setLearningOutcomes((prev) => [...prev, outcome]);
      }
      setShowAddOutcomeModal(false);
      setSelectedUnitForOutcome(null);
    }
  };

  const handleEditOutcome = (outcome: LearningOutcome) => {
    setEditingOutcome(outcome);
    setShowAddOutcomeModal(true);
  };

  const handleDeleteOutcome = async (id: string) => {
    if (props.onDeleteOutcome) {
      await props.onDeleteOutcome(id);
    } else {
      // Fallback to local state
      if (window.confirm("Are you sure you want to delete this outcome?")) {
        setLearningOutcomes((prev) => prev.filter((lo) => lo.id !== id));
      }
    }
  };

  const handleAddOutcomeToUnit = (unitId: string) => {
    setSelectedUnitForOutcome(unitId);
    setShowAddOutcomeModal(true);
  };

  // Submit for approval handler
  const handleSubmitForApproval = async () => {
    if (props.onSubmitForApproval) {
      await props.onSubmitForApproval();
    } else {
      // Fallback to local state
      if (!validateCurriculum()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // College admin can directly approve and publish
      if (window.confirm("Are you sure you want to publish this curriculum? It will be immediately available to students and faculty.")) {
        setStatus("approved");
        setHasUnsavedChanges(false);
        toast.success("Curriculum published successfully! It is now active and available.");
      }
    }
  };
  // Note: Approve and Reject handlers are available via props but not used in current UI
  // They can be added later for Academic Head functionality

  const handleSaveDraft = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  // Stats
  const totalUnits = units.length;
  const totalOutcomes = learningOutcomes.length;
  const totalCredits = units.reduce((sum, unit) => sum + (unit.credits || 0), 0);
  const completionRate =
    totalUnits > 0
      ? Math.round(
          (units.filter((unit) =>
            learningOutcomes.some((lo) => lo.unitId === unit.id)
          ).length /
            totalUnits) *
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
                Create and manage curriculum for courses & programs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Published
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
                Curriculum Rejected by Academic Head
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
          {/* Context Selection (College-specific) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            {(!selectedAcademicYear || !selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-800">
                  ⚠️ Please select all fields below to start building your curriculum
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                disabled={(status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
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
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={(status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.department ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={!selectedDepartment || (status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.program ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">{!selectedDepartment ? "Select Department First" : "Select Program"}</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={!selectedProgram || (status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.semester ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">{!selectedProgram ? "Select Program First" : "Select Semester"}</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Course/Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={!selectedProgram || !selectedSemester || (status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
                className={`w-full rounded-lg border ${
                  errors.course ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">{!selectedProgram || !selectedSemester ? "Select Program & Semester First" : courses.length === 0 ? "No courses available" : "Select Course"}</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <StatsCard
              label="Total Units"
              value={totalUnits}
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
              label="Total Credits"
              value={totalCredits}
              icon={DocumentCheckIcon}
              color="purple"
            />
            <StatsCard
              label="Completion"
              value={`${completionRate}%`}
              icon={CheckCircleIcon}
              color="amber"
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
                  {status === "approved" ? "Published" :
                   status === "pending_approval" ? "Pending Approval" :
                   status === "rejected" ? "Rejected" : "Draft"}
                </h3>
                <p className={`text-xs ${
                  status === "approved" ? "text-green-700" :
                  status === "pending_approval" ? "text-amber-700" :
                  status === "rejected" ? "text-red-700" : "text-indigo-700"
                }`}>
                  {status === "approved"
                    ? "This curriculum is published and active"
                    : status === "pending_approval"
                    ? "Waiting for Academic Head approval"
                    : status === "rejected"
                    ? "Needs revision before republishing"
                    : "Save your progress or publish when ready"}
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
                  ✓ Published by College Admin
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
                  Select department, program, semester and course, add units/modules, then define learning
                  outcomes for each unit. All fields marked with * are required.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 space-y-6">
          {/* Units Section */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Units/Modules ({totalUnits})
                </h2>
                <button
                  onClick={() => {
                    if (!selectedAcademicYear || !selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester) {
                      toast.error('Please select all context fields first before adding units.');
                      return;
                    }
                    setEditingUnit(null);
                    setShowAddUnitModal(true);
                  }}
                  disabled={(status === "approved" && !isCollegeAdmin) || status === "pending_approval"}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Add Unit
                </button>
              </div>

              {units.length > 0 && (
                <div className="mt-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search units..."
                  />
                </div>
              )}
            </div>
            <div className="p-5">
              {filteredUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {units.length === 0
                      ? "No units yet"
                      : "No units found"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {units.length === 0
                      ? "Start building your curriculum by adding units/modules"
                      : "Try adjusting your search criteria"}
                  </p>
                  {units.length === 0 && ((status !== "approved" || isCollegeAdmin) && status !== "pending_approval") && (
                    <button
                      onClick={() => {
                        if (!selectedAcademicYear || !selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester) {
                          toast.error('Please select all context fields first before adding units.');
                          return;
                        }
                        setEditingUnit(null);
                        setShowAddUnitModal(true);
                      }}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      Add Your First Unit
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedUnits.map((unit, index) => {
                      // Calculate the actual index considering pagination
                      const actualIndex = (unitsCurrentPage - 1) * unitsPerPage + index;
                      return (
                        <UnitCard
                          key={unit.id}
                          unit={unit}
                          index={actualIndex}
                          outcomesCount={
                            learningOutcomes.filter(
                              (lo) => lo.unitId === unit.id
                            ).length
                          }
                          onEdit={() => handleEditUnit(unit)}
                          onDelete={() => handleDeleteUnit(unit.id)}
                          onAddOutcome={() =>
                            handleAddOutcomeToUnit(unit.id)
                          }
                        />
                      );
                    })}
                  </div>
                  
                  {/* Units Pagination */}
                  {unitsTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={unitsCurrentPage}
                        totalPages={unitsTotalPages}
                        totalItems={filteredUnits.length}
                        itemsPerPage={unitsPerPage}
                        onPageChange={setUnitsCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
          {/* Learning Outcomes Section - Redesigned */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                    Learning Outcomes by Unit
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {totalOutcomes} total outcome{totalOutcomes !== 1 ? "s" : ""} across {units.length} unit{units.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {learningOutcomes.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <SearchBar
                        value={outcomesSearchQuery}
                        onChange={setOutcomesSearchQuery}
                        placeholder="Search outcomes..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {units.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BookOpenIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    No units added yet
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Add units first, then define learning outcomes
                  </p>
                </div>
              ) : unitsWithFilteredOutcomes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <AcademicCapIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    No matching outcomes found
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Try adjusting your search criteria
                  </p>
                </div>
              ) : (
                <>
                  {/* Compact Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {paginatedUnitsWithOutcomes.map((unit, idx) => {
                      const actualIdx = (outcomesCurrentPage - 1) * outcomesPerPage + idx;
                      const outcomes = filteredLearningOutcomes.filter(
                        (lo) => lo.unitId === unit.id
                      );

                      return (
                        <div
                          key={unit.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                        >
                          {/* Compact Unit Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex-shrink-0">
                                  {actualIdx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                                    {unit.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {unit.credits && (
                                      <span className="text-xs text-indigo-600 font-medium">
                                        {unit.credits} Credits
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {outcomes.length} Outcome{outcomes.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {((status !== "approved" || isCollegeAdmin) && status !== "pending_approval") && (
                                <button
                                  onClick={() => handleAddOutcomeToUnit(unit.id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors flex-shrink-0"
                                  title="Add Outcome"
                                >
                                  <PlusCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Compact Outcomes List */}
                          <div className="p-4">
                            {outcomes.length === 0 ? (
                              <div className="text-center py-6">
                                <AcademicCapIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 mb-3">
                                  No outcomes defined yet
                                </p>
                                {((status !== "approved" || isCollegeAdmin) && status !== "pending_approval") && (
                                  <button
                                    onClick={() => handleAddOutcomeToUnit(unit.id)}
                                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    Add First Outcome
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {outcomes.map((outcome, outcomeIdx) => (
                                  <div
                                    key={outcome.id}
                                    className="group relative rounded-md border border-gray-100 bg-gray-50 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded bg-white text-gray-600 text-xs font-semibold border">
                                        {outcomeIdx + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-800 leading-relaxed line-clamp-2 mb-2">
                                          {outcome.outcome}
                                        </p>
                                        
                                        {/* Compact Tags */}
                                        <div className="flex flex-wrap items-center gap-1">
                                          {outcome.bloomLevel && (
                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                              {outcome.bloomLevel}
                                            </span>
                                          )}
                                          {outcome.assessmentMappings?.slice(0, 2).map((mapping, mapIdx) => (
                                            <span
                                              key={mapIdx}
                                              className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                                            >
                                              {mapping.assessmentType}
                                              {mapping.weightage && (
                                                <span className="ml-1 text-indigo-900 font-semibold">
                                                  {mapping.weightage}%
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                          {outcome.assessmentMappings && outcome.assessmentMappings.length > 2 && (
                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                              +{outcome.assessmentMappings.length - 2} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      {((status !== "approved" || isCollegeAdmin) && status !== "pending_approval") && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleEditOutcome(outcome)}
                                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                                            title="Edit"
                                          >
                                            <PencilSquareIcon className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOutcome(outcome.id)}
                                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-colors"
                                            title="Delete"
                                          >
                                            <TrashIcon className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
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
                  
                  {/* Pagination */}
                  {outcomesTotalPages > 1 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <Pagination
                        currentPage={outcomesCurrentPage}
                        totalPages={outcomesTotalPages}
                        totalItems={unitsWithFilteredOutcomes.length}
                        itemsPerPage={outcomesPerPage}
                        onPageChange={setOutcomesCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pb-6">
            {(status === "draft" || status === "rejected" || (status === "approved" && isCollegeAdmin)) && (
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
                  {status === "approved" 
                    ? "Update & Re-publish" 
                    : "Publish Curriculum"}
                </button>
              </>
            )}
            {status === "pending_approval" && !isCollegeAdmin && (
              <div className="text-sm text-amber-600 font-medium">
                ⏳ Waiting for Academic Head approval...
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddUnitModal
        isOpen={showAddUnitModal}
        onClose={() => {
          setShowAddUnitModal(false);
          setEditingUnit(null);
        }}
        onCreated={handleAddUnit}
        editUnit={editingUnit}
      />

      <AddLearningOutcomeModal
        isOpen={showAddOutcomeModal}
        onClose={() => {
          setShowAddOutcomeModal(false);
          setEditingOutcome(null);
          setSelectedUnitForOutcome(null);
        }}
        onCreated={handleAddOutcome}
        units={units}
        editOutcome={editingOutcome}
        assessmentTypes={assessmentTypes}
        selectedUnitForOutcome={selectedUnitForOutcome}
      />
    </div>
  );
};

export default CollegeCurriculumBuilder;