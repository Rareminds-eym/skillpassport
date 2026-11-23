import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';
import { uploadFile, validateFile } from '@/shared/api/fileUploadService';
import { LessonPlanDetails } from './LessonPlanDetails';
import type { EducatorLessonPlan, EducatorLessonPlans, LessonPlanContent, LessonPlanCurriculum } from '../model/types';

type Scope = { courseId: string; programId: string; semester: number };
type Draft = Omit<LessonPlanContent, 'id' | 'duration_minutes'> & { id?: string; duration_minutes: number; additional_notes: string };
const control = 'mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const button = 'min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50';

function makeDraft(plan?: EducatorLessonPlan): Draft {
  const today = new Date();
  return {
    ...(plan ? { id: plan.id } : {}), title: plan?.title || '',
    session_date: plan?.session_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    duration_minutes: plan?.duration_minutes || 60, curriculum_id: plan?.curriculum_id || '', unit_id: plan?.unit_id || '',
    session_objectives: plan?.session_objectives || '', teaching_methodology: plan?.teaching_methodology || '',
    required_materials: plan?.required_materials || '', evaluation_criteria: plan?.evaluation_criteria || '',
    follow_up_activities: plan?.follow_up_activities || '', additional_notes: plan?.additional_notes || '',
    selected_learning_outcomes: plan?.selected_learning_outcomes || [], resource_links: plan?.resource_links || [],
    resource_files: plan?.resource_files || [], evaluation_items: plan?.evaluation_items || [],
  };
}

