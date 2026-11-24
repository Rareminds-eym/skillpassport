import PanelLoadingSkeleton from './PanelLoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model';

interface SourceStatus { id: string; lesson_id: string; resource_id: string | null; status: string; is_current: boolean; version: number; error_message: string | null }
async function action<T>(courseId: string, value: string): Promise<T> {
  return (await apiPost<{ data: T }>('/ai-tutor/course-index', { action: value, courseId })).data;
}
export default function CourseIndexStatus({ courseId }: { courseId: string }) {
  const user = useUser();
  const key = ['course-index', user?.id, courseId];
  const query = useQuery({ queryKey: key, queryFn: () => action<SourceStatus[]>(courseId, 'status'), enabled: !!user?.id, retry: false,
    refetchInterval: state => state.state.data?.some(row => ['queued','extracting','embedding'].includes(row.status)) ? 10000 : false });
  const latest = new Map<string, SourceStatus>();
  for (const row of query.data || []) {
    const source = row.resource_id || row.lesson_id;
    if (!latest.has(source) || latest.get(source)!.version < row.version) latest.set(source, row);
  }
  const rows = [...latest.values()];
  const failed = rows.filter(row => row.status === 'failed').length;
  if (query.isPending) return <PanelLoadingSkeleton label="Loading course knowledge"/>;
  const ready = rows.filter(row => row.status === 'ready').length;
  const processing = rows.some(row => ['queued','extracting','embedding'].includes(row.status));
  return <details className="group rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 font-sans text-xs leading-5 [&_p]:text-[11px] [&_p]:leading-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded text-xs text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none">&#8250;</span>Course knowledge</span><span className="text-[10px] tabular-nums text-slate-400">{query.isPending?'Checking sources':query.isError?'Unavailable':rows.length?`${ready}/${rows.length} sources ready`:'No indexed sources'}</span></summary>
    {!query.isPending && !query.isError && <p className="mb-0 mt-2 text-slate-500">{!rows.length?'Course resources are not indexed yet. Responses may not include evidence from your materials.':processing?'Course resources are being processed. More source material will be available when indexing finishes.':ready?'Indexed course resources can be used to support responses with source references.':'No course sources are ready to support responses yet.'}</p>}
    {query.isError && <p role="alert" className="my-2 text-red-700">{query.error?.message || 'Course indexing unavailable.'}</p>}
    {failed > 0 && <p role="status" className="my-2 text-amber-700">{failed} {failed===1?'source could':'sources could'} not be indexed. Check that the files are accessible and in a supported format.</p>}

  </details>;
}
