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
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../common/SearchBar";
import Pagination from "../Pagination";
import KPICard from "../KPICard";
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
   CLONE CURRICULUM MODAL - Enhanced Dynamic Version
   ============================== */
const CloneCurriculumModal = ({
  isOpen,
  onClose,
  onClone,
  departments,
  programs,
  academicYears,
  semesters,
  currentCurriculumId,
  currentAcademicYear,
  currentDepartment,
  currentProgram,
  currentCourse,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClone: (targetData: any) => void;
  departments: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string }>;
  academicYears: string[];
  semesters: string[];
  currentCurriculumId?: string | null;
  currentAcademicYear?: string;
  currentDepartment?: string;
  currentProgram?: string;
  currentCourse?: string;
}) => {
  const [targetAcademicYear, setTargetAcademicYear] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [targetProgram, setTargetProgram] = useState("");
  const [targetSemester, setTargetSemester] = useState("");
  const [availableSourceCurriculums, setAvailableSourceCurriculums] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState(currentCurriculumId || "");
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load available source curriculums when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableSourceCurriculums();
    }
  }, [isOpen, currentDepartment, currentProgram, currentCourse]);

  const loadAvailableSourceCurriculums = async () => {
    setLoadingSources(true);
    try {
      // This would call the getCurriculumsForCloning service
      // For now, we'll use a placeholder
      const mockSources = [
        {
          id: currentCurriculumId,
          course_name: currentCourse,
          academic_year: currentAcademicYear,
          department_name: departments.find(d => d.id === currentDepartment)?.name,
          program_name: programs.find(p => p.id === currentProgram)?.name,
          status: 'published'
        }
      ];
      setAvailableSourceCurriculums(mockSources);
      setSelectedSourceId(currentCurriculumId || "");
    } catch (error) {
      console.error('Failed to load source curriculums:', error);
    } finally {
      setLoadingSources(false);
    }
  };

  const resetForm = () => {
    setTargetAcademicYear("");
    setTargetDepartment("");
    setTargetProgram("");
    setTargetSemester("");
    setSelectedSourceId(currentCurriculumId || "");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedSourceId) {
      setError("Please select a source curriculum to clone");
      return;
    }
    if (!targetAcademicYear) {
      setError("Target Academic Year is required");
      return;
    }

    // Check if target combination would be the same as source
    const selectedSource = availableSourceCurriculums.find(s => s.id === selectedSourceId);
    if (selectedSource && 
        targetAcademicYear === selectedSource.academic_year &&
        (!targetDepartment || targetDepartment === currentDepartment) &&
        (!targetProgram || targetProgram === currentProgram) &&
        (!targetSemester || targetSemester === selectedSource.semester?.toString())) {
      setError("Target configuration cannot be the same as source");
      return;
    }

    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      onClone({
        sourceId: selectedSourceId,
        academic_year: targetAcademicYear,
        department_id: targetDepartment || undefined,
        program_id: targetProgram || undefined,
        semester: targetSemester ? parseInt(targetSemester) : undefined,
      });
      setSubmitting(false);
      handleClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Clone Curriculum"
      subtitle="Create a copy of a curriculum for another academic year or program"
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
        {/* Source Curriculum Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Curriculum <span className="text-red-500">*</span>
          </label>
          {loadingSources ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-600">Loading available curriculums...</span>
            </div>
          ) : (
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="">Select source curriculum</option>
              {availableSourceCurriculums.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>
                  {curriculum.course_name} - {curriculum.academic_year} ({curriculum.status})
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Only published or approved curriculums can be cloned
          </p>
        </div>

        {/* Target Academic Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            value={targetAcademicYear}
            onChange={(e) => setTargetAcademicYear(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Target Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Department (Optional)
          </label>
          <select
            value={targetDepartment}
            onChange={(e) => setTargetDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Keep same department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Program */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Program (Optional)
          </label>
          <select
            value={targetProgram}
            onChange={(e) => setTargetProgram(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Keep same program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Semester (Optional)
          </label>
          <select
            value={targetSemester}
            onChange={(e) => setTargetSemester(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <option value="">Keep same semester</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Preview Section */}
        {selectedSourceId && targetAcademicYear && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Clone Preview:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>From:</strong> {availableSourceCurriculums.find(s => s.id === selectedSourceId)?.course_name} ({availableSourceCurriculums.find(s => s.id === selectedSourceId)?.academic_year})</p>
              <p><strong>To:</strong> Same course ({targetAcademicYear})</p>
              {(targetDepartment || targetProgram || targetSemester) && (
                <p><strong>Changes:</strong> {[
                  targetDepartment && `Department: ${departments.find(d => d.id === targetDepartment)?.name}`,
                  targetProgram && `Program: ${programs.find(p => p.id === targetProgram)?.name}`,
                  targetSemester && `Semester: ${targetSemester}`
                ].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
        )}
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
          disabled={submitting || loadingSources}
          className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Cloning...
            </>
          ) : (
            <>
              <DocumentCheckIcon className="h-4 w-4" />
              Clone Curriculum
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

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
  status?: "draft" | "approved" | "published";
  loading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  // Handlers (adapted for college)
  onAddUnit?: (unit: Unit) => Promise<void>;
  onDeleteUnit?: (id: string) => Promise<void>;
  onAddOutcome?: (outcome: LearningOutcome) => Promise<void>;
  onDeleteOutcome?: (id: string) => Promise<void>;
  onSaveDraft?: () => Promise<void>;
  onApprove?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  onClone?: (sourceId: string, targetData: any) => Promise<void>;
  onExport?: (format: 'csv' | 'pdf') => Promise<void>;
}
const CollegeCurriculumBuilder: React.FC<CollegeCurriculumBuilderProps> = (props) => {
  // Mock user role (no database connection)
  const [isCollegeAdmin] = React.useState(true); // College admin has direct approval authority

  // College-specific assessment types (as per requirements)
  const defaultCollegeAssessmentTypes: AssessmentType[] = [];

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
  const [localStatus, localSetStatus] = useState<"draft" | "approved" | "published">("draft");
  const [localSearchQuery, localSetSearchQuery] = useState("");

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
  
  const [approvedBy] = useState<string | undefined>();
  
  // State for outcomes search
  const [outcomesSearchQuery, setOutcomesSearchQuery] = useState("");

  // Modal states
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddOutcomeModal, setShowAddOutcomeModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingOutcome, setEditingOutcome] = useState<LearningOutcome | null>(null);
  const [selectedUnitForOutcome, setSelectedUnitForOutcome] = useState<string | null>(null);

  // Reset pagination when search changes
  useEffect(() => {
    setUnitsCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setOutcomesCurrentPage(1);
  }, [outcomesSearchQuery]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showExportDropdown && !target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);
  // Enhanced validation for different button states
  const validateForApproval = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic requirements
    if (!selectedAcademicYear || !selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester) {
      errors.push("Please select all required fields above");
    }

    if (units.length === 0) {
      errors.push("Create at least one unit");
    }

    if (learningOutcomes.length === 0) {
      errors.push("Add learning outcomes to your units");
    }

    // Unit-outcome validation
    if (units.length > 0) {
      const outcomesByUnit = learningOutcomes.reduce((acc, outcome) => {
        acc[outcome.unitId] = (acc[outcome.unitId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const unitsWithoutOutcomes = units.filter(unit => !outcomesByUnit[unit.id]);
      if (unitsWithoutOutcomes.length > 0) {
        if (unitsWithoutOutcomes.length === 1) {
          errors.push(`"${unitsWithoutOutcomes[0].name}" unit needs learning outcomes`);
        } else {
          errors.push(`${unitsWithoutOutcomes.length} units need learning outcomes`);
        }
      }
    }

    // Assessment mapping validation
    if (learningOutcomes.length > 0) {
      const outcomesWithoutAssessments = learningOutcomes.filter(outcome => 
        !outcome.assessmentMappings || outcome.assessmentMappings.length === 0
      );

      if (outcomesWithoutAssessments.length > 0) {
        errors.push(`${outcomesWithoutAssessments.length} learning outcomes need assessment mappings`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Content-only validation for error banner (excludes context validation)
  const validateContentOnly = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (units.length === 0) {
      errors.push("Create your first unit to get started");
    }

    if (learningOutcomes.length === 0) {
      errors.push("Add learning outcomes to your units");
    }

    // Unit-outcome validation
    if (units.length > 0) {
      const outcomesByUnit = learningOutcomes.reduce((acc, outcome) => {
        acc[outcome.unitId] = (acc[outcome.unitId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const unitsWithoutOutcomes = units.filter(unit => !outcomesByUnit[unit.id]);
      if (unitsWithoutOutcomes.length > 0) {
        if (unitsWithoutOutcomes.length === 1) {
          errors.push(`Add learning outcomes to "${unitsWithoutOutcomes[0].name}" unit`);
        } else if (unitsWithoutOutcomes.length === 2) {
          errors.push(`Add learning outcomes to "${unitsWithoutOutcomes[0].name}" and "${unitsWithoutOutcomes[1].name}" units`);
        } else {
          errors.push(`${unitsWithoutOutcomes.length} units need learning outcomes (click + button on each unit)`);
        }
      }
    }

    // Assessment mapping validation
    if (learningOutcomes.length > 0) {
      const outcomesWithoutAssessments = learningOutcomes.filter(outcome => 
        !outcome.assessmentMappings || outcome.assessmentMappings.length === 0
      );

      if (outcomesWithoutAssessments.length > 0) {
        if (outcomesWithoutAssessments.length === 1) {
          errors.push(`Add assessment mapping to 1 learning outcome`);
        } else {
          errors.push(`Add assessment mappings to ${outcomesWithoutAssessments.length} learning outcomes`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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
        // If curriculum was approved or published and is being edited, set to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Curriculum moved to draft status. Please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Unit updated successfully');
        }
        setEditingUnit(null);
      } else {
        setUnits((prev) => [
          ...prev,
          { ...unit, order: prev.length + 1 },
        ]);
        // If curriculum was approved or published and is being edited, set to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Curriculum moved to draft status. Please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Unit added successfully');
        }
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
        // If curriculum was approved or published and is being edited, set to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Curriculum moved to draft status. Please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Learning outcome updated successfully');
        }
        setEditingOutcome(null);
      } else {
        setLearningOutcomes((prev) => [...prev, outcome]);
        // If curriculum was approved or published and is being edited, set to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Curriculum moved to draft status. Please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Learning outcome added successfully');
        }
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
    }
  };

  const handleAddOutcomeToUnit = (unitId: string) => {
    setSelectedUnitForOutcome(unitId);
    setShowAddOutcomeModal(true);
  };

  // Action handlers
  const handleSaveDraft = async () => {
    if (props.onSaveDraft) {
      await props.onSaveDraft();
    } else {
      toast.success('Draft saved successfully');
    }
  };

  // Check if there's content to save
  const hasContentToSave = units.length > 0 || learningOutcomes.length > 0;
  
  // Check if Save Draft should be disabled
  const isSaveDraftDisabled = !hasContentToSave;
  
  // Check if Approve button should be disabled
  const approvalValidation = validateForApproval();
  const isApproveDisabled = !approvalValidation.isValid;
  
  // Content validation for error banner (only when context is complete)
  const contentValidation = validateContentOnly();
  
  // Determine save draft button text and state
  const getSaveDraftButtonText = () => {
    if (!hasContentToSave) {
      return 'Nothing to Save';
    }
    return 'Save Draft';
  };

  // Get approval button tooltip
  const getApprovalTooltip = () => {
    if (approvalValidation.isValid) {
      return 'Approve this curriculum for publishing';
    }
    return `Complete these steps first: ${approvalValidation.errors.join(', ')}`;
  };

  const handlePublish = async () => {
    const validation = validateForApproval();
    if (!validation.isValid) {
      toast.error(`Please complete these steps first:\n• ${validation.errors.join('\n• ')}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (props.onPublish) {
      await props.onPublish();
    }
  };

  const confirmPublish = async () => {
    if (props.onPublish) {
      await props.onPublish();
    } else {
      // Fallback to local state
      setStatus("published");
      toast.success("Curriculum published successfully! It is now active and available.");
    }
  };

  const confirmApprove = async () => {
    if (props.onApprove) {
      await props.onApprove();
    } else {
      setStatus("approved");
      toast.success("Curriculum approved successfully!");
    }
  };

  const handleExportCSV = async () => {
    if (props.onExport) {
      await props.onExport('csv');
    } else {
      // Create CSV export
      const csvData = [];
      
      // Header
      csvData.push([
        'Unit Order',
        'Unit Name', 
        'Unit Code',
        'Unit Description',
        'Credits',
        'Duration',
        'Learning Outcome',
        'Bloom Level',
        'Assessment Types'
      ]);

      // Data rows
      units.forEach(unit => {
        const unitOutcomes = learningOutcomes.filter(lo => lo.unitId === unit.id);
        
        if (unitOutcomes.length === 0) {
          // Unit without outcomes
          csvData.push([
            unit.order,
            unit.name,
            unit.code || '',
            unit.description,
            unit.credits || '',
            unit.estimatedDuration ? `${unit.estimatedDuration} ${unit.durationUnit || 'hours'}` : '',
            '',
            '',
            ''
          ]);
        } else {
          // Unit with outcomes
          unitOutcomes.forEach((outcome, index) => {
            const assessmentTypes = outcome.assessmentMappings
              .map(m => `${m.assessmentType}${m.weightage ? ` (${m.weightage}%)` : ''}`)
              .join('; ');
              
            csvData.push([
              index === 0 ? unit.order : '', // Only show unit details on first row
              index === 0 ? unit.name : '',
              index === 0 ? (unit.code || '') : '',
              index === 0 ? unit.description : '',
              index === 0 ? (unit.credits || '') : '',
              index === 0 ? (unit.estimatedDuration ? `${unit.estimatedDuration} ${unit.durationUnit || 'hours'}` : '') : '',
              outcome.outcome,
              outcome.bloomLevel || '',
              assessmentTypes
            ]);
          });
        }
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculum-${selectedCourse}-${selectedAcademicYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Curriculum exported as CSV successfully!');
    }
    setShowExportDropdown(false);
  };

  const handleExportPDF = async () => {
    if (props.onExport) {
      await props.onExport('pdf');
    } else {
      toast.error('PDF export not available in demo mode');
    }
    setShowExportDropdown(false);
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
            {/* Top Action Buttons - Export and Clone */}
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={totalUnits === 0}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  <DocumentCheckIcon className="h-4 w-4" />
                  Export
                  <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Clone Button - Available for published/approved curriculums */}
              {(status === "published" || status === "approved") && (
                <button
                  onClick={() => setShowCloneModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                >
                  <DocumentCheckIcon className="h-4 w-4" />
                  Clone
                </button>
              )}
            </div>

            {/* Status Badges */}
            {status === "published" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Published
              </span>
            )}
            {status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Approved
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Error Banner - Only show when all context fields are selected */}
      {selectedAcademicYear && selectedCourse && selectedDepartment && selectedProgram && selectedSemester && !contentValidation.isValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-amber-800 font-medium mb-2">
                Complete these steps to approve your curriculum:
              </h3>
              <div className="space-y-1">
                {contentValidation.errors.map((error, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-amber-700">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></div>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
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
            {(selectedAcademicYear && selectedCourse && selectedDepartment && selectedProgram && selectedSemester && !props.curriculumId) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800">
                  ✨ Ready to build! Add your first unit to create the curriculum
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
                disabled={status === "published" && !isCollegeAdmin}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={status === "published" && !isCollegeAdmin}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!selectedDepartment || (status === "published" && !isCollegeAdmin)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!selectedProgram || (status === "published" && !isCollegeAdmin)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!selectedProgram || !selectedSemester || (status === "published" && !isCollegeAdmin)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <KPICard
              title="Total Units"
              value={totalUnits}
              icon={<BookOpenIcon className="h-5 w-5" />}
              color="blue"
            />
            <KPICard
              title="Learning Outcomes"
              value={totalOutcomes}
              icon={<AcademicCapIcon className="h-5 w-5" />}
              color="green"
            />
            <KPICard
              title="Total Credits"
              value={totalCredits}
              icon={<DocumentCheckIcon className="h-5 w-5" />}
              color="purple"
            />
            <KPICard
              title="Completion"
              value={`${completionRate}%`}
              icon={<CheckCircleIcon className="h-5 w-5" />}
              color="yellow"
            />
          </div>
          {/* Status Card */}
          <div className={`rounded-xl border p-5 ${
            status === "published"
              ? "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200"
              : status === "approved"
              ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
              : "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg ${
                  status === "published"
                    ? "bg-green-500 text-white"
                    : status === "approved"
                    ? "bg-blue-500 text-white"
                    : "bg-indigo-500 text-white"
                }`}
              >
                {status === "published" ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : status === "approved" ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  <DocumentCheckIcon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold mb-1 ${
                  status === "published" ? "text-green-900" :
                  status === "approved" ? "text-blue-900" : "text-indigo-900"
                }`}>
                  {status === "published" ? "Published" :
                   status === "approved" ? "Approved" : "Draft"}
                </h3>
                <p className={`text-xs ${
                  status === "published" ? "text-green-700" :
                  status === "approved" ? "text-blue-700" : "text-indigo-700"
                }`}>
                  {status === "published"
                    ? "This curriculum is published"
                    : status === "approved"
                    ? "Ready to be published"
                    : "Save your progress and get approval when ready"}
                </p>
              </div>
            </div>
            {approvedBy && (status === "approved" || status === "published") && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-medium text-green-800">
                  ✓ Approved by Academic Head
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!selectedAcademicYear || !selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester) {
                        toast.error('Please select all context fields first before adding units.');
                        return;
                      }
                      setEditingUnit(null);
                      setShowAddUnitModal(true);
                    }}
                    disabled={status === "published" && !isCollegeAdmin}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Add Unit
                  </button>
                </div>
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
                      ? (props.curriculumId ? "Start building your curriculum by adding units/modules" : "Select all fields above, then add your first unit to create the curriculum")
                      : "Try adjusting your search criteria"}
                  </p>
                  {units.length === 0 && ((status !== "published" || isCollegeAdmin)) && (
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
                      {props.curriculumId ? 'Add Your First Unit' : 'Start Building Curriculum'}
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
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Learning Outcomes by Unit
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalOutcomes} total outcome{totalOutcomes !== 1 ? "s" : ""} across {units.length} unit{units.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {learningOutcomes.length > 0 && (
                <div className="mt-4">
                  <SearchBar
                    value={outcomesSearchQuery}
                    onChange={setOutcomesSearchQuery}
                    placeholder="Search learning outcomes, Bloom's levels, or assessment types..."
                  />
                  {outcomesSearchQuery && (
                    <p className="mt-2 text-xs text-gray-600">
                      Found {filteredLearningOutcomes.length} outcome{filteredLearningOutcomes.length !== 1 ? "s" : ""} in {unitsWithFilteredOutcomes.length} unit{unitsWithFilteredOutcomes.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
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
                              {((status !== "published" || isCollegeAdmin)) && (
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
                                {((status !== "published" || isCollegeAdmin)) && (
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
                                      {((status !== "published" || isCollegeAdmin)) && (
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-6">
            {/* Only show action buttons when curriculum context is complete */}
            {selectedAcademicYear && selectedCourse && selectedDepartment && selectedProgram && selectedSemester && (
              <>
                {/* Draft Actions - Admin can directly approve */}
                {status === "draft" && (
                  <>
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSaveDraftDisabled}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition font-medium text-sm ${
                        isSaveDraftDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                      title={isSaveDraftDisabled ? 'Add units and outcomes to save draft' : 'Confirm draft save (changes are auto-saved)'}
                    >
                      <DocumentCheckIcon className="h-4 w-4" />
                      {getSaveDraftButtonText()}
                    </button>
                    {isCollegeAdmin && (
                      <button
                        onClick={async () => {
                          const validation = validateForApproval();
                          if (!validation.isValid) {
                            // Show detailed error message
                            toast.error(`Please complete these steps first:\n• ${validation.errors.join('\n• ')}`);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            return;
                          }
                          
                          if (props.onApprove) {
                            await props.onApprove();
                          }
                        }}
                        disabled={isApproveDisabled}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg text-sm ${
                          isApproveDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={getApprovalTooltip()}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {isApproveDisabled ? 'Complete Steps Above' : 'Approve Curriculum'}
                      </button>
                    )}
                  </>
                )}

                {/* Approved Actions - Admin can publish */}
                {status === "approved" && isCollegeAdmin && (
                  <button
                    onClick={handlePublish}
                    disabled={isApproveDisabled}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg text-sm ${
                      isApproveDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={isApproveDisabled ? getApprovalTooltip() : 'Publish curriculum to make it active'}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {isApproveDisabled ? 'Complete Steps Above' : 'Publish Curriculum'}
                  </button>
                )}

                {/* Published Actions - No additional message needed */}
                {/* Published curriculums can still be edited by admins, triggering re-approval workflow */}
              </>
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

      <CloneCurriculumModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onClone={(targetData) => {
          if (props.onClone && props.curriculumId) {
            props.onClone(props.curriculumId, targetData);
          } else {
            toast.success('Clone functionality not implemented in demo mode');
          }
        }}
        departments={departments}
        programs={programs}
        academicYears={academicYears}
        semesters={semesters}
        currentCurriculumId={props.curriculumId}
        currentAcademicYear={selectedAcademicYear}
        currentDepartment={selectedDepartment}
        currentProgram={selectedProgram}
        currentCourse={courses.find(c => c.value === selectedCourse)?.label}
      />
    </div>
  );
};

export default CollegeCurriculumBuilder;