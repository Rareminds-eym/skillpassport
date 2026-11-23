import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { courseWorkflow } from '../api/courseWorkflow';
import type { CourseUnit } from '../model/types';

export interface OutcomeDetails {
  unitId: string;
  text: string;
  bloomLevel: string;
  assessments: { assessmentType: string; weightage?: number }[];
}

export function LearningOutcomeFields({ value, onChange, units, assessmentTypes, courseId, programId, onTypeEditorChange, draft = false }: {
  draft?: boolean;
  onTypeEditorChange: Dispatch<SetStateAction<boolean>>;
  courseId: string;
  programId: string;
  value: OutcomeDetails;
  onChange: Dispatch<SetStateAction<OutcomeDetails>>;
  units: CourseUnit[];
  assessmentTypes: { id: string; name: string }[];
}) {
  const client = useQueryClient();
  const typeSelect = useRef<HTMLSelectElement>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createdTypes, setCreatedTypes] = useState<{ id: string; name: string }[]>([]);
  const availableTypes = [...new Map([...assessmentTypes, ...createdTypes].map(item => [item.id, item])).values()];
  const createType = useMutation({ mutationKey: ['create-college-assessment-type'],
    mutationFn: () => courseWorkflow.createAssessmentType(courseId, programId, newName.trim(), newDescription.trim()),
    onSuccess: async item => {
      setCreatedTypes(previous => [...previous.filter(existing => existing.id !== item.id), item]);
      setType(value.assessments.some(mapping => mapping.assessmentType === item.name) ? '' : item.name); setCreating(false); setNewName(''); setNewDescription('');
      await client.invalidateQueries({ queryKey: ['course-assessment-types'] });
    },
  });
  useEffect(() => { onTypeEditorChange(creating); return () => onTypeEditorChange(false); }, [creating, onTypeEditorChange]);
  useEffect(() => { if (createdTypes.length) typeSelect.current?.focus(); }, [createdTypes]);
  const [type, setType] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const control = 'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  return <>
    <label className="block text-sm font-medium text-gray-700">Select Unit/Module<select required disabled={draft} className={control} value={value.unitId} onChange={event => onChange({ ...value, unitId: event.target.value })}>
      <option value="">Choose a unit</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
    </select></label>
    <label className="block text-sm font-medium text-gray-700">Learning outcome<textarea autoFocus required={!draft} maxLength={10000} rows={4} className={control} placeholder="Describe what learners should be able to do after this unit..." value={value.text} onChange={event => onChange({ ...value, text: event.target.value })} /></label>
    <label className="block text-sm font-medium text-gray-700">Bloom's Taxonomy Level<select className={control} value={value.bloomLevel} onChange={event => onChange({ ...value, bloomLevel: event.target.value })}>
      <option value="">Select Bloom's Level (Optional)</option>{['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(level => <option key={level}>{level}</option>)}
    </select></label>
    <div className="space-y-3">
      <h3 className="!text-sm !font-medium text-gray-700">Assessment Type Mappings</h3>
      <p className="!text-xs !leading-5 text-gray-500">Map this learning outcome to one or more assessment types.</p>
      {availableTypes.length ? <>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">Assessment Type<select ref={typeSelect} className={control} value={type} onChange={event => { setType(event.target.value); setError(''); }}>
            <option value="">Select Type</option>{availableTypes.filter(item => !value.assessments.some(mapping => mapping.assessmentType === item.name)).map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select></label>
          <label className="block text-sm font-medium text-gray-700">Weightage % (Optional)<input type="number" min={0} max={100} step="any" className={control} value={weight} onChange={event => setWeight(event.target.value)} /></label>
        </div>
        <button type="button" disabled={!type || value.assessments.some(mapping => mapping.assessmentType === type) || value.assessments.length >= 20} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" onClick={() => {
          const weightage = weight === '' ? undefined : Number(weight);
          if (weightage !== undefined && (!Number.isFinite(weightage) || weightage < 0 || weightage > 100)) { setError('Weightage must be between 0 and 100.'); return; }
          onChange({ ...value, assessments: [...value.assessments, { assessmentType: type, ...(weightage !== undefined ? { weightage } : {}) }] });
          setType(''); setWeight(''); setError('');
        }}>Add Assessment Mapping</button>
      </> : <p className="!text-xs !leading-5 text-gray-500">No active assessment types are configured. You can submit this outcome without mappings.</p>}
      {!creating ? <button type="button" className="min-h-11 rounded-lg px-2 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600" onClick={() => { createType.reset(); setCreating(true); }}>+ Add assessment type</button> : <div className="space-y-3 rounded-lg border border-gray-200 p-4" onKeyDown={event => { if (event.key === 'Enter' && event.target instanceof HTMLInputElement) { event.preventDefault(); if (newName.trim() && !createType.isPending) createType.mutate(); } }}>
        <label className="block text-sm font-medium text-gray-700">Assessment type name<input autoFocus maxLength={100} className={control} placeholder="e.g. Quiz or Practical Exam" value={newName} onChange={event => setNewName(event.target.value)} /></label>
        <label className="block text-sm font-medium text-gray-700">Assessment type description (optional)<textarea maxLength={1000} rows={2} className={control} value={newDescription} onChange={event => setNewDescription(event.target.value)} /></label>
        <p className="!text-xs !leading-5 text-gray-500">Saved for your college and available to its educators.</p>
        {createType.error && <p role="alert" className="!text-sm text-red-700">{createType.error.message}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700" onClick={() => setCreating(false)}>Cancel new type</button>
          <button type="button" disabled={!newName.trim() || createType.isPending} className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => createType.mutate()}>{createType.isPending ? 'Saving...' : 'Save assessment type'}</button>
        </div>
      </div>}
      {error && <p role="alert" className="!text-sm text-red-700">{error}</p>}
      <ul className="space-y-2">{value.assessments.map(mapping => <li key={mapping.assessmentType} className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
        <span>{mapping.assessmentType}{mapping.weightage !== undefined && ` (${mapping.weightage}%)`}</span>
        <button type="button" aria-label={`Remove ${mapping.assessmentType} mapping`} className="min-h-11 rounded px-2 text-sm font-medium hover:bg-indigo-100" onClick={() => onChange({ ...value, assessments: value.assessments.filter(item => item.assessmentType !== mapping.assessmentType) })}>Remove</button>
      </li>)}</ul>
    </div>
  </>;
}
