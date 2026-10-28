import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { worksheetAction, type WorksheetContext, type WorksheetVariant } from '../api/worksheetService';

interface Props { conversationId: string; messageId: string; courseTitle: string }
interface Source { variants: WorksheetVariant[]; assignmentReady?: boolean; readinessMessage?: string }

/** Inline confirmation: the server resolves the complete mapped audience at publication time. */
export default function AssignWorksheetButton({ conversationId, messageId, courseTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<WorksheetContext | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const groupId = useRef(crypto.randomUUID());
  const publishing = useRef(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError(''); setReviewed(false); setSource(null); setContext(null);
    Promise.all([
      worksheetAction<Source>('source', { conversationId, messageId }),
      worksheetAction<WorksheetContext>('context'),
    ]).then(([material, audience]) => {
      if (active) { setSource(material); setContext(audience); }
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, conversationId, messageId, retry]);
  const ready = !!source?.variants.length && source.assignmentReady !== false && !!context?.learnerCount;
  async function assign() {
    if (!ready || !reviewed || publishing.current) return;
    publishing.current = true; setBusy(true); setError('');
    try {
      const result = await worksheetAction<{ learnerCount: number }>('publish-all', {
        conversationId, messageId, groupId: groupId.current, title: `${courseTitle} worksheet`.slice(0, 200),
        instructions: '', dueAt: null, reviewed: true,
      });
      setAssignedCount(result.learnerCount); setPublished(true); setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Assignment failed. Please retry.'); }
    finally { publishing.current = false; setBusy(false); }
  }
  if (busy || published) return <div role="status" aria-live="polite" aria-atomic="true" className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left ${published ? 'border-emerald-100 bg-emerald-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
    <motion.span key={published ? 'assigned' : 'assigning'} initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${published ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'}`} aria-hidden="true">
      {published ? <Check className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
    </motion.span>
    <div className="min-w-0"><p className="!m-0 !text-xs !font-medium !leading-5 text-slate-800">{published ? `Assigned to ${assignedCount} ${assignedCount === 1 ? 'learner' : 'learners'}` : 'Assigning worksheet...'}</p><p className="!m-0 !text-[11px] !leading-4 text-slate-500">{published ? 'All included levels are available in course assignments.' : 'Sending all included levels to your mapped learners.'}</p></div>
  </div>;
  return <div className="min-w-0">
    <button type="button" disabled={published || busy} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:text-slate-400">{published ? 'Assigned' : 'Assign'}</button>
    {open && <section aria-label="Assign generated worksheet" className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-left text-xs text-slate-700">
      <div className="flex items-center justify-between gap-2"><h3 className="!m-0 !text-sm !font-semibold">Assign to my learners</h3><button type="button" disabled={busy} aria-label="Close assignment" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-blue-100"><X className="h-3.5 w-3.5" /></button></div>
      {loading ? <p role="status" className="mt-2 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking worksheet and mapped learners...</p> : <>
        {context && <p className="mt-2 !text-xs !leading-5">{context.organization.name}<br />{context.learnerCount} active learners in your mapped programs/classes.</p>}
        {source && <p className="mt-2 !text-xs !leading-5">One assignment includes {source.variants.map(v => v.difficulty).join(', ')}. Every learner receives all included levels in one PDF. Answer keys stay private.</p>}
        {source?.assignmentReady === false && <p role="alert" className="mt-2 text-amber-800">{source.readinessMessage || 'Regenerate this worksheet before assigning.'}</p>}
        {context?.learnerCount === 0 && <p role="alert" className="mt-2 text-amber-800">No active learners are mapped to you.</p>}
        <label className="mt-3 flex items-start gap-2 !text-xs !leading-5"><input type="checkbox" className="mt-1 accent-blue-600" disabled={!ready || busy} checked={reviewed} onChange={e => setReviewed(e.target.checked)} />This is ready. Assign all generated levels to my mapped learners.</label>
        <button type="button" disabled={!ready || !reviewed || busy} onClick={assign} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-200 disabled:text-slate-400">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{busy ? 'Assigning...' : 'Assign worksheet'}</button>
      </>}
      {error && <p role="alert" className="mt-2 text-red-700">{error}<button type="button" disabled={busy} className="ml-2 underline" onClick={() => setRetry(retry + 1)}>Retry</button></p>}
    </section>}
  </div>;
}
