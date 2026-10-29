import { useRef, useState } from 'react';
import { ClipboardList, Download, Loader2 } from 'lucide-react';
import { useUser } from '@/shared/model';
import { useAssignedWorksheets, useOpenWorksheet } from '../model/worksheetQueries';

export default function LearnerWorksheets({ courseId }: { courseId: string }) {
  const user = useUser();
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const downloadInProgress = useRef(false);
  const [page, setPage] = useState(0);
  const assignments = useAssignedWorksheets(user?.id || '', courseId, page);
  const opening = useOpenWorksheet(user?.id || '', courseId);
  const deliveries = assignments.data || [];
  const loading = assignments.isFetching;
  const displayError = error || assignments.error?.message || '';
  async function download(id: string) {
    if (downloadInProgress.current) return;
    downloadInProgress.current = true;
    setDownloading(id); setError('');
    try {
      const worksheet = await opening.mutateAsync(id);
      const { exportToPDF } = await import('../model/exportToPDF');
      await exportToPDF({
        content: `${worksheet.instructions ? `${worksheet.instructions}\n\n` : ''}${worksheet.student_content}`,
        courseTitle: worksheet.title,
        lessonTitle: worksheet.difficulty === 'mixed' ? 'Multiple difficulty levels' : `${worksheet.difficulty} worksheet`,
        filename: `${worksheet.title}_${worksheet.difficulty === 'mixed' ? 'all-levels' : worksheet.difficulty}`.replace(/[^a-z0-9_-]/gi, '_').slice(0, 120),
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to download worksheet. Please retry.'); }
    finally { downloadInProgress.current = false; setDownloading(null); }
  }
  return <section className="bg-white p-3.5" aria-label="Assigned AI worksheets">
    <div className="flex items-center justify-between"><h2 className="text-xs font-semibold text-slate-900">Assigned worksheets</h2><button type="button" disabled={loading} onClick={() => { setError(''); void assignments.refetch(); }} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">Refresh</button></div>
    {displayError && <p role="alert" className="mt-2 text-xs text-red-700">{displayError}</p>}
    {loading ? <p role="status" className="mt-2 text-xs text-slate-500">Loading worksheets…</p> : deliveries.length === 0 ? <div className="py-12 text-center"><ClipboardList className="mx-auto mb-2.5 h-10 w-10 text-slate-300" /><p className="text-xs font-semibold text-slate-700">No assignments yet</p><p className="mt-0.5 text-[11px] text-slate-400">Worksheets assigned by your educator will appear here.</p></div> : <div className="mt-3 flex flex-col gap-2">{deliveries.map(row => <div key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-900" title={row.worksheet.title}>{row.worksheet.title}</span><span className="mt-1 block truncate text-[10px] capitalize text-slate-400">{row.worksheet.difficulty === 'mixed' ? 'Multiple difficulty levels' : row.worksheet.difficulty}{row.worksheet.due_at ? ` · Due ${new Date(row.worksheet.due_at).toLocaleString()}` : ''}</span></div>
      <button type="button" aria-label={`Download ${row.worksheet.title} as PDF`} disabled={!!downloading} onClick={() => download(row.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
        {downloading === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{downloading === row.id ? 'Downloading…' : 'Download PDF'}
      </button>
    </div>)}</div>}
    {!loading && (page > 0 || deliveries.length === 25) && <div className="mt-3 flex items-center justify-between text-xs text-slate-600"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous worksheets</button><span>Page {page + 1}</span><button disabled={deliveries.length < 25} onClick={() => setPage(page + 1)}>Next worksheets</button></div>}
  </section>;
}
