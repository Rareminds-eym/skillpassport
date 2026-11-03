import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { EyeIcon, PencilSquareIcon, UserPlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import { apiPost } from '@/shared/api/apiClient';
import { APPLICATION_STATUSES, reviewApplicationSchema, reviewChoices, statusLabel } from '@/shared/schemas/applicationReview';
import { Frame, textList } from './RequisitionDialogs';
import type { Opportunity } from '../Requisitions';

export interface ApplicationRecord {
  id: string;
  learner_id?: string;
  application_status: string;
  applied_at: string;
  updated_at: string;
  notes?: string | null;
  learners?: { id?: string; name?: string; email?: string; profile?: Record<string, unknown> | null } | null;
}
type Shortlist = { id: string; name: string; candidate_count?: number };
const button = 'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50';
const primary = twMerge(button, 'border-transparent bg-primary-600 text-white hover:bg-primary-700');
const field = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
const text = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return textList(value).join(', ');
  return 'Not provided';
};
const profileOf = (app: ApplicationRecord) => ({ ...app.learners, ...(app.learners?.profile || {}) }) as Record<string, unknown>;
const nameOf = (app: ApplicationRecord) => text(profileOf(app).name) === 'Not provided' ? 'Candidate unavailable' : text(profileOf(app).name);
const formatDate = (value: string) => Number.isNaN(Date.parse(value)) ? 'Not available' : new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const badge = (status: string) => status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : status === 'accepted' ? 'bg-green-50 text-green-800 border-green-200' : status === 'under_review' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-700 border-gray-200';
function Status({ value }: { value: string }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badge(value)}`}>{statusLabel(value || 'unknown')}</span>; }

function ActionIcon({ label, tooltip = label, icon: Icon, disabled = false, danger = false, onClick }: {
  label: string; tooltip?: string; icon: typeof EyeIcon; disabled?: boolean; danger?: boolean; onClick: () => void;
}) {
  const control = <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
    className={twMerge('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40', danger && 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700')}>
    <Icon className="h-5 w-5" aria-hidden="true" />
  </button>;
  return <Tooltip.Root>
    <Tooltip.Trigger asChild>{disabled ? <span tabIndex={0} aria-label={`${label}: ${tooltip}`} className="inline-flex cursor-not-allowed rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">{control}</span> : control}</Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content side="top" sideOffset={7} collisionPadding={12}
      className="z-[70] max-w-64 rounded-md bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
      {tooltip}<Tooltip.Arrow className="fill-gray-900" />
    </Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root>;
}

export function ApplicationsDialog({ requisition, canManage, onClose }: { requisition: Opportunity; canManage: boolean; onClose: () => void }) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ id: string; reject: boolean } | null>(null);
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const result = await apiPost<{ data: ApplicationRecord[] }>('/recruiter/actions', { action: 'get-applications-by-opportunity', opportunityId: requisition.id });
      if (!Array.isArray(result?.data)) throw new Error('Applications could not be loaded. Please retry.');
      if (request === sequence.current) setApplications(result.data);
    } catch (failure) { if (request === sequence.current) setError(errorText(failure)); }
    finally { if (request === sequence.current) setLoading(false); }
  }, [requisition.id]);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  const selected = applications.find(app => app.id === selectedId);
  const edited = applications.find(app => app.id === editor?.id);
  const shortlisted = applications.find(app => app.id === shortlistId);
  const visible = applications.filter(app => {
    const profile = profileOf(app);
    return (filter === 'all' || app.application_status === filter) && [nameOf(app), profile.email, profile.course, profile.branch_field].map(text).join(' ').toLowerCase().includes(search.trim().toLowerCase());
  });
  const close = () => { if (!selectedId && !editor && !shortlistId) onClose(); };
  const actions = (app: ApplicationRecord) => {
    const transitions = reviewChoices(app.application_status);
    const unavailable = !canManage ? 'Your role does not allow application management' : 'Manage this stage through the hiring pipeline or candidate workflow';
    return <div className="flex items-center gap-2">
      <ActionIcon label={`View ${nameOf(app)}`} tooltip="View candidate details" icon={EyeIcon} onClick={() => setSelectedId(app.id)} />
      <ActionIcon label="Update status" tooltip={!canManage || !transitions.length ? unavailable : 'Update application status'} icon={PencilSquareIcon} disabled={!canManage || !transitions.length} onClick={() => setEditor({ id: app.id, reject: false })} />
      <ActionIcon label="Add to shortlist" tooltip={!canManage ? unavailable : !(app.learner_id || app.learners?.id) ? 'Candidate profile is unavailable' : 'Add candidate to shortlist'} icon={UserPlusIcon} disabled={!canManage || !(app.learner_id || app.learners?.id)} onClick={() => setShortlistId(app.id)} />
      <ActionIcon label={app.application_status === 'rejected' ? 'Rejected' : 'Reject'} tooltip={app.application_status === 'rejected' ? 'Already rejected. Use Update status to reopen for review.' : !canManage || !transitions.includes('rejected') ? unavailable : 'Reject application'} icon={XCircleIcon} danger disabled={!canManage || !transitions.includes('rejected')} onClick={() => setEditor({ id: app.id, reject: true })} />
    </div>;
  };
  return <Tooltip.Provider delayDuration={200} skipDelayDuration={100}><Frame title={`Applications for ${requisition.job_title || requisition.title}`} description={loading ? 'Loading applications…' : error ? 'Applications are temporarily unavailable.' : `${applications.length} application${applications.length === 1 ? '' : 's'} received · ${requisition.company_name}`} onClose={close}>
    <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input className={`${field} flex-1`} aria-label="Search applications" placeholder="Search candidates or education" value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`${field} sm:w-auto`} aria-label="Filter applications by status" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All statuses</option>{APPLICATION_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <button className={button} disabled={loading} onClick={() => void load()}>Refresh applications</button>
      </div>
      {!canManage && <p className="mb-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">You have view access. Application management requires permission from your organization.</p>}
      {loading ? <p role="status" className="py-12 text-center text-sm text-gray-500">Loading applications…</p> : error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{error}</p><button className={`${button} mt-3`} onClick={() => void load()}>Retry loading applications</button></div> : !applications.length ? <p className="py-12 text-center text-sm text-gray-500">No applications received yet.</p> : !visible.length ? <p className="py-12 text-center text-sm text-gray-500">No applications match your search or status filter.</p> : <>
        <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
          <table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr>{['Candidate', 'Education', 'Status', 'Applied', 'Actions'].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200">{visible.map(app => { const profile = profileOf(app); return <tr key={app.id} className="align-top hover:bg-gray-50/50"><td className="px-4 py-4"><p className="font-medium text-gray-900">{nameOf(app)}</p><p className="mt-1 break-words text-xs text-gray-500">{text(profile.email)}</p></td><td className="px-4 py-4 text-gray-600">{text(profile.course || profile.branch_field)}</td><td className="px-4 py-4"><Status value={app.application_status} /></td><td className="px-4 py-4 text-xs text-gray-600">{formatDate(app.applied_at)}</td><td className="w-px whitespace-nowrap px-4 py-4">{actions(app)}</td></tr>; })}</tbody>
          </table>
        </div>
        <div className="space-y-4 md:hidden">{visible.map(app => { const profile = profileOf(app); return <article key={app.id} className="space-y-3 rounded-lg border border-gray-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-base font-semibold text-gray-900">{nameOf(app)}</h3><p className="break-all text-sm text-gray-500">{text(profile.email)}</p></div><Status value={app.application_status} /></div><dl className="text-sm text-gray-600"><dt className="font-medium">Education</dt><dd>{text(profile.course || profile.branch_field)}</dd><dt className="mt-2 font-medium">Applied</dt><dd>{formatDate(app.applied_at)}</dd></dl>{actions(app)}</article>; })}</div>
      </>}
    </div>
    <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-gray-50 px-5 py-4 sm:px-7"><p className="text-xs text-gray-500">{!loading && !error ? `Showing ${visible.length} of ${applications.length}` : 'Application review'}</p><button className={button} onClick={close}>Close</button></div>
    {selected && <CandidateDetails app={selected} requisition={requisition} onClose={() => setSelectedId(null)} />}
    {edited && <ReviewEditor app={edited} opportunityId={requisition.id} reject={Boolean(editor?.reject)} onClose={() => setEditor(null)} onSuccess={updated => { setApplications(prev => prev.map(app => app.id === updated.id ? { ...app, ...updated } : app)); setEditor(null); toast.success('Application status updated'); }} />}
    {shortlisted && <ShortlistDialog app={shortlisted} onClose={() => setShortlistId(null)} />}
  </Frame></Tooltip.Provider>;
}

function CandidateDetails({ app, requisition, onClose }: { app: ApplicationRecord; requisition: Opportunity; onClose: () => void }) {
  const profile = profileOf(app);
  const details = [['Applied position', requisition.job_title || requisition.title], ['Email', profile.email], ['Phone', profile.phone_number || profile.contact_number], ['Passport ID', profile.passport_id], ['Registration number', profile.registration_number], ['Course', profile.course], ['Branch / field', profile.branch_field], ['Institution', profile.college_school_name || profile.university], ['Skills', profile.skills || profile.skill], ['Applied', formatDate(app.applied_at)], ['Last updated', formatDate(app.updated_at)]];
  const email = typeof profile.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ? profile.email : null;
  return <Frame title={nameOf(app)} description={`Application for ${requisition.job_title || requisition.title}`} onClose={onClose}>
    <div className="overflow-y-auto p-5 sm:p-7"><Status value={app.application_status} /><dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={String(label)}><dt className="text-xs font-medium text-gray-500">{String(label)}</dt><dd className="mt-1 break-words text-sm text-gray-900">{text(value)}</dd></div>)}</dl>
      <section className="mt-6 border-t pt-5"><h3 className="mb-2 text-base font-semibold text-gray-900">Review history</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{app.notes || 'No review notes yet.'}</p></section>
    </div>
    <div className="flex shrink-0 justify-end gap-3 border-t bg-gray-50 px-5 py-4">{email && <a className={button} href={`mailto:${encodeURIComponent(email)}`}>Compose email</a>}<button className={primary} onClick={onClose}>Back to applications</button></div>
  </Frame>;
}

function ReviewEditor({ app, opportunityId, reject, onClose, onSuccess }: { app: ApplicationRecord; opportunityId: string; reject: boolean; onClose: () => void; onSuccess: (app: Partial<ApplicationRecord> & { id: string }) => void }) {
  const options = reviewChoices(app.application_status);
  const [status, setStatus] = useState<string>(reject ? 'rejected' : options.find(value => value !== 'rejected') || options[0] || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const reasonRequired = status === 'rejected' || app.application_status === 'rejected';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (lock.current) return;
    const parsed = reviewApplicationSchema.safeParse({ id: app.id, opportunityId, expectedStatus: app.application_status, expectedUpdatedAt: app.updated_at, status, note });
    if (!parsed.success) { setError(parsed.error.issues.map(issue => issue.message).join(' ')); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await apiPost<{ data: ApplicationRecord }>('/recruiter/actions', { action: 'review-application', ...parsed.data });
      if (!result.data?.id || !result.data.application_status || !result.data.updated_at) throw new Error('The application update was not confirmed. Refresh applications before retrying.');
      onSuccess(result.data);
    } catch (failure) { setError(errorText(failure)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Frame small title={reject ? 'Reject application?' : 'Update application status'} description={`${nameOf(app)} · Currently ${statusLabel(app.application_status).toLowerCase()}`} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="flex min-h-0 flex-col" aria-busy={busy}>
      <div className="space-y-5 overflow-y-auto p-5 sm:p-7">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {reject ? <p className="text-sm text-gray-700">Confirm rejection of this application. The candidate’s submitted record and your review history will be retained.</p> : <div><label htmlFor="application-review-status" className="mb-2 block text-sm font-medium text-gray-700">New status</label><select id="application-review-status" className={field} value={status} disabled={busy} onChange={e => setStatus(e.target.value)}>{options.map(value => <option key={value} value={value}>{value === 'under_review' && app.application_status === 'rejected' ? 'Reopen for review' : statusLabel(value)}</option>)}</select></div>}
        <div><label htmlFor="application-review-note" className="mb-2 block text-sm font-medium text-gray-700">Review reason {reasonRequired ? '(required)' : '(optional)'}</label><textarea id="application-review-note" className={field} rows={4} maxLength={2000} value={note} disabled={busy} onChange={e => setNote(e.target.value)} aria-describedby="application-review-hint" /><p id="application-review-hint" className="mt-1 text-xs text-gray-500">Recorded in application review history. No candidate message is sent.</p></div>
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t bg-gray-50 px-5 py-4"><button type="button" className={button} disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={reject ? twMerge(button, 'border-red-600 bg-red-600 text-white hover:bg-red-700') : primary} disabled={busy}>{busy ? 'Saving…' : reject ? 'Confirm rejection' : 'Save status'}</button></div>
    </form>
  </Frame>;
}

function ShortlistDialog({ app, onClose }: { app: ApplicationRecord; onClose: () => void }) {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let current = true; setLoading(true); setError('');
    apiPost<{ data: { shortlists: Shortlist[] } }>('/opportunities', { action: 'get-shortlists' }).then(result => {
      if (!Array.isArray(result.data?.shortlists)) throw new Error('Shortlists could not be loaded.');
      if (current) setShortlists(result.data.shortlists);
    }).catch(failure => { if (current) setError(errorText(failure)); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [version]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (lock.current || !selected) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await apiPost<{ data: { data?: { id: string } | null; error?: { message: string } } }>('/opportunities', { action: 'add-candidate-to-shortlist', shortlist_id: selected, learner_id: app.learner_id || app.learners?.id });
      if (result.data?.error) throw new Error(result.data.error.message);
      if (!result.data?.data?.id) throw new Error('The shortlist update was not confirmed. Please refresh before retrying.');
      toast.success('Candidate added to shortlist'); onClose();
    } catch (failure) { setError(errorText(failure)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Frame small title="Add to shortlist" description={`Choose a shortlist for ${nameOf(app)}.`} busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="space-y-4 overflow-y-auto p-5 sm:p-7">{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}{loading ? <p role="status" className="text-sm text-gray-500">Loading shortlists…</p> : shortlists.length ? <div><label htmlFor="application-shortlist" className="mb-2 block text-sm font-medium text-gray-700">Shortlist</label><select id="application-shortlist" required value={selected} className={field} disabled={busy} onChange={e => setSelected(e.target.value)}><option value="">Choose a shortlist</option>{shortlists.map(list => <option key={list.id} value={list.id}>{list.name} ({list.candidate_count || 0})</option>)}</select></div> : error ? <button type="button" className={button} onClick={() => setVersion(v => v + 1)}>Retry loading shortlists</button> : <p className="text-sm text-gray-600">Create a shortlist on the <Link className="text-primary-700 underline" to="/recruitment/shortlists">Shortlists page</Link>, then return here to add this candidate.</p>}</div>
      <div className="flex shrink-0 justify-end gap-3 border-t bg-gray-50 px-5 py-4"><button type="button" className={button} disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={primary} disabled={busy || loading || !selected}>{busy ? 'Adding…' : 'Add candidate'}</button></div>
    </form>
  </Frame>;
}
