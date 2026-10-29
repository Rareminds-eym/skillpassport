import { useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useUser } from '@/shared/model';
import { useWorksheetContext, useWorksheetSource, usePublishWorksheet, useWorksheetStatus } from '../model/worksheetQueries';

interface Props { conversationId: string; messageId: string; courseTitle: string; initiallyOpen?: boolean }


/** Inline confirmation: the server resolves the complete mapped audience at publication time. */
export default function AssignWorksheetButton({ conversationId, messageId, courseTitle, initiallyOpen = false }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const [dismissed, setDismissed] = useState(false);
  const user = useUser();
  const userId = user?.id || '';
  const statusQuery = useWorksheetStatus(userId, conversationId, messageId);
  const contextQuery = useWorksheetContext(userId, open);
  const sourceQuery = useWorksheetSource(userId, conversationId, messageId, open);
  const publication = usePublishWorksheet(userId);
  const context = contextQuery.data;
  const source = sourceQuery.data;
  const loading = contextQuery.isFetching || sourceQuery.isFetching;
  const busy = publication.isPending;
  const published = publication.isSuccess || statusQuery.data?.published === true;
  const assignedCount = publication.data?.learnerCount ?? statusQuery.data?.learnerCount ?? 0;
  const queryError = sourceQuery.error || contextQuery.error;
  const error = publication.error?.message || queryError?.message || '';
  const reduceMotion = useReducedMotion();
  const [reviewed, setReviewed] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const groupId = useRef(crypto.randomUUID());
  const publishing = useRef(false);
  const ready = !!userId && statusQuery.isSuccess && !published && !loading && !queryError && !!source?.variants.length && source.assignmentReady !== false && !!context?.learnerCount;
  async function assign() {
    if (!ready || !reviewed || publishing.current) return;
    publishing.current = true;
    try {
      await publication.mutateAsync({
        conversationId, messageId, groupId: groupId.current, title: `${courseTitle} worksheet`.slice(0, 200),
        instructions, dueAt: dueDate ? new Date(dueDate).toISOString() : null, reviewed: true,
      });
      setOpen(false);
    } catch { /* Mutation state displays the server error. */ }
    finally { publishing.current = false; }
  }
  if (busy || published) return <div role="status" aria-live="polite" aria-atomic="true" className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left ${published ? 'border-emerald-100 bg-emerald-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
    <motion.span key={published ? 'assigned' : 'assigning'} initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${published ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'}`} aria-hidden="true">
      {published ? <Check className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
    </motion.span>
    <div className="min-w-0"><p className="!m-0 !text-xs !font-medium !leading-5 text-slate-800">{published ? `Assigned to ${assignedCount} ${assignedCount === 1 ? 'learner' : 'learners'}` : 'Assigning worksheet...'}</p><p className="!m-0 !text-[11px] !leading-4 text-slate-500">{published ? 'All included levels are available in course assignments.' : 'Sending all included levels to your mapped learners.'}</p></div>
  </div>;
  if (statusQuery.isPending) return <p role="status" className="mt-2 text-xs text-slate-500">Checking assignment status...</p>;
  if (statusQuery.isError) return <p role="alert" className="mt-2 text-xs text-red-700">Unable to verify assignment status. <button type="button" onClick={() => { void statusQuery.refetch(); }} className="underline">Retry status</button></p>;
  return <div className="min-w-0">
    {!open && !dismissed ? <div className="mt-2 border-t border-slate-100 pt-3 text-left">
      <p className="!m-0 !text-xs !leading-5 text-slate-700">Would you like to assign these questions to your learners?</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => { setReviewed(false); publication.reset(); setOpen(true); }} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Yes, assign</button>
        <button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">Not now</button>
      </div>
    </div> : !open && <button type="button" aria-expanded={false} onClick={() => setOpen(true)} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">Assign</button>}
    {open && <section aria-label="Assign generated worksheet" className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-left text-xs text-slate-700">
      <div className="flex items-center justify-between gap-2"><h3 className="!m-0 !text-sm !font-semibold">Assign to my learners</h3><button type="button" disabled={busy} aria-label="Close assignment" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-blue-100"><X className="h-3.5 w-3.5" /></button></div>
      {loading ? <p role="status" className="mt-2 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking worksheet and mapped learners...</p> : <>
        {context && <p className="mt-2 !text-xs !leading-5">{context.organization.name}<br />{context.learnerCount} active learners in your mapped programs/classes.</p>}
        {source && <p className="mt-2 !text-xs !leading-5">One assignment includes {source.variants.map(v => v.difficulty).join(', ')}. Every learner receives all included levels in one PDF. Answer keys stay private.</p>}
        {source?.assignmentReady === false && <p role="alert" className="mt-2 text-amber-800">{source.readinessMessage || 'Regenerate this worksheet before assigning.'}</p>}
        {context?.learnerCount === 0 && <p role="alert" className="mt-2 text-amber-800">No active learners are mapped to you.</p>}
        <p className="mt-2 !text-xs !leading-5">Not assigned yet. Confirm the settings here; details mentioned in chat are not saved automatically.</p>
        <label className="mt-3 block !text-xs">Due date and time (optional, your local time)
          <input type="datetime-local" value={dueDate} onChange={event => setDueDate(event.target.value)} disabled={busy} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs" />
        </label>
        <label className="mt-3 block !text-xs">Instructions (optional)
          <textarea value={instructions} maxLength={10000} onChange={event => setInstructions(event.target.value)} disabled={busy} rows={2} className="mt-1 block w-full resize-none rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs" />
        </label>
        <label className="mt-3 flex items-start gap-2 !text-xs !leading-5"><input type="checkbox" className="mt-1 accent-blue-600" disabled={!ready || busy} checked={reviewed} onChange={e => setReviewed(e.target.checked)} />This is ready. Assign all generated levels to my mapped learners.</label>
        <button type="button" disabled={!ready || !reviewed || busy} onClick={assign} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-200 disabled:text-slate-400">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{busy ? 'Assigning...' : 'Assign worksheet'}</button>
      </>}
      {error && <p role="alert" className="mt-2 text-red-700">{error}<button type="button" disabled={busy} className="ml-2 underline" onClick={() => { publication.reset(); setReviewed(false); void contextQuery.refetch(); void sourceQuery.refetch(); }}>Retry</button></p>}
    </section>}
  </div>;
}
