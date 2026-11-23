import { useId, useRef, useState } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { LearningOutcomeFields, type OutcomeDetails } from './LearningOutcomeFields';
import { CurriculumFormDialog } from './CurriculumFormDialog';
import { courseWorkflow } from '../api/courseWorkflow';
import type { CourseCurriculum, MappedCourse } from '../model/types';

export function AddCurriculumContent({ course, curriculum, unitId, emptyState = false }: { course: MappedCourse; curriculum?: CourseCurriculum; unitId?: string; emptyState?: boolean }) {
  const client = useQueryClient();
  const creatingType = useIsMutating({ mutationKey: ['create-college-assessment-type'] }) > 0;
  const tabsId = useId();
  const [tab, setTab] = useState<'unit' | 'outcomes'>('unit');
  const [outcomes, setOutcomes] = useState<OutcomeDetails[]>([]);
  const [editingType, setEditingType] = useState(false);
  const [formError, setFormError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState<OutcomeDetails>({ unitId: unitId || '', text: '', bloomLevel: '', assessments: [] });
  const assessmentTypes = useQuery({ queryKey: ['course-assessment-types', course.program_id], queryFn: courseWorkflow.assessmentTypes, enabled: open && (Boolean(unitId) || tab === 'outcomes') });
  const [year, setYear] = useState('');
  const mutation = useMutation({ mutationFn: () => courseWorkflow.add({ courseId: course.id, programId: course.program_id!, academicYear: curriculum?.academic_year || year.trim(), curriculumId: curriculum?.id,
    ...(unitId ? { entityType: 'outcome' as const, unitId: outcome.unitId, outcome_text: outcome.text.trim(), bloom_level: outcome.bloomLevel || undefined, assessment_mappings: outcome.assessments } : { entityType: 'unit' as const, name: name.trim(), code: code.trim(), description, outcomes: [...outcomes, ...(outcome.text.trim() ? [outcome] : [])].map(item => ({ text: item.text.trim(), bloomLevel: item.bloomLevel || undefined, assessments: item.assessments })) }) }),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: ['mapped-course-content'] }), client.invalidateQueries({ queryKey: ['college-course-admin'] })]);
      toast.success(`${unitId ? 'Learning outcome' : 'Unit'} submitted for administrator approval`);
      setOpen(false); setTab('unit'); setOutcomes([]); setFormError(''); setName(''); setCode(''); setDescription(''); setOutcome({ unitId: unitId || '', text: '', bloomLevel: '', assessments: [] });
    },
  });
  if (!course.can_propose_edits) return null;
  const unitReady = Boolean((curriculum || year.trim()) && name.trim() && code.trim());
  const outcomeReady = Boolean(outcome.text.trim() && (unitId ? outcome.unitId : true) && !assessmentTypes.isPending && !assessmentTypes.error && (!assessmentTypes.data?.length || outcome.assessments.length));
  const actionClass = 'min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50';
  const control = 'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15';
  return <><div className={emptyState ? 'rounded-xl border border-gray-200 bg-white p-6' : 'space-y-2'}>
    {emptyState && <><span className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600"><BookOpenIcon className="h-6 w-6" /></span><h3 className="!text-base !leading-6 font-semibold text-gray-900">{curriculum ? 'No approved units yet' : 'Build this course’s curriculum'}</h3><p className="mb-5 mt-2 !text-sm !leading-6 text-gray-500">{curriculum ? 'Submitted units appear here after administrator approval. You can add another unit while your submission is being reviewed.' : 'Start with a unit, then add its learning outcomes. Your college administrator will review your submission.'}</p></>}
    <button ref={trigger} type="button" className={unitId ? 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600' : 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'} onClick={() => { mutation.reset(); setOpen(true); }}><PlusIcon aria-hidden="true" className="h-4 w-4" />{unitId ? 'Add learning outcome' : 'Add unit'}</button>{mutation.isSuccess && <p role="status" className="mt-3 !text-sm text-green-700">Addition submitted. It will appear in the curriculum after administrator approval.</p>}</div>
  <CurriculumFormDialog open={open} title={unitId ? 'Add learning outcome' : 'Add unit'}
    description={`${course.title}${curriculum ? ` / ${curriculum.academic_year}` : ''}`}
    formLabel={unitId ? 'Add learning outcome' : 'Add unit'} pending={mutation.isPending || creatingType}
    disabled={editingType || (!curriculum && !year.trim()) || (unitId ? !outcome.text.trim() || !outcome.unitId || assessmentTypes.isPending || Boolean(assessmentTypes.error) || Boolean(assessmentTypes.data?.length && !outcome.assessments.length) : !unitReady || (tab === 'outcomes' && (assessmentTypes.isPending || Boolean(assessmentTypes.error) || Boolean(outcome.text.trim() && !outcomeReady))))}
    error={formError || mutation.error?.message} returnFocus={trigger} onClose={() => setOpen(false)}
    primaryAction={!unitId && tab === 'unit' ? <button type="button" disabled={mutation.isPending || !unitReady} className={actionClass} onClick={() => setTab('outcomes')}>Next: Learning outcomes</button> : undefined}
    onSubmit={event => { event.preventDefault();
      if (!unitId && tab === 'unit') { if (unitReady) setTab('outcomes'); return; }
      if (!unitId && outcome.text.trim() && !outcomeReady) { setFormError('Complete the learning outcome and its assessment mappings.'); return; }
      setFormError(''); mutation.mutate();
    }}>
      {!unitId && <div role="tablist" aria-label="Unit and learning outcomes" className="flex border-b border-gray-200">
        {(['unit', 'outcomes'] as const).map((value, index) => <button key={value} type="button" role="tab" id={`${tabsId}-${value}`} aria-controls={`${tabsId}-panel-${value}`} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} disabled={mutation.isPending || (value === 'outcomes' && !unitReady)} onClick={() => setTab(value)} onKeyDown={event => {
          if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'unit' : event.key === 'End' ? 'outcomes' : tab === 'unit' ? 'outcomes' : 'unit'; if (next === 'unit' || unitReady) { setTab(next); document.getElementById(`${tabsId}-${next}`)?.focus(); } }
        }} className={`min-h-11 flex-1 border-b-2 px-3 py-3 text-sm font-medium disabled:opacity-50 ${tab === value ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>{index + 1}. {value === 'unit' ? 'Course unit' : 'Learning outcomes'}</button>)}
      </div>}
      <div hidden={!unitId && tab !== 'unit'} role={!unitId ? 'tabpanel' : undefined} id={`${tabsId}-panel-unit`} aria-labelledby={!unitId ? `${tabsId}-unit` : undefined} className="space-y-5">
      {!curriculum && <label className="block text-sm font-medium text-gray-700">Academic year<input autoFocus required maxLength={20} placeholder="e.g. 2026-2027" className={control} value={year} onChange={event => setYear(event.target.value)} /></label>}
      {!unitId && <>
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]"><label className="block text-sm font-medium text-gray-700">Unit code<input autoFocus={Boolean(curriculum)} required maxLength={50} placeholder="U1" className={control} value={code} onChange={event => setCode(event.target.value)} /></label>
        <label className="block text-sm font-medium text-gray-700">Unit name<input required maxLength={255} placeholder="e.g. Linear algebra" className={control} value={name} onChange={event => setName(event.target.value)} /></label></div>
        <label className="block text-sm font-medium text-gray-700">Description <span className="font-normal text-gray-500">(optional)</span><textarea maxLength={10000} rows={3} placeholder="What will this unit cover?" className={control} value={description} onChange={event => setDescription(event.target.value)} /></label>
      </>}
      </div>
      {(unitId || tab === 'outcomes') && <div role={!unitId ? 'tabpanel' : undefined} id={`${tabsId}-panel-outcomes`} aria-labelledby={!unitId ? `${tabsId}-outcomes` : undefined} className="space-y-5">
        {!unitId && <p className="!text-sm text-gray-600">Add learning outcomes for <strong>{code} / {name}</strong>. The unit and its outcomes will be reviewed together.</p>}
        {!unitId && outcomes.length > 0 && <ul className="space-y-2">{outcomes.map((item, index) => <li key={index} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm"><div><p className="font-medium text-gray-900">{index + 1}. {item.text}</p><p className="mt-1 text-xs text-gray-500">{[item.bloomLevel, ...item.assessments.map(mapping => `${mapping.assessmentType}${mapping.weightage !== undefined ? ` (${mapping.weightage}%)` : ''}`)].filter(Boolean).join(' / ')}</p></div><button type="button" aria-label={`Remove learning outcome ${index + 1}`} className="min-h-11 px-2 text-sm text-red-600" onClick={() => setOutcomes(previous => previous.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></li>)}</ul>}
        {assessmentTypes.isPending && <p role="status" className="text-sm text-gray-500">Loading assessment types...</p>}
        {assessmentTypes.error && <p role="alert" className="text-sm text-red-700">Could not load assessment types. <button type="button" className="underline" onClick={() => { void assessmentTypes.refetch(); }}>Try again</button></p>}
        <LearningOutcomeFields onTypeEditorChange={setEditingType} courseId={course.id} programId={course.program_id!} value={unitId ? outcome : { ...outcome, unitId: 'draft-unit' }} onChange={setOutcome} draft={!unitId} units={unitId ? curriculum?.units || [] : [{ id: 'draft-unit', name: name || 'New unit', code, description, order_index: 0 }]} assessmentTypes={assessmentTypes.data || []} />
        {Boolean(assessmentTypes.data?.length) && !outcome.assessments.length && <p className="text-sm text-amber-700">Add at least one assessment type mapping before submitting.</p>}
        {!unitId && <button type="button" className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-indigo-700 disabled:opacity-50" disabled={!outcomeReady || outcomes.length >= 99} onClick={() => { setOutcomes(previous => [...previous, outcome]); setOutcome({ unitId: '', text: '', bloomLevel: '', assessments: [] }); setFormError(''); }}>Add another learning outcome</button>}
      </div>}
  </CurriculumFormDialog></>;
}
