import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, FileText, Loader2, Search, ShieldCheck, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { worksheetAction, type WorksheetVariant, type WorksheetLearner } from '../api/worksheetService';

interface Props { conversationId: string; messageId: string; courseTitle: string }
interface WorksheetSource {
  variants: WorksheetVariant[];
  organization: { id: string; name: string };
  assignmentReady?: boolean;
  readinessMessage?: string;
}

export default function AssignWorksheetButton({ conversationId, messageId, courseTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [variants, setVariants] = useState<WorksheetVariant[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [level, setLevel] = useState('');
  const [learners, setLearners] = useState<WorksheetLearner[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [learnerLoading, setLearnerLoading] = useState(false);
  const [assignmentReady, setAssignmentReady] = useState(false);
  const [readinessMessage, setReadinessMessage] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [learnerError, setLearnerError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [title, setTitle] = useState(`${courseTitle} worksheet`);
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [published, setPublished] = useState(false);
  const groupId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!open) return;
    let active = true;
    setSourceLoading(true); setSourceError(''); setPublishError('');
    setVariants([]); setOrganizationName(''); setLevel(''); setAssignmentReady(false); setReadinessMessage('');
    setSelected({}); setReviewed(false); setPage(0); setSearch('');
    worksheetAction<WorksheetSource>('source', { conversationId, messageId })
      .then(data => {
        if (!active) return;
        setVariants(data.variants); setLevel(data.variants[0]?.difficulty || '');
        setOrganizationName(data.organization.name); setAssignmentReady(data.assignmentReady !== false);
        setReadinessMessage(data.readinessMessage || '');
      })
      .catch(err => { if (active) setSourceError(err.message); })
      .finally(() => { if (active) setSourceLoading(false); });
    return () => { active = false; };
  }, [open, conversationId, messageId, retry]);

  // Learner scope is authenticated server-side and does not depend on worksheet readiness.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLearners([]); setLearnerLoading(true); setLearnerError('');
    const timer = setTimeout(() => {
      worksheetAction<WorksheetLearner[]>('learners', { page, search })
        .then(data => { if (active) setLearners(data); })
        .catch(err => { if (active) setLearnerError(err.message); })
        .finally(() => { if (active) setLearnerLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [open, search, page, retry]);

  const assigned = variants.filter(v => selected[v.difficulty]?.length);
  const totalSelected = assigned.reduce((sum, v) => sum + selected[v.difficulty].length, 0);
  const valid = assignmentReady && assigned.length > 0 && reviewed && !!title.trim();
  async function publish() {
    if (!valid || busy || sourceLoading || learnerLoading) return;
    setBusy(true); setPublishError('');
    try {
      await worksheetAction('publish', {
        conversationId, messageId, groupId: groupId.current, title, instructions,
        dueAt: due ? new Date(due).toISOString() : null, reviewed,
        variants: assigned.map(v => ({ difficulty: v.difficulty, learnerIds: selected[v.difficulty] })),
      });
      setPublished(true); setOpen(false);
      toast.success('Worksheets assigned. Learners can open them from Course Tutor assignments.');
    } catch (err) { setPublishError(err instanceof Error ? err.message : 'Publication failed.'); }
    finally { setBusy(false); }
  }
  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 !text-sm !leading-5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

  return <Dialog.Root open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
    <Dialog.Trigger asChild><button type="button" disabled={published} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:text-slate-400">{published ? 'Assigned' : 'Assign'}</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] flex max-h-[90dvh] w-[calc(100vw_-_2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans text-slate-800 shadow-2xl focus:outline-none">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></span>
              <div><Dialog.Title className="!m-0 !text-lg !font-semibold !leading-7 !tracking-normal !text-slate-900">Assign worksheet</Dialog.Title><Dialog.Description className="!mb-0 !mt-0.5 !text-xs !leading-5 !text-slate-500">Choose a difficulty, then select learners from your mapped programs.</Dialog.Description></div>
            </div>
            <Dialog.Close disabled={busy} aria-label="Close worksheet assignment" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-4 w-4" /></Dialog.Close>
          </div>
          {organizationName && <div className="mt-3 flex items-center gap-1.5 !text-xs text-slate-500"><Building2 className="h-3.5 w-3.5" />{organizationName}</div>}
        </header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {readinessMessage && <div role="status" className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 !text-xs !leading-5 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{readinessMessage}</span></div>}
          {sourceError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 !text-xs text-red-700">{sourceError}<button type="button" onClick={() => setRetry(retry + 1)} className="ml-2 font-semibold underline">Retry worksheet</button></div>}
          <label className="block !text-xs font-medium text-slate-600">Assignment title<input disabled={busy} className={inputClass} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <div className="flex flex-wrap gap-2" aria-label="Worksheet difficulties">
            {sourceLoading && <span role="status" className="flex items-center gap-2 !text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading worksheet…</span>}
            {variants.map(v => <button type="button" key={v.difficulty} disabled={busy} onClick={() => setLevel(v.difficulty)} aria-pressed={level === v.difficulty} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 !text-xs font-medium capitalize transition focus-visible:ring-2 focus-visible:ring-blue-500 ${level === v.difficulty ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{v.difficulty}<span className={`rounded-md px-1.5 py-0.5 !text-[10px] ${level === v.difficulty ? 'bg-blue-100' : 'bg-slate-100'}`}>{selected[v.difficulty]?.length || 0}</span></button>)}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3"><h3 className="!m-0 !text-xs !font-semibold !leading-5 text-slate-700">Worksheet preview</h3><span className="!text-[10px] capitalize text-slate-400">{level || 'Preview'}</span></div>
              <div className="max-h-72 min-h-48 overflow-y-auto p-4">{level ? <pre className="!m-0 whitespace-pre-wrap break-words !border-0 !bg-transparent !p-0 font-sans !text-xs !leading-6 text-slate-600">{variants.find(v => v.difficulty === level)?.content}</pre> : <p className="!m-0 !text-xs !leading-6 text-slate-400">{sourceLoading ? 'Preparing your preview…' : 'The worksheet preview is unavailable. Your mapped learners are still listed alongside.'}</p>}</div>
              <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2.5 !text-[10px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" />{assignmentReady ? 'Private answers are excluded from learner copies' : 'Original educator preview · regenerate before publishing'}</div>
            </section>
            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200" aria-label="Mapped learners">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3"><h3 className="!m-0 flex items-center gap-1.5 !text-xs !font-semibold !leading-5 text-slate-700"><Users className="h-3.5 w-3.5" />Mapped learners</h3><span className="!text-[10px] text-slate-400">{selected[level]?.length || 0} selected</span></div>
              <div className="relative px-3 py-2.5"><Search className="pointer-events-none absolute left-5 top-5 h-3.5 w-3.5 text-slate-400" /><input aria-label="Search mapped learners" disabled={busy} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 !text-xs !leading-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Search by name…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
              <div className="max-h-56 min-h-40 overflow-y-auto px-2 pb-2" aria-busy={learnerLoading}>
                {learnerLoading ? <p role="status" className="!m-0 flex items-center justify-center gap-2 py-10 !text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading mapped learners…</p> : learnerError ? <div role="alert" className="p-3 !text-xs text-red-700">{learnerError}<button onClick={() => setRetry(retry + 1)} className="ml-2 font-medium underline">Retry learners</button></div> : learners.length === 0 ? <p className="!m-0 px-3 py-10 text-center !text-xs !leading-5 text-slate-400">{search ? 'No learners match your search.' : 'No active learners are mapped to your programs. Ask your administrator to check the teaching mappings.'}</p> : learners.map(l => {
                  const other = Object.entries(selected).find(([key, ids]) => key !== level && ids.includes(l.id));
                  const checked = selected[level]?.includes(l.id) || false;
                  return <label key={l.id} className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'} ${!level ? 'opacity-50' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-blue-600" disabled={busy || !level} checked={checked} onChange={e => {
                      const add = e.target.checked;
                      setSelected(previous => {
                        const next = Object.fromEntries(Object.entries(previous).map(([difficulty, ids]) => [difficulty, ids.filter(id => id !== l.id)]));
                        if (add) next[level] = [...(next[level] || []), l.id];
                        return next;
                      });
                      setReviewed(false);
                    }} />
                    <span className="min-w-0"><span className="block truncate !text-xs font-medium text-slate-700">{l.name || 'Unnamed learner'}</span><span className="block !text-[10px] !leading-4 text-slate-400">{other ? `Selected for ${other[0]} · click to move here` : `ID ${l.id.slice(0, 8)}`}</span></span>
                  </label>;
                })}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 !text-[10px] text-slate-400"><button type="button" aria-label="Previous learner page" disabled={page === 0 || learnerLoading || busy} onClick={() => setPage(page - 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button><span>Page {page + 1}</span><button type="button" aria-label="Next learner page" disabled={learners.length < 50 || learnerLoading || busy} onClick={() => setPage(page + 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button></div>
            </section>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block !text-xs font-medium text-slate-600">Instructions <span className="font-normal text-slate-400">(optional)</span><textarea disabled={busy} rows={2} className={`${inputClass} resize-none`} maxLength={10000} placeholder="Add a note for your learners…" value={instructions} onChange={e => setInstructions(e.target.value)} /></label>
            <label className="block !text-xs font-medium text-slate-600">Due date <span className="font-normal text-slate-400">(optional)</span><input disabled={busy} type="datetime-local" className={inputClass} value={due} onChange={e => setDue(e.target.value)} /></label>
          </div>
          <label className="flex items-start gap-2.5 !text-xs !leading-5 text-slate-500"><input type="checkbox" className="mt-1 h-3.5 w-3.5 shrink-0 accent-blue-600" disabled={busy || !assignmentReady} checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed the selected worksheets and learner assignments.</label>
          {publishError && <p role="alert" className="!m-0 rounded-lg bg-red-50 p-3 !text-xs text-red-700">{publishError}</p>}
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="!text-xs text-slate-500"><span className="font-semibold text-slate-800">{totalSelected} learners selected</span>{assigned.length > 0 && <span className="mt-0.5 block !text-[10px] capitalize text-slate-400">{assigned.map(v => `${v.difficulty}: ${selected[v.difficulty].length}`).join(' · ')}</span>}</div>
          <div className="flex items-center gap-2"><Dialog.Close disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 !text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</Dialog.Close><button type="button" disabled={!valid || busy || sourceLoading || learnerLoading} onClick={publish} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 !text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{busy ? 'Publishing…' : 'Publish assignments'}</button></div>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
