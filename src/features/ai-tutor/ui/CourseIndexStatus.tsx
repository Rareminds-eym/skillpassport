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
  return <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
    <summary className="cursor-pointer text-slate-600">Course knowledge - {rows.filter(row => row.status === 'ready').length}/{rows.length} sources ready</summary>
    <p className="my-2 text-slate-500">Course content is indexed with the local course:index script. Rerun it after updating course resources.</p>
    {query.isError && <p role="alert" className="my-2 text-red-700">{query.error?.message || 'Course indexing unavailable.'}</p>}
    {failed > 0 && <p role="status" className="my-2 text-amber-700">{failed} sources failed. Check source format/access and rerun the local script with --force.</p>}

  </details>;
}
