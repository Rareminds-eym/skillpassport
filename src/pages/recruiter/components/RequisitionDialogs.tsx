import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Opportunity, Recruiter } from '../Requisitions';
import { LearningRequirementsEditor, type LearningRequirement } from '@/features/opportunities/ui/LearningRequirementsEditor';

// Older imports stored JSON arrays as text. Normalize before editing or rendering.
export function textList(value: unknown, separator = '\n'): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return textList(parsed);
  } catch { /* Plain text from legacy CSV imports. */ }
  return value.split(separator).map(v => v.trim()).filter(Boolean);
}

export function formatSalary(job: Pick<Opportunity, 'salary_range_min' | 'salary_range_max'>): string {
  const format = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const min = job.salary_range_min;
  const max = job.salary_range_max;
  if (min != null && max != null) return `${format(min)} – ${format(max)}`;
  if (min != null) return `From ${format(min)}`;
  if (max != null) return `Up to ${format(max)}`;
  return 'Salary not specified';
}

const button = 'inline-flex min-h-11 sm:min-h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${button} border-transparent bg-primary-600 text-white hover:bg-primary-700`;
const secondary = `${button} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const input = 'requisition-field min-h-11 sm:min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-5 text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export function Frame({ title, description, busy = false, onClose, children, small = false }: {
  title: string; description: string; busy?: boolean; small?: boolean; onClose: () => void; children: React.ReactNode;
}) {
  const returnFocus=useRef(document.activeElement instanceof HTMLElement?document.activeElement:null);
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm" />
      <Dialog.Content onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus()}} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
        onPointerDownOutside={event => { if (busy) event.preventDefault(); }}
        className={`fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-2xl focus:outline-none ${small ? 'max-w-lg' : 'max-w-4xl'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div><Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">{description}</Dialog.Description></div>
          <Dialog.Close disabled={busy} aria-label="Close dialog" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"><XMarkIcon className="h-5 w-5" /></Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function initialValues(job?: Opportunity, currentRecruiterId?: string | null) {
  return {
    job_title: job?.job_title || job?.title || '', company_name: job?.company_name || '', company_logo: job?.company_logo || '',
    department: job?.department || '', location: job?.location || '', mode: String(job?.mode || 'on-site').toLowerCase(),
    employment_type: String(job?.employment_type || 'Full-time'), experience_level: String(job?.experience_level || 'Mid'),
    experience_required: job?.experience_required || '', skills_required: textList(job?.skills_required, ',').join(', '),
    deadline: job?.deadline?.slice(0, 10) || '', benefits: textList(job?.benefits).join('\n'),
    salary_range_min: job?.salary_range_min?.toString() ?? '', salary_range_max: job?.salary_range_max?.toString() ?? '',
    description: job?.description || '', requirements: textList(job?.requirements).join('\n'),
    responsibilities: textList(job?.responsibilities).join('\n'), status: String(job?.status || 'draft'),
    recruiter_id: job?.recruiter_id || currentRecruiterId || '',
  };
}
type Values = ReturnType<typeof initialValues>;

