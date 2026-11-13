import { useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { getCourseMappings, getCourses, mapCourse, type Faculty } from '@/features/college-admin';
import { downloadMappingTemplate, readMappingWorkbook, type MappingRow } from '../lib/workbook';

interface Props {
  programId: string;
  semester: number;
  label: string;
  locked: boolean;
  faculties: Faculty[];
  onImported: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onSuccess: (count: number) => void;
}
type PreviewRow = { value: MappingRow; status: 'ready' | 'saved' | 'failed'; error?: string; courseId?: string; facultyId?: string };
const message = (error: unknown) => error instanceof Error ? error.message : 'Unable to process the workbook. Please retry.';

export function CourseMappingExcelImport({ programId, semester, label, locked, faculties, onImported, onBusyChange, onSuccess }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [filename, setFilename] = useState('');
  const button = 'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';

  async function preview(file: File) {
    setBusy(true); onBusyChange(true); setError(''); setRows([]); setComplete(false);
    try {
      const values = await readMappingWorkbook(file);
      const [catalog, mappings] = await Promise.all([getCourses(), getCourseMappings(programId, semester)]);
      const mapped = new Set(mappings.map(mapping => mapping.course_id));
      const mappedCodes = new Set(mappings.map(mapping => (mapping.course?.course_code || mapping.course_code || '').toLowerCase()));
      setRows(values.map(value => {
        const course = catalog.find(item => item.course_code.toLowerCase() === value['Course Code'].toLowerCase());
        const email = value['Faculty Email'].toLowerCase();
        const faculty = faculties.find(item => item.email.toLowerCase() === email);
        const issue = (course && mapped.has(course.id)) || mappedCodes.has(value['Course Code'].toLowerCase())
          ? 'Already mapped to this semester'
          : email && !faculty ? 'Faculty email not found in this department' : undefined;
        return { value, courseId: course?.id, facultyId: faculty?.id, status: 'ready', error: issue };
      }));
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); onBusyChange(false); }
  }

  async function importRows() {
    setBusy(true); onBusyChange(true); setError('');
    const next = [...rows];
    try {
      for (let i = 0; i < next.length; i++) {
        const row = next[i];
        if (row.status === 'saved') continue;
        try {
          await mapCourse({ program_id: programId, semester, course_id: row.courseId,
            course_code: row.value['Course Code'], course_name: row.value['Course Name'], credits: row.value.Credits,
            offering_type: row.value['Offering Type'], faculty_id: row.facultyId, capacity: row.value.Capacity });
          next[i] = { ...row, status: 'saved', error: undefined };
        } catch (err) { next[i] = { ...row, status: 'failed', error: message(err) }; }
        setRows([...next]);
      }
      setComplete(true);
      await onImported();
      if (next.every(row => row.status === 'saved')) onSuccess(next.length);
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); onBusyChange(false); }
  }

  return <section aria-label="Import course mappings from Excel" className="space-y-5">
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Import destination</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-gray-900">{label}</p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h3 className="text-sm font-semibold text-gray-900">1. Fill in the template</h3>
        <p className="mt-1 text-sm text-gray-500">Replace the example row with your courses.</p></div>
      <button type="button" className={`${button} inline-flex shrink-0 items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600`} disabled={busy} onClick={() => { void downloadMappingTemplate().catch(err => setError(message(err))); }}>
        <ArrowDownTrayIcon className="h-4 w-4" />Download template
      </button>
    </div>
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">2. Upload your completed Excel</h3>
      <button type="button" disabled={busy || locked || !programId} onClick={() => input.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-5 py-7 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
        <span className="rounded-full bg-indigo-50 p-3 text-indigo-600"><ArrowUpTrayIcon className="h-6 w-6" /></span>
        <span className="text-sm font-semibold text-indigo-600">{filename ? 'Choose a different file' : 'Choose Excel file'}</span>
        <span className="text-xs text-gray-500">.xlsx only · Up to 5 MB · Maximum 100 courses</span>
      </button>
      <input ref={input} type="file" accept=".xlsx" aria-label="Upload completed course mapping workbook" disabled={busy || locked || !programId} className="hidden" onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (file) { setFilename(file.name); void preview(file); }
      }} />
      {filename && <p className="mt-3 flex items-center gap-2 break-all text-sm text-gray-600"><DocumentTextIcon className="h-4 w-4 shrink-0" />{filename}</p>}
    </div>
    <p className="text-xs leading-5 text-gray-500">Existing catalog courses keep their name and credits. New course codes create catalog courses. You can review all rows before importing.</p>
    {locked && <p className="text-sm text-amber-700">Unlock this semester before importing.</p>}
    {busy && <p role="status" className="text-sm text-gray-600">Processing workbook…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {rows.length > 0 && <>
      <div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm">
        <caption className="py-2 text-left font-medium">Preview: {rows.length} courses</caption>
        <thead><tr>{['Row', 'Course', 'Credits', 'Type', 'Faculty', 'Capacity', 'Result'].map(title => <th key={title} scope="col" className="border-b p-2">{title}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={row.value['Course Code']}>
          <td className="p-2">{i + 2}</td><td className="p-2">{row.value['Course Code']} — {row.value['Course Name']}</td>
          <td className="p-2">{row.value.Credits}</td><td className="p-2">{row.value['Offering Type']}</td>
          <td className="p-2">{row.value['Faculty Email'] || 'Unassigned'}</td><td className="p-2">{row.value.Capacity ?? '—'}</td>
          <td className={`p-2 ${row.error ? 'text-red-700' : 'text-green-700'}`}>{row.error || (row.status === 'saved' ? 'Imported' : row.courseId ? 'Ready · existing course' : 'Ready · new course')}</td>
        </tr>)}</tbody>
      </table></div>
      {!complete && <div className="flex justify-end border-t border-gray-200 pt-4"><button type="button" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50" disabled={busy || locked || rows.some(row => Boolean(row.error))} onClick={() => void importRows()}>{busy ? 'Importing…' : `Import ${rows.length} mappings`}</button></div>}
      {complete && <p role="status" className="text-sm text-gray-700">{rows.filter(row => row.status === 'saved').length} imported; {rows.filter(row => row.status === 'failed').length} failed. Successful rows are saved. Correct failed rows and upload only those rows again.</p>}
    </>}
  </section>;
}
