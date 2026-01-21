import React, { useState } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { BookOpen, Target, CheckSquare, FileText } from 'lucide-react';
import type {
  Curriculum,
  Unit,
  LearningOutcome,
  AssessmentMapping,
} from '../../../../types/college';

interface CurriculumBuilderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Curriculum>) => Promise<{ success: boolean; error?: string }>;
  curriculum?: Curriculum | null;
  departments: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string; department_id: string }>;
  courses: Array<{ id: string; course_name: string; course_code: string }>;
}

const CurriculumBuilderForm: React.FC<CurriculumBuilderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  curriculum,
  departments,
  programs,
  courses,
}) => {
  const [formData, setFormData] = useState<Partial<Curriculum>>({
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    department_id: '',
    program_id: '',
    semester: 1,
    course_id: '',
    units: [],
    outcomes: [],
    assessment_mappings: [],
    status: 'draft',
    version: 1,
  });

  const [units, setUnits] = useState<Unit[]>(curriculum?.units || []);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>(curriculum?.outcomes || []);
  const [assessmentMappings, setAssessmentMappings] = useState<AssessmentMapping[]>(
    curriculum?.assessment_mappings || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'units' | 'outcomes' | 'mappings'>('basic');

  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  const assessmentTypes = ['IA', 'end_semester', 'practical', 'viva', 'arrears'];

  // Unit Management
  const addUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      title: '',
      sequence: units.length + 1,
      credits: 0,
      estimated_hours: 0,
    };
    setUnits([...units, newUnit]);
  };

  const updateUnit = (id: string, field: keyof Unit, value: any) => {
    setUnits(units.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const removeUnit = (id: string) => {
    setUnits(units.filter((u) => u.id !== id));
  };

  const moveUnit = (index: number, direction: 'up' | 'down') => {
    const newUnits = [...units];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= units.length) return;

    [newUnits[index], newUnits[targetIndex]] = [newUnits[targetIndex], newUnits[index]];
    newUnits.forEach((unit, idx) => (unit.sequence = idx + 1));
    setUnits(newUnits);
  };

  // Outcome Management
  const addOutcome = () => {
    const newOutcome: LearningOutcome = {
      id: `outcome-${Date.now()}`,
      text: '',
      bloom_level: 'Understand',
      unit_ids: [],
    };
    setOutcomes([...outcomes, newOutcome]);
  };

  const updateOutcome = (id: string, field: keyof LearningOutcome, value: any) => {
    setOutcomes(outcomes.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const removeOutcome = (id: string) => {
    setOutcomes(outcomes.filter((o) => o.id !== id));
    setAssessmentMappings(assessmentMappings.filter((m) => m.outcome_id !== id));
  };

  const toggleUnitForOutcome = (outcomeId: string, unitId: string) => {
    setOutcomes(
      outcomes.map((o) => {
        if (o.id === outcomeId) {
          const unitIds = o.unit_ids.includes(unitId)
            ? o.unit_ids.filter((id) => id !== unitId)
            : [...o.unit_ids, unitId];
          return { ...o, unit_ids: unitIds };
        }
        return o;
      })
    );
  };

  // Assessment Mapping Management
  const addAssessmentMapping = () => {
    if (outcomes.length === 0) {
      alert('Please add learning outcomes first');
      return;
    }
    const newMapping: AssessmentMapping = {
      outcome_id: outcomes[0].id,
      assessment_types: [],
      weightage: 0,
    };
    setAssessmentMappings([...assessmentMappings, newMapping]);
  };

  const updateMapping = (index: number, field: keyof AssessmentMapping, value: any) => {
    const updated = [...assessmentMappings];
    updated[index] = { ...updated[index], [field]: value };
    setAssessmentMappings(updated);
  };

  const toggleAssessmentType = (index: number, type: string) => {
    const updated = [...assessmentMappings];
    const types = updated[index].assessment_types;
    updated[index].assessment_types = types.includes(type as any)
      ? types.filter((t) => t !== type)
      : [...types, type as any];
    setAssessmentMappings(updated);
  };

  const removeMapping = (index: number) => {
    setAssessmentMappings(assessmentMappings.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (
      !formData.academic_year ||
      !formData.department_id ||
      !formData.program_id ||
      !formData.course_id
    ) {
      setError('All basic fields are required');
      setLoading(false);
      return;
    }

    // Check if all outcomes have assessment mappings
    const unmappedOutcomes = outcomes.filter(
      (o) => !assessmentMappings.some((m) => m.outcome_id === o.id && m.assessment_types.length > 0)
    );

    if (unmappedOutcomes.length > 0) {
      setError(
        `${unmappedOutcomes.length} learning outcome(s) are not mapped to any assessment type`
      );
      setLoading(false);
      return;
    }

    const data = {
      ...formData,
      units,
      outcomes,
      assessment_mappings: assessmentMappings,
    };

    const result = await onSubmit(data);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to save curriculum');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredPrograms = programs.filter((p) => p.department_id === formData.department_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {curriculum ? 'Edit Curriculum' : 'Create Curriculum'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { id: 'basic', label: 'Basic Info', icon: FileText },
              { id: 'units', label: 'Units/Modules', icon: BookOpen },
              { id: 'outcomes', label: 'Learning Outcomes', icon: Target },
              { id: 'mappings', label: 'Assessment Mapping', icon: CheckSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2024-25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value, program_id: '' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.program_id}
                    onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.department_id}
                  >
                    <option value="">Select Program</option>
                    {filteredPrograms.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Units Tab */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{units.length} units defined</p>
                <button
                  type="button"
                  onClick={addUnit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Unit
                </button>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No units added yet. Click "Add Unit" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {units.map((unit, index) => (
                    <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveUnit(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveUnit(index, 'down')}
                            disabled={index === units.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                              Unit {unit.sequence}
                            </span>
                            <input
                              type="text"
                              value={unit.title}
                              onChange={(e) => updateUnit(unit.id, 'title', e.target.value)}
                              placeholder="Unit title"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Credits</label>
                              <input
                                type="number"
                                min="0"
                                value={unit.credits}
                                onChange={(e) =>
                                  updateUnit(unit.id, 'credits', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Estimated Hours
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={unit.estimated_hours}
                                onChange={(e) =>
                                  updateUnit(
                                    unit.id,
                                    'estimated_hours',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeUnit(unit.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outcomes Tab */}
          {activeTab === 'outcomes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{outcomes.length} learning outcomes defined</p>
                <button
                  type="button"
                  onClick={addOutcome}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Outcome
                </button>
              </div>

              {outcomes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No learning outcomes added yet. Click "Add Outcome" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {outcomes.map((outcome, index) => (
                    <div key={outcome.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-gray-600 mt-2">
                          CO{index + 1}
                        </span>

                        <div className="flex-1 space-y-3">
                          <textarea
                            rows={2}
                            value={outcome.text}
                            onChange={(e) => updateOutcome(outcome.id, 'text', e.target.value)}
                            placeholder="Learning outcome description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Bloom's Taxonomy Level
                              </label>
                              <select
                                value={outcome.bloom_level}
                                onChange={(e) =>
                                  updateOutcome(outcome.id, 'bloom_level', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                {bloomLevels.map((level) => (
                                  <option key={level} value={level}>
                                    {level}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Related Units
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {units.map((unit) => (
                                  <label key={unit.id} className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={outcome.unit_ids.includes(unit.id)}
                                      onChange={() => toggleUnitForOutcome(outcome.id, unit.id)}
                                      className="rounded text-blue-600"
                                    />
                                    <span className="text-xs">Unit {unit.sequence}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeOutcome(outcome.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assessment Mappings Tab */}
          {activeTab === 'mappings' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Required:</strong> Every learning outcome must be mapped to at least one
                  assessment type.
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {assessmentMappings.length} mappings defined
                </p>
                <button
                  type="button"
                  onClick={addAssessmentMapping}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={outcomes.length === 0}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Mapping
                </button>
              </div>

              {assessmentMappings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No assessment mappings added yet. Click "Add Mapping" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {assessmentMappings.map((mapping, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Learning Outcome
                            </label>
                            <select
                              value={mapping.outcome_id}
                              onChange={(e) => updateMapping(index, 'outcome_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              {outcomes.map((outcome, idx) => (
                                <option key={outcome.id} value={outcome.id}>
                                  CO{idx + 1}: {outcome.text.substring(0, 50)}...
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Assessment Types
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {assessmentTypes.map((type) => (
                                <label
                                  key={type}
                                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={mapping.assessment_types.includes(type as any)}
                                    onChange={() => toggleAssessmentType(index, type)}
                                    className="rounded text-blue-600"
                                  />
                                  <span className="text-sm">{type}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Weightage (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={mapping.weightage}
                              onChange={(e) =>
                                updateMapping(index, 'weightage', parseInt(e.target.value) || 0)
                              }
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMapping(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : curriculum ? 'Update Curriculum' : 'Create Curriculum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurriculumBuilderForm;