export function RequisitionForm({ requisition, recruiters, currentRecruiterId, onClose, onSuccess }: {
  requisition?: Opportunity; recruiters: Recruiter[]; currentRecruiterId?: string | null;
  onClose: () => void; onSuccess: (data: Record<string, unknown>) => Promise<void> | void;
}) {
  const [values, setValues] = useState(() => initialValues(requisition, currentRecruiterId));
  const [learningRequirements,setLearningRequirements]=useState<LearningRequirement[]>(requisition?.learning_requirements||[]);
  const [learningPending,setLearningPending]=useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const editing = Boolean(requisition);
  const prefix = editing ? 'edit-requisition' : 'new-requisition';
  const set = (key: keyof Values, value: string) => setValues(prev => ({ ...prev, [key]: value }));
  const showError = (message: string) => { setError(message); requestAnimationFrame(() => errorRef.current?.focus()); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    if (learningPending) return showError('Add the selected learning requirements or clear the capability selection before saving.');
    const required: (keyof Values)[] = ['job_title', 'company_name', 'department', 'location', 'description'];
    if (required.some(key => !values[key].trim())) return showError('Enter a job title, company, department, location, and description. Blank spaces are not valid.');
    const min = values.salary_range_min === '' ? null : Number(values.salary_range_min);
    const max = values.salary_range_max === '' ? null : Number(values.salary_range_max);
    if ([min, max].some(v => v !== null && (!Number.isInteger(v) || v < 0 || v > 2147483647))) return showError('Salary must be a non-negative whole number up to ₹2,14,74,83,647.');
    if (min !== null && max !== null && min > max) return showError('Maximum salary must be greater than or equal to minimum salary.');
    if (values.deadline && values.deadline !== requisition?.deadline?.slice(0, 10) && new Date(`${values.deadline}T23:59:59`) < new Date()) return showError('Choose today or a future application deadline.');
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await onSuccess({
        ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])),
        company_logo: values.company_logo.trim() || null,
        recruiter_id: values.recruiter_id || null,
        experience_required: values.experience_required.trim() || null,
        salary_range_min: min, salary_range_max: max,
        skills_required: [...new Set(textList(values.skills_required, ','))],
        benefits: textList(values.benefits), requirements: textList(values.requirements), responsibilities: textList(values.responsibilities),
        learning_requirements:learningRequirements, learning_requirements_version:requisition?.learning_requirements_version||1,
        deadline: values.deadline ? new Date(`${values.deadline}T23:59:59`).toISOString() : null,
      });
    } catch (failure) {
      showError(failure instanceof Error ? failure.message : 'Unable to save this requisition. Please try again.');
    } finally { lock.current = false; setBusy(false); }
  };

  const field = (key: keyof Values, label: string, options: { required?: boolean; type?: string; placeholder?: string; choices?: string[][]; multiline?: boolean; hint?: string } = {}) => {
    const id = `${prefix}-${key}`;
    return <div key={key}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-gray-700">{label}{options.required && <span className="text-red-600"> *</span>}</label>
      {options.choices ? <select id={id} name={key} className={input} value={values[key]} onChange={e => set(key, e.target.value)} required={options.required}>
        {options.choices.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select> : options.multiline ? <textarea id={id} name={key} className={`${input} resize-y`} rows={key === 'description' ? 3 : 2} value={values[key]} onChange={e => set(key, e.target.value)} placeholder={options.placeholder} required={options.required} maxLength={20000} /> :
        <input id={id} name={key} type={options.type || 'text'} className={input} value={values[key]} onChange={e => set(key, e.target.value)} placeholder={options.placeholder} required={options.required}
          min={options.type === 'number' ? 0 : undefined} max={options.type === 'number' ? 2147483647 : undefined} step={options.type === 'number' ? 1 : undefined}
          maxLength={key === 'company_logo' ? 2048 : 500} />}
      {options.hint && <p className="mt-1 text-xs text-gray-500">{options.hint}</p>}
    </div>;
  };
  const choices = (items: string[]) => items.map(value => [value, value]);
  const recruiterChoices = [['', 'Unassigned'], ...recruiters.map(r => [r.id, r.name ? `${r.name} (${r.email})` : r.email])];
  if (values.recruiter_id && !recruiters.some(r => r.id === values.recruiter_id)) recruiterChoices.push([values.recruiter_id, 'Current assignee (unavailable)']);

  return <Frame title={editing ? 'Edit Job Requisition' : 'Create Job Requisition'} description="Define the opening and hiring requirements. Fields marked * are required." busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="flex min-h-0 flex-col" aria-busy={busy}>
      <div className="overflow-y-auto px-5 py-4 sm:px-6">
        {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 outline-none">{error}</div>}
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Opening details</legend>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {field('job_title', 'Job title', { required: true, placeholder: 'e.g., Senior Full Stack Developer' })}
            {field('department', 'Department', { required: true, placeholder: 'e.g., Engineering' })}
            {field('company_name', 'Company name', { required: true, placeholder: 'e.g., Tech Corp Inc.' })}
            {field('company_logo', 'Company logo URL', { type: 'url', placeholder: 'https://example.com/logo.png' })}
            {field('location', 'Location', { required: true, placeholder: 'e.g., Bangalore, Remote' })}
            {field('mode', 'Work mode', { choices: [['on-site', 'On-site'], ['remote', 'Remote'], ['hybrid', 'Hybrid']] })}
            {field('employment_type', 'Employment type', { choices: choices([...new Set(['Full-time', 'Part-time', 'Contract', 'Internship', values.employment_type])]) })}
            {field('experience_level', 'Experience level', { choices: choices([...new Set(['Entry', 'Mid', 'Senior', 'Lead', values.experience_level])]) })}
            {field('experience_required', 'Experience required', { placeholder: 'e.g., 3–5 years' })}
            {field('recruiter_id', 'Assigned recruiter', { choices: recruiterChoices, hint: 'Optional. Assign an active recruiter from your organization.' })}
            {field('status', 'Status', { choices: [['draft', 'Draft'], ['open', 'Open'], ['on_hold', 'On hold'], ['closed', 'Closed']] })}
            {field('deadline', 'Application deadline', { type: 'date' })}
            {field('salary_range_min', 'Minimum salary (₹)', { type: 'number', placeholder: 'e.g., 1500000' })}
            {field('salary_range_max', 'Maximum salary (₹)', { type: 'number', placeholder: 'e.g., 2500000' })}
          </div>
          <LearningRequirementsEditor value={learningRequirements} onChange={setLearningRequirements} disabled={busy} onPendingChange={setLearningPending}/>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Role & expectations</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{field('skills_required', 'Required skills', { placeholder: 'e.g., React, Node.js, TypeScript, SQL', hint: 'Separate skills with commas.' })}</div>
              <div className="sm:col-span-2">{field('description', 'Job description', { multiline: true, required: true, placeholder: 'Describe the role and responsibilities...' })}</div>
              {field('requirements', 'Requirements', { multiline: true, hint: 'One requirement per line.' })}
              {field('responsibilities', 'Responsibilities', { multiline: true, hint: 'One responsibility per line.' })}
              <div className="sm:col-span-2">{field('benefits', 'Benefits', { multiline: true, hint: 'One benefit per line.' })}</div>
            </div>
          </div>
        </fieldset>
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:px-6">
        <button type="button" disabled={busy} onClick={onClose} className={secondary}>Cancel</button>
        <button type="submit" disabled={busy} className={primary}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create Requisition'}</button>
      </div>
    </form>
  </Frame>;
}

export function RequisitionDetails({ requisition: job, recruiters, onClose, onEdit, onDelete, onViewApplications, canEdit, canDelete }: {
  requisition: Opportunity; recruiters: Recruiter[]; canEdit: boolean; canDelete: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void; onViewApplications: () => void;
}) {
  const recruiter = recruiters.find(r => r.id === job.recruiter_id);
  const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Not specified';
  const details = [
    ['Company', job.company_name], ['Department', job.department], ['Location', job.location], ['Work mode', job.mode],
    ['Employment type', job.employment_type], ['Experience level', job.experience_level], ['Experience required', job.experience_required],
    ['Salary', formatSalary(job)], ['Status', job.status?.replace('_', ' ')], ['Application deadline', date(job.deadline)],
    ['Assigned recruiter', recruiter?.name || recruiter?.email || (job.recruiter_id ? 'Assignee unavailable' : 'Unassigned')],
    ['Posted', date(job.posted_date)], ['Last updated', date(job.updated_at)],
  ];
  return <Frame title={job.job_title || job.title} description={`${job.company_name} · Requisition details`} onClose={onClose}>
    <div className="overflow-y-auto px-5 py-4 sm:px-6">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {details.map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-900">{value || 'Not specified'}</dd></div>)}
      </dl>
      <div className="mt-6 space-y-6">
        <section aria-label="Published learning requirements"><h3 className="mb-2 font-semibold text-gray-900">Learning requirements</h3>
          {job.learning_requirements?.length ? <ul className="space-y-2 text-sm text-gray-700">{job.learning_requirements.map(requirement=><li key={requirement.levelId} className="flex items-start justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"><span className="min-w-0 break-words">{requirement.capabilityName} · Level {requirement.levelNumber}<span className="mt-1 block text-xs text-gray-500">{requirement.title}</span></span><span className="shrink-0 text-xs font-medium">{requirement.mandatory?'Required':'Preferred'}</span></li>)}</ul> : <p className="text-sm text-gray-500">No structured learning requirements.</p>}
        </section>
        <section><h3 className="mb-2 font-semibold text-gray-900">Job description</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{job.description || 'No description provided.'}</p></section>
        {([['Required skills', textList(job.skills_required, ',')], ['Requirements', textList(job.requirements)], ['Responsibilities', textList(job.responsibilities)], ['Benefits', textList(job.benefits)]] as [string, string[]][]).map(([title, items]) =>
          <section key={title}><h3 className="mb-2 font-semibold text-gray-900">{title}</h3>{items.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">{items.map((item, i) => <li key={i} className="break-words">{item}</li>)}</ul> : <p className="text-sm text-gray-500">Not specified</p>}</section>)}
      </div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-t bg-gray-50 px-5 py-3 sm:px-6">
      <button className={`${button} border-red-200 text-red-700 hover:bg-red-50`} title={!canDelete ? "Deleting requisitions requires an organization administrator" : undefined} disabled={!canDelete} onClick={onDelete}>Delete</button>
      <button className={`${secondary} sm:ml-auto`} onClick={onViewApplications}>View applications ({job.applications_count})</button>
      <button className={primary} disabled={!canEdit} onClick={onEdit}>Edit requisition</button>
    </div>
  </Frame>;
}

export function DeleteRequisitionDialog({ requisition: job, busy, error, onClose, onConfirm }: {
  requisition: Opportunity; busy: boolean; error: string; onClose: () => void; onConfirm: () => void;
}) {
  return <Frame title="Delete requisition?" description="This permanently removes the job opening and cannot be undone." small busy={busy} onClose={onClose}>
    <div className="px-6 py-5">
      <div className="flex gap-3"><ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-red-600" /><p className="break-words text-sm text-gray-700">Delete <strong>{job.job_title}</strong> at {job.company_name}? Openings with linked applications or hiring records must be closed to preserve their history.</p></div>
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
    <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
      <button autoFocus disabled={busy} onClick={onClose} className={secondary}>Cancel</button>
      <button disabled={busy} onClick={onConfirm} className={`${button} border-transparent bg-red-600 text-white hover:bg-red-700`}>{busy ? 'Deleting…' : 'Delete requisition'}</button>
    </div>
  </Frame>;
}
