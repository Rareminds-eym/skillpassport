/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AcademicCapIcon,
    ArrowPathIcon,
    ChartBarIcon,
    CheckIcon,
    ClipboardDocumentListIcon,
    PencilSquareIcon,
    PlusCircleIcon,
    TrashIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

/* ==============================
   TYPES & INTERFACES
   ============================== */

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
/* ========
======================
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
      </div>      {/*
 Action Buttons */}
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
         {/* Form Fields - Simplified for space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Marks</label>
                    <input
                      type="number"
                      value={formData.minMarks}
                      onChange={(e) => setFormData({ ...formData, minMarks: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Marks</label>
                    <input
                      type="number"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Point</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gradePoint}
                    onChange={(e) => setFormData({ ...formData, gradePoint: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                  <label htmlFor="isPass" className="text-sm font-medium text-gray-700">Passing Grade</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !formData.gradeLabel}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {submitting ? "Saving..." : (grade ? "Update Grade" : "Create Grade")}
        </button>
      </div>
    </ModalWrapper>
  );
};/*
 ==============================
   MAIN COMPONENT
   ============================== */
const AssessmentGradingMaster = () => {
  const [activeTab, setActiveTab] = useState<"assessments" | "grading">("assessments");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [editAssessmentType, setEditAssessmentType] = useState<AssessmentType | null>(null);
  const [editGradingSystem, setEditGradingSystem] = useState<GradingSystem | null>(null);

  // Data states
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

  useEffect(() => {
    setLoading(false);
  }, []);

  const tabs = [
    { id: "assessments", label: "Assessment Types", icon: ClipboardDocumentListIcon },
    { id: "grading", label: "Grading System", icon: ChartBarIcon },
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Assessment & Grading Master</h1>
          <p className="text-base sm:text-lg mt-2 text-gray-600">
            Configure assessment types and grading system for your college
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <StatsCard
            label="Assessment Types"
            value={assessmentTypes.length}
            icon={ClipboardDocumentListIcon}
            color="purple"
            onClick={() => setActiveTab("assessments")}
          />
          <StatsCard
            label="Grading System"
            value={gradingSystem.length}
            icon={ChartBarIcon}
            color="blue"
            onClick={() => setActiveTab("grading")}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
          <div className="p-6">
            {/* Assessment Types Tab */}
            {activeTab === "assessments" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Assessment Type Master</h2>
                  <button
                    onClick={() => setShowAssessmentModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Assessment Type
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {assessmentTypes.map((assessment) => (
                    <div key={assessment.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2">{assessment.typeName}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            assessment.category === "internal" ? "bg-blue-50 text-blue-700" :
                            assessment.category === "external" ? "bg-purple-50 text-purple-700" :
                            "bg-green-50 text-green-700"
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
    {/* Grading System Tab */}
            {activeTab === "grading" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Grading System Master</h2>
                  <button
                    onClick={() => setShowGradingModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 text-sm font-medium"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Grade
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </div>
  );
};

export default AssessmentGradingMaster;