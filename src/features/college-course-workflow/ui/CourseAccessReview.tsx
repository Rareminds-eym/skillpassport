import { useUser } from '@/shared/model/authStore';
import toast from 'react-hot-toast';
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ReviewHistory } from './ReviewHistory';
import { reviewDecisions } from '../lib/reviewHistory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReviewProposalDetails } from './ReviewProposalDetails';
import { courseWorkflow } from '../api/courseWorkflow';
import type { CourseMappingAccess, EditRequest } from '../model/types';

export function CourseAccessReview({ embedded = false, mode = 'all', onReviewed }: { embedded?: boolean; mode?: 'all' | 'access' | 'reviews'; onReviewed?: () => void } = {}) {
  const actor = useUser();
  const [searchParams] = useSearchParams();
  const requestedChange = searchParams.get('reviewChange');
  const openedChange = useRef<string | null>(null);
  const client = useQueryClient();
  const overview = useQuery({ queryKey: ['college-course-admin',actor?.id],queryFn: courseWorkflow.overview });
  const [reviewTab, setReviewTab] = useState('pending');
  const history = useQuery({ queryKey: ['college-course-review-history', actor?.id], queryFn: courseWorkflow.history, enabled: mode !== 'access' && (reviewTab !== 'pending' || Boolean(requestedChange)) });
  const decisions = reviewDecisions(history.data || []);
  const [note,setNote] = useState('');
  const [reviewing,setReviewing] = useState<EditRequest | null>(null);
  useEffect(() => {
    if (!requestedChange || openedChange.current === requestedChange || !overview.data) return;
    const request = overview.data.requests.find(item => item.id === requestedChange);
    if (request) { openedChange.current = requestedChange; setReviewTab('pending'); setReviewing(request); setNote(''); requestAnimationFrame(() => document.getElementById(`curriculum-change-${request.id}`)?.scrollIntoView?.({ block: 'nearest' })); }
    else if (history.data) { const decision = decisions.find(item => item.id === requestedChange); if (decision) { openedChange.current = requestedChange; setReviewTab(decision.status); } }
  }, [requestedChange, overview.data, history.data]);
  const access = useMutation({ mutationFn: ({ id,value }: { id: string; value: 'read' | 'edit' }) => courseWorkflow.setAccess(id,value),onSuccess: () => { void client.invalidateQueries({ queryKey: ['college-course-admin'] }); } });
  const review = useMutation({ mutationFn: ({ request,decision }: { request: EditRequest; decision: 'approved' | 'rejected' }) => courseWorkflow.review(request.id,decision,note),onError: error => { toast.error(error.message || 'Unable to review this change. Please try again.'); },onSuccess: (_result, variables) => { setReviewing(null);setNote('');toast.success(variables.decision === 'approved' ? 'Change approved and applied to the curriculum.' : 'Change rejected. Existing content was preserved.');void client.invalidateQueries({ queryKey: ['college-course-admin'] });void client.invalidateQueries({ queryKey: ['mapped-course-content'] });void client.invalidateQueries({ queryKey: ['college-course-review-history'] });onReviewed?.(); } });
  return <section aria-label={mode === 'reviews' ? 'Pending educator changes' : 'Faculty course access'} className={embedded ? 'space-y-4' : 'rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4'}>
    {!embedded && <h2 className="text-lg font-semibold">{mode === 'reviews' ? 'Pending educator changes' : 'Faculty course access'}</h2>}
    {mode !== 'reviews' && <p className="text-sm leading-6 text-gray-500">Set access for each lecturer’s assigned course. Read allows viewing; Propose edits allows submitting changes for approval.</p>}
    {overview.isPending && <div role="status" aria-label={mode === 'reviews' ? 'Loading educator changes' : 'Loading course access'} className="space-y-3 motion-safe:animate-pulse"><span className="sr-only">Loading...</span>{[1,2,3].map(item => <div key={item} className="space-y-3 rounded-xl border border-gray-200 p-4"><div className="h-4 w-2/3 rounded bg-gray-200" /><div className="h-3 w-1/2 rounded bg-gray-100" /><div className="h-16 rounded-lg bg-gray-100" /></div>)}</div>}
    {overview.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="!text-sm">{overview.error.message}</p><button type="button" className="mt-2 min-h-11 font-semibold underline" onClick={() => { void overview.refetch(); }}>Try again</button></div>}
    {(access.error || review.error) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 !text-sm text-red-700">{access.error?.message || review.error?.message}</p>}
    {overview.data && <>
      {mode !== 'reviews' && (!overview.data.mappings.length ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Assign faculty in Course Mapping to manage course access here.</p> : <>
        <div className="space-y-4">
          {Object.entries(overview.data.mappings.reduce<Record<string, CourseMappingAccess[]>>((groups, mapping) => {
            const key = mapping.email || mapping.faculty_name || mapping.id;
            (groups[key] ||= []).push(mapping);
            return groups;
          }, {})).map(([key, mappings]) => {
            const faculty = mappings[0];
            const name = faculty.faculty_name || faculty.email || 'Mapped faculty';
            const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
            return <div key={key} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50/70 px-4 py-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{initials}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{name}</p>{faculty.email && <p className="mt-0.5 truncate text-xs text-gray-500">{faculty.email}</p>}</div>
                <span className="shrink-0 text-xs text-gray-500">{mappings.length} {mappings.length === 1 ? 'course' : 'courses'}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {mappings.map(mapping => <li key={mapping.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                  <div className="min-w-0"><p className="text-sm font-medium leading-5 text-gray-800">{mapping.course_name}</p><p className="mt-1 text-xs text-gray-500">{mapping.course_code} ? Semester {mapping.semester}</p></div>
                  <div role="group" aria-label={`Access for ${mapping.course_code}, ${name}`} className="inline-flex w-fit shrink-0 gap-1 rounded-lg bg-gray-100 p-1">
                    {([{ value: 'read', label: 'Read' }, { value: 'edit', label: 'Propose edits' }] as const).map(option => <button key={option.value} type="button" aria-pressed={mapping.faculty_access === option.value} disabled={access.isPending} onClick={() => { if (mapping.faculty_access !== option.value) access.mutate({ id: mapping.id, value: option.value }); }} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 ${mapping.faculty_access === option.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{option.label}</button>)}
                  </div>
                </li>)}
              </ul>
            </div>;
          })}
        </div>
        <p role="status" className="text-xs text-gray-500">{access.isPending ? 'Saving permission…' : access.isSuccess ? 'Permission saved. Proposed changes require administrator approval.' : 'Permission changes save automatically. Proposed edits require administrator approval.'}</p>
      </>)}
      {mode !== 'access' && <Tabs.Root value={reviewTab} onValueChange={setReviewTab} className="space-y-4">
        <Tabs.List aria-label="Educator change review status" className="flex border-b border-gray-200">
          {['pending','approved','rejected'].map(value => <Tabs.Trigger key={value} value={value} className="min-h-11 flex-1 border-b-2 border-transparent px-2 py-3 text-sm font-medium capitalize text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">{value === 'pending' ? 'Pending' : value === 'approved' ? 'Approved' : 'Rejected'}</Tabs.Trigger>)}
        </Tabs.List>
        <Tabs.Content value="pending" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><h3 className="!m-0 !text-sm !font-semibold text-gray-900">Pending review</h3><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{overview.data.requests.length}</span></div>
        <button type="button" disabled={overview.isFetching || review.isPending} onClick={() => { void overview.refetch(); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"><ArrowPathIcon aria-hidden="true" className={overview.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />Refresh</button>
      </div>
      {!overview.data.requests.length && <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400"><ClipboardDocumentCheckIcon aria-hidden="true" className="h-6 w-6" /></span>
        <h4 className="!m-0 !text-base !font-semibold text-gray-900">You're all caught up</h4>
        <p className="mt-2 !text-sm text-gray-600">No changes awaiting review.</p>
        <p className="mt-1 max-w-sm !text-sm !leading-6 text-gray-500">New additions and edits submitted by educators will appear here for your approval.</p>
      </div>}
      {overview.data.requests.map(request => <article id={`curriculum-change-${request.id}`} key={request.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3"><h4 className="!m-0 !text-base !font-semibold !leading-6 text-gray-900">{request.course_name}</h4><span className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{Object.keys(request.before_data || {}).length ? 'Proposed edit' : request.entity_type === 'unit' ? 'New unit' : 'New outcome'}</span></div>
          <p className="mt-1 break-words !text-xs text-gray-500">{request.requester_email} &middot; {request.entity_type === 'unit' ? 'Unit / module' : 'Learning outcome'}</p>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          {Object.keys(request.before_data || {}).length ? <dl className="grid gap-5 sm:grid-cols-2">
            <div className="min-w-0"><dt className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold text-gray-500">Current content at submission</dt><dd><ReviewProposalDetails data={request.before_data} entityType={request.entity_type} /></dd></div>
            <div className="min-w-0"><dt className="mb-4 border-b border-indigo-200 pb-2 text-xs font-semibold text-indigo-700">Proposed content</dt><dd><ReviewProposalDetails data={request.proposed_data} entityType={request.entity_type} /></dd></div>
          </dl> : <>
            <p className="!text-xs !leading-5 text-gray-500">New {request.entity_type === 'unit' ? 'unit and its learning outcomes' : 'learning outcome'} to add to this course.</p>
            <ReviewProposalDetails data={request.proposed_data} entityType={request.entity_type} />
          </>}
          <div className="border-t border-gray-100 pt-4">
          {reviewing?.id !== request.id && <button type="button" disabled={review.isPending} className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50" onClick={() => { setReviewing(request);setNote('');review.reset(); }}>Review change</button>}
          {reviewing?.id === request.id && <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Review note<textarea className="mt-2 block min-h-24 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50" disabled={review.isPending} placeholder="Optional feedback for the educator" value={note} maxLength={2000} onChange={event => setNote(event.target.value)} /></label>
            <p className="!text-xs !leading-5 text-gray-500">Approval applies this change immediately. Rejection keeps the current curriculum unchanged.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50" disabled={review.isPending} onClick={() => review.mutate({ request,decision:'approved' })}><CheckCircleIcon aria-hidden="true" className="h-4 w-4" />{review.isPending && review.variables?.decision === 'approved' ? 'Approving...' : 'Approve change'}</button>
              <button type="button" className="h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50" disabled={review.isPending} onClick={() => review.mutate({ request,decision:'rejected' })}>{review.isPending && review.variables?.decision === 'rejected' ? 'Rejecting...' : 'Reject change'}</button>
              <button type="button" className="h-11 rounded-lg px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50" disabled={review.isPending} onClick={() => { setReviewing(null);setNote('');review.reset(); }}>Cancel review</button>
            </div>
          </div>}
          </div>
        </div>
      </article>)}
        </Tabs.Content>
        {['approved','rejected'].map(status => <Tabs.Content key={status} value={status} className="space-y-4">
          <div className="flex items-center justify-between gap-3"><h3 className="!m-0 !text-sm !font-semibold capitalize text-gray-900">{status} changes</h3><button type="button" disabled={history.isFetching} className="min-h-11 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100" onClick={() => { void history.refetch(); }}>Refresh history</button></div>
          {history.isPending && <p role="status" className="text-sm text-gray-500">Loading review history...</p>}
          {history.error && <p role="alert" className="text-sm text-red-700">Could not load review history. <button type="button" className="underline" onClick={() => { void history.refetch(); }}>Try again</button></p>}
          {history.data && <ReviewHistory decisions={decisions.filter(item => item.status === status)} showCourse emptyMessage={`No ${status} changes yet.`} />}
        </Tabs.Content>)}
      </Tabs.Root>}
    </>}
  </section>;
}

