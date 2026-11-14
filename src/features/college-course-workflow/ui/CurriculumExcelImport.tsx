import { useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { courseWorkflow } from '../api/courseWorkflow';
import { downloadCurriculumTemplate, readCurriculumWorkbook } from '../lib/curriculumWorkbook';
import type { ImportContext, ImportCourse } from '../model/types';

export function CurriculumExcelImport({ context,onImported,embedded = false }: { context: ImportContext; onImported: () => void; embedded?: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview,setPreview] = useState<{ courses: ImportCourse[]; context: ImportContext } | null>(null);
  const [error,setError] = useState('');
  const [reading,setReading] = useState(false);
  const [success,setSuccess] = useState('');
  const [fileName,setFileName] = useState('');
  const ready = Boolean(context.departmentId && context.programId && context.semester && context.academicYear);
  const mutation = useMutation({
    mutationFn: (value: { courses: ImportCourse[]; context: ImportContext }) => courseWorkflow.import(value.context,value.courses),
    onSuccess: result => { setSuccess(`Created ${result.length} draft curricula. Assign faculty in Course Mapping.`); setPreview(null); onImported(); },
  });
  const contextChanged = preview && JSON.stringify(preview.context)!==JSON.stringify(context);
  return <section aria-label="Excel curriculum import" className={embedded ? 'space-y-4' : 'rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-3'}>
    {!embedded && <h2 className="text-lg font-semibold">Import curriculum from Excel</h2>}
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <DocumentTextIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div>
          <p className="!text-sm font-semibold text-gray-900">1. Fill in the template</p>
          <p className="mt-1 !text-sm text-gray-500">Add your courses, units and learning outcomes.</p>
        </div>
      </div>
      <button type="button" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600" onClick={() => { void downloadCurriculumTemplate().catch(() => setError('Could not download template. Please retry.')); }}><ArrowDownTrayIcon aria-hidden="true" className="h-4 w-4" />Download Excel template</button>
    </div>
    <div>
      <p className="mb-3 !text-sm font-semibold text-gray-900">2. Upload and review</p>
      <button type="button" aria-label="Upload Excel" className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={!ready || reading || mutation.isPending} onClick={() => fileInput.current?.click()}>
        <ArrowUpTrayIcon aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        <span className="text-sm font-semibold text-indigo-600">{reading ? 'Reading workbook...' : fileName ? 'Choose a different file' : 'Choose Excel file'}</span>
        <span className="text-xs text-gray-500">.xlsx only &middot; Up to 5 MB &middot; Maximum 100 courses</span>
      </button>
      {fileName && <p className="mt-3 flex items-center gap-2 !text-sm text-gray-600"><DocumentTextIcon aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="min-w-0 break-all">{fileName}</span></p>}
      <input ref={fileInput} type="file" accept=".xlsx" aria-label="Upload curriculum workbook" className="hidden" onChange={async event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
        if (!file) return;
        setError('');setSuccess('');setFileName('');setPreview(null);mutation.reset();setReading(true);
        const selectedContext = { ...context };
        try { setPreview({ courses: await readCurriculumWorkbook(file),context: selectedContext }); setFileName(file.name); }
        catch (err) { setError(err instanceof Error ? err.message : 'Could not read workbook.'); }
        finally { setReading(false); }
      }} />
    </div>
    {!ready && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Select department, program, semester and academic year in the Curriculum Builder before uploading.</p>}
    {(error || mutation.error) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error || mutation.error?.message}</p>}
    {success && <p role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800"><CheckCircleIcon aria-hidden="true" className="h-5 w-5 shrink-0" />{success}</p>}
    {preview && <div className="space-y-3">
      <h3 className="!text-sm !font-semibold text-gray-900">Import preview · {preview.context.academicYear} · Semester {preview.context.semester}</h3>
      <div className="max-h-64 overflow-auto rounded-lg border border-gray-200"><table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-600"><tr><th scope="col" className="px-4 py-3 text-left">Course</th><th scope="col" className="px-4 py-3 text-center">Units</th><th scope="col">Outcomes</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{preview.courses.map(course => <tr key={course.code}><td className="px-4 py-3 text-gray-900">{course.code} · {course.title}</td><td className="px-4 py-3 text-center text-gray-600">{course.units.length}</td><td className="text-center">{course.units.reduce((n,u) => n+u.outcomes.length,0)}</td></tr>)}</tbody></table></div>
      <p className="text-xs leading-5 text-gray-500">All rows are saved together. If a curriculum already exists, the import is cancelled and existing content is preserved.</p>
      {contextChanged && <p role="alert">Selection changed. Upload the workbook again for the new selection.</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4"><button type="button" className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={mutation.isPending || Boolean(contextChanged)} onClick={() => mutation.mutate(preview)}>{mutation.isPending ? 'Importing…' : 'Create draft curricula'}</button>
      <button type="button" className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={mutation.isPending} onClick={() => setPreview(null)}>Cancel import</button></div>
    </div>}
  </section>;
}