function Editor({ draft: initial, curricula, pending, error, onSave, onCancel }: {
  draft: Draft; curricula: LessonPlanCurriculum[]; pending: boolean; error?: string;
  onSave: (draft: Draft) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const curriculum = curricula.find(item => item.id === draft.curriculum_id);
  const busy = pending || uploading;
  const textFields = [
    ['session_objectives', 'Session objectives', true], ['teaching_methodology', 'Teaching approach', true],
    ['required_materials', 'Required materials', false], ['evaluation_criteria', 'Evaluation criteria', false],
    ['follow_up_activities', 'Follow-up activities', false], ['additional_notes', 'Staff notes (not shown to learners)', false],
  ] as const;
  return <form aria-label="College lesson plan" className="space-y-5 rounded-xl border border-gray-200 bg-white p-4" onSubmit={event => { event.preventDefault(); if (!busy) onSave(draft); }}>
    <h3 className="!text-lg !font-semibold text-gray-900">{draft.id ? 'Edit lesson plan' : 'New lesson plan'}</h3>
    <p className="!text-sm !leading-6 text-gray-500">New plans are drafts until your administrator publishes them. Edits to published plans are visible to learners.</p>
    <fieldset disabled={busy} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Session title *<input autoFocus required maxLength={255} className={control} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">Session date *<input type="date" required className={control} value={draft.session_date} onChange={event => setDraft({ ...draft, session_date: event.target.value })} /></label>
        <label className="block text-sm font-medium text-gray-700">Duration (minutes) *<input type="number" required min={1} max={1440} className={control} value={draft.duration_minutes} onChange={event => setDraft({ ...draft, duration_minutes: Number(event.target.value) })} /></label>
      </div>
      <label className="block text-sm font-medium text-gray-700">Academic year / curriculum *<select required className={control} value={draft.curriculum_id} onChange={event => setDraft({ ...draft, curriculum_id: event.target.value, unit_id: '', selected_learning_outcomes: [] })}>
        <option value="">Select curriculum</option>{curricula.map(item => <option key={item.id} value={item.id}>{item.academic_year}</option>)}
      </select></label>
      <label className="block text-sm font-medium text-gray-700">Unit *<select required disabled={!curriculum || busy} className={control} value={draft.unit_id} onChange={event => setDraft({ ...draft, unit_id: event.target.value, selected_learning_outcomes: [] })}>
        <option value="">Select unit</option>{curriculum?.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
      </select></label>
      {curriculum && !curriculum.units.length && <p className="text-sm text-amber-700">This curriculum needs a unit before a lesson plan can be created.</p>}
      {!!draft.unit_id && <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-gray-700">Learning outcomes</legend>{curriculum?.outcomes.filter(item => item.unit_id === draft.unit_id).map(item => <label key={item.id} className="flex min-h-11 items-start gap-3 py-2 text-sm text-gray-700"><input type="checkbox" className="mt-1" checked={draft.selected_learning_outcomes.includes(item.id)} onChange={event => setDraft({ ...draft, selected_learning_outcomes: event.target.checked ? [...draft.selected_learning_outcomes, item.id] : draft.selected_learning_outcomes.filter(id => id !== item.id) })} />{item.outcome_text}</label>)}</fieldset>}
      {textFields.map(([key, label, required]) => <label key={key} className="block text-sm font-medium text-gray-700">{label}{required && ' *'}<textarea rows={3} maxLength={10000} required={required} className={control} value={draft[key] || ''} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
      <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium text-gray-700">Evaluation weightages (optional; total 100%)</legend>
        {draft.evaluation_items.map((item, index) => <div key={item.id} className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-sm text-gray-700">Criterion<input required maxLength={1000} className={control} value={item.criterion} onChange={event => setDraft({ ...draft, evaluation_items: draft.evaluation_items.map((row, i) => i === index ? { ...row, criterion: event.target.value } : row) })} /></label>
          <label className="w-24 text-sm text-gray-700">Weightage %<input required type="number" min={0} max={100} step="any" className={control} value={item.percentage} onChange={event => setDraft({ ...draft, evaluation_items: draft.evaluation_items.map((row, i) => i === index ? { ...row, percentage: Number(event.target.value) } : row) })} /></label>
          <button type="button" className={button} aria-label={`Remove criterion ${index + 1}`} onClick={() => setDraft({ ...draft, evaluation_items: draft.evaluation_items.filter(row => row.id !== item.id) })}>Remove</button>
        </div>)}
        <button type="button" className={button} disabled={draft.evaluation_items.length >= 50} onClick={() => setDraft({ ...draft, evaluation_items: [...draft.evaluation_items, { id: crypto.randomUUID(), criterion: '', percentage: 0 }] })}>Add criterion</button>
      </fieldset>
      <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium text-gray-700">Resource links</legend>
        {draft.resource_links.map((item, index) => <div key={item.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <label className="block text-sm text-gray-700">Resource title<input required maxLength={255} className={control} value={item.title} onChange={event => setDraft({ ...draft, resource_links: draft.resource_links.map((row, i) => i === index ? { ...row, title: event.target.value } : row) })} /></label>
          <label className="block text-sm text-gray-700">URL<input required type="url" maxLength={2048} className={control} value={item.url} onChange={event => setDraft({ ...draft, resource_links: draft.resource_links.map((row, i) => i === index ? { ...row, url: event.target.value } : row) })} /></label>
          <button type="button" className={button} onClick={() => setDraft({ ...draft, resource_links: draft.resource_links.filter(row => row.id !== item.id) })}>Remove link</button>
        </div>)}
        <button type="button" className={button} disabled={draft.resource_links.length >= 50} onClick={() => setDraft({ ...draft, resource_links: [...draft.resource_links, { id: crypto.randomUUID(), title: '', url: '' }] })}>Add resource link</button>
      </fieldset>
      <div className="space-y-3"><label className="block text-sm font-medium text-gray-700">Resource files<input type="file" disabled={draft.resource_files.length >= 50} className={control} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        const valid = validateFile(file, { maxSize: 50, allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'] }); if (!valid.valid) { setFileError(valid.error || 'Invalid file.'); return; }
        setUploading(true); setFileError('');
        try { const uploaded = await uploadFile(file, 'college-lesson-plans', undefined, 'course_resource'); if (!uploaded.success || !uploaded.url) throw new Error(uploaded.error || 'Upload failed.');
          setDraft(current => ({ ...current, resource_files: [...current.resource_files, { id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, url: uploaded.url! }] }));
        } catch (error) { setFileError(error instanceof Error ? error.message : 'Upload failed.'); } finally { setUploading(false); }
      }} /></label>
      {draft.resource_files.map(item => <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-gray-700"><span className="break-all">{item.name}</span><button type="button" className={button} aria-label={`Remove ${item.name}`} onClick={() => setDraft({ ...draft, resource_files: draft.resource_files.filter(row => row.id !== item.id) })}>Remove</button></div>)}</div>
    </fieldset>
    {uploading && <p role="status" className="text-sm text-gray-500">Uploading resource...</p>}
    {(error || fileError) && <p role="alert" className="text-sm text-red-700">{error || fileError}</p>}
    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4"><button type="button" disabled={busy} className={button} onClick={onCancel}>Cancel</button><button disabled={busy} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{pending ? 'Saving...' : 'Save lesson plan'}</button></div>
  </form>;
}

export function EducatorLessonPlansPanel(scope: Scope) {
  const actor = useUser();
  const client = useQueryClient();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const key = ['college-educator-lesson-plans', actor?.id, scope.courseId, scope.programId, scope.semester];
  const result = useQuery({ queryKey: key, queryFn: async () => {
    const query = new URLSearchParams({ courseId: scope.courseId, programId: scope.programId, semester: String(scope.semester) });
    return (await apiGet<{ data: EducatorLessonPlans }>(`/college-courses/lesson-plans?${query}`)).data;
  }});
  const finish = () => { setDraft(null); requestAnimationFrame(() => trigger.current?.focus()); };
  const save = useMutation({ mutationFn: (plan: Draft) => apiPost('/college-courses/lesson-plans', { ...scope, plan }), onSuccess: async () => {
    await client.invalidateQueries({ queryKey: key });
    void client.invalidateQueries({ queryKey: ['learner-college-courses'] });
    finish();
  }});
  const edit = (plan?: EducatorLessonPlan) => { trigger.current = document.activeElement as HTMLButtonElement; save.reset(); setDraft(makeDraft(plan)); };
  return <section aria-label="College lesson plans" className="space-y-4">
    {result.isPending && <p role="status" className="text-sm text-gray-500">Loading lesson plans...</p>}
    {result.error && <p role="alert" className="text-sm text-red-700">{result.error.message} <button type="button" className={button} onClick={() => result.refetch()}>Retry</button></p>}
    {result.data && !result.error && <>
      {save.isSuccess && !draft && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Lesson plan saved.</p>}
      {draft && result.data.canEdit ? <Editor key={draft.id || 'new'} draft={draft} curricula={result.data.curricula} pending={save.isPending} error={save.error?.message} onSave={plan => save.mutate(plan)} onCancel={finish} /> : <>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="!text-base !font-semibold text-gray-900">Lesson plans</h3><p className="mt-1 !text-sm !leading-6 text-gray-500">{result.data.canEdit ? 'You can create and edit plans. Your administrator manages publishing.' : 'Read-only access. Your administrator controls editing permissions.'}</p></div>{result.data.canEdit && <button type="button" disabled={!result.data.curricula.some(item => item.units.length)} className={button} onClick={() => edit()}>Add lesson plan</button>}</div>
        {!result.data.plans.length && <p className="rounded-lg border border-dashed border-gray-200 p-5 !text-sm !leading-6 text-gray-500">{result.data.curricula.some(item => item.units.length) ? 'No lesson plans have been added for this mapped course yet.' : 'Add curriculum units before creating lesson plans.'}</p>}
        {result.data.plans.map(plan => <article key={plan.id} className="rounded-xl border border-gray-200 bg-white p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h4 className="!text-base !font-semibold text-gray-900">{plan.title}</h4><p className="mt-1 !text-xs text-gray-500">{plan.academic_year} · {plan.status === 'published' ? 'Published' : 'Draft — visible to staff only'}</p></div>{result.data.canEdit && <button type="button" className={button} aria-label={`Edit ${plan.title}`} onClick={() => edit(plan)}>Edit</button>}</div>
          <details><summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-indigo-700">View lesson plan</summary><LessonPlanDetails plan={plan} outcomes={result.data.curricula.find(item => item.id === plan.curriculum_id)?.outcomes} />{plan.additional_notes && <section className="mt-4"><h4 className="!text-sm !font-semibold text-gray-900">Staff notes</h4><p className="mt-1 whitespace-pre-wrap !text-sm !leading-6 text-gray-600">{plan.additional_notes}</p></section>}</details>
        </article>)}
      </>}
      {!result.data.canEdit && draft && <p role="alert" className="text-sm text-amber-700">Editing access was removed. Your unsaved changes cannot be submitted.</p>}
    </>}
  </section>;
}
