/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { X, Download, Upload, CheckCircle, XCircle, FileSpreadsheet, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import * as collegeAssignmentService from '@/features/college-admin';

type Step = 'target' | 'upload' | 'preview';
const VALID_TYPES = ['homework', 'project', 'quiz', 'exam', 'lab', 'essay', 'presentation', 'other'];
const HEADER_ALIASES: Record<string, string> = {
  title: 'title', task_title: 'title', name: 'title',
  due_date: 'due_date', duedate: 'due_date', due: 'due_date',
  assignment_type: 'assignment_type', type: 'assignment_type', task_type: 'assignment_type',
  total_points: 'total_points', points: 'total_points', max_points: 'total_points', score: 'total_points',
  description: 'description', desc: 'description',
  instructions: 'instructions', instruction: 'instructions',
  skill_outcomes: 'skill_outcomes', skills: 'skill_outcomes', outcomes: 'skill_outcomes',
  allow_late_submission: 'allow_late_submission', late_submission: 'allow_late_submission', allow_late: 'allow_late_submission',
  instruction_file_url: 'instruction_file_url', instruction_file_urls: 'instruction_file_url', instruction_files: 'instruction_file_url', file_url: 'instruction_file_url', file_urls: 'instruction_file_url',
};

function normalizeHeader(h: unknown): string {
  const key = String(h ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return HEADER_ALIASES[key] || key;
}
async function parseFile(file: File): Promise<{ rows: Record<string, any>[]; error?: string }> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.csv')) {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: 'greedy' });
      if (parsed.errors.length > 0) return { rows: [], error: 'CSV parse error: ' + parsed.errors[0].message };
      const rows = (parsed.data || []).map((r) => { const out: Record<string, any> = {}; for (const [k, v] of Object.entries(r || {})) out[normalizeHeader(k)] = v; return out; });
      return { rows };
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) return { rows: [], error: 'Excel file has no readable sheets' };
      const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
      if (matrix.length < 2) return { rows: [], error: 'The file has no data rows' };
      const headers = (matrix[0] as any[]).map(normalizeHeader);
      const rows = matrix.slice(1).map((cells) => { const out: Record<string, any> = {}; headers.forEach((h, i) => { out[h] = cells[i] ?? ''; }); return out; });
      return { rows };
    }
    return { rows: [], error: 'Unsupported file - upload .csv, .xlsx or .xls' };
  } catch (err: any) { return { rows: [], error: err?.message || 'Could not read file' }; }
}

interface ValidatedRow {
  title: string; due_date: string; assignment_type: string; total_points: number;
  description: string; instructions: string; skill_outcomes: string[];
  allow_late_submission: boolean; instruction_files: Array<{ name: string; url: string; size: number; type: string }>;
  errors: string[]; valid: boolean;
}
function validateRows(rows: Record<string, any>[]): ValidatedRow[] {
  return rows.map((r, idx) => {
    const errors: string[] = [];
    const title = String(r.title || '').trim();
    const due_date = String(r.due_date || '').trim();
    const assignment_type = String(r.assignment_type || 'homework').trim().toLowerCase();
    const total_points = parseInt(String(r.total_points || '100'), 10);
    const allow_late_submission = String(r.allow_late_submission || 'true').trim().toLowerCase() !== 'false';
    if (!title) errors.push('Row ' + (idx + 2) + ': title is required');
    if (!due_date) errors.push('Row ' + (idx + 2) + ': due_date is required');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) errors.push('Row ' + (idx + 2) + ': due_date must be YYYY-MM-DD');
    if (assignment_type && !VALID_TYPES.includes(assignment_type)) errors.push('Row ' + (idx + 2) + ': invalid assignment_type');
    if (isNaN(total_points) || total_points <= 0) errors.push('Row ' + (idx + 2) + ': total_points must be positive');
    const rawSkills = String(r.skill_outcomes || '').trim();
    const skill_outcomes = rawSkills ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    
    // Parse instruction file URLs (comma-separated)
    const rawFileUrls = String(r.instruction_file_url || '').trim();
    const instruction_files = rawFileUrls ? rawFileUrls.split(',').map((url: string) => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return null;
      // Validate URL format (basic check)
      if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
        errors.push('Row ' + (idx + 2) + ': invalid URL format in instruction_file_url');
        return null;
      }
      // Extract filename from URL (last segment after /)
      const urlParts = trimmedUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'External File';
      return {
        name: decodeURIComponent(filename),
        url: trimmedUrl,
        size: 0, // Unknown for external URLs
        type: 'application/octet-stream' // Generic type for external files
      };
    }).filter(Boolean) : [];
    
    return { title, due_date, assignment_type: VALID_TYPES.includes(assignment_type) ? assignment_type : 'homework',
      total_points: isNaN(total_points) ? 100 : Math.max(1, total_points),
      description: String(r.description || '').trim(), instructions: String(r.instructions || '').trim(),
      skill_outcomes, allow_late_submission, instruction_files: instruction_files as Array<{ name: string; url: string; size: number; type: string }>,
      errors, valid: errors.length === 0 };
  });
}

function generateExcelTemplate(): void {
  const headers = ['Title', 'Due Date', 'Assignment Type', 'Total Points', 'Description', 'Instructions', 'Skill Outcomes', 'Allow Late Submission', 'Instruction File URL'];
  const exampleRows = [
    ['Introduction to React', '2025-02-15', 'homework', '100', 'Build a simple React app', 'Follow course notes', 'Programming,Problem Solving', 'true', 'https://example.com/react-guide.pdf'],
    ['Data Structures Quiz', '2025-03-01', 'quiz', '50', 'Chapter 3 quiz', '', 'Data Structures', 'false', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
  XLSX.writeFile(wb, 'task-bulk-import-template.xlsx');
}
interface Props {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
  educatorUserId: string; collegeId: string;
}

export function TaskBulkImportModal({ isOpen, onClose, onSuccess, educatorUserId, collegeId }: Props) {
  const [step, setStep] = useState<Step>('target');
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState('');
  const [fileName, setFileName] = useState('');
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [depsLoading, setDepsLoading] = useState(false);
  const [progsLoading, setProgsLoading] = useState(false);
  const [sectLoading, setSectLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('target'); setFatal(''); setFileName(''); setValidatedRows([]);
    setSelectedDept(''); setSelectedProgram(''); setSelectedSection(''); setSelectedCourse(''); setAutoAssign(true);
    setDepsLoading(true);
    collegeAssignmentService.fetchEducatorDepartments(educatorUserId)
      .then(r => setDepartments(r.data || [])).catch(() => setFatal('Failed to load departments')).finally(() => setDepsLoading(false));
  }, [isOpen, educatorUserId]);
  useEffect(() => {
    if (!selectedDept) { setPrograms([]); setSelectedProgram(''); return; }
    setProgsLoading(true);
    collegeAssignmentService.fetchEducatorPrograms(educatorUserId, selectedDept)
      .then(r => setPrograms(r.data || [])).catch(() => setPrograms([])).finally(() => setProgsLoading(false));
  }, [selectedDept, educatorUserId]);
  useEffect(() => {
    if (!selectedProgram) { setSections([]); setSelectedSection(''); return; }
    setSectLoading(true);
    collegeAssignmentService.fetchEducatorProgramSections(educatorUserId)
      .then(r => { const filtered = (r.data || []).filter((s: any) => s.program_id === selectedProgram); setSections(filtered); })
      .catch(() => setSections([])).finally(() => setSectLoading(false));
  }, [selectedProgram, educatorUserId]);
  useEffect(() => {
    if (!selectedProgram) { setCourses([]); setSelectedCourse(''); return; }
    setCoursesLoading(true);
    collegeAssignmentService.fetchEducatorCoursesByProgram(educatorUserId, selectedProgram)
      .then(r => setCourses(r.data || [])).catch(() => setCourses([])).finally(() => setCoursesLoading(false));
  }, [selectedProgram, educatorUserId]);

  const selectedSectionObj = sections.find(s => s.id === selectedSection);
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);
  const selectedProgramObj = programs.find(p => p.id === selectedProgram);
  const selectedDeptObj = departments.find(d => d.id === selectedDept);
  const canProceedToUpload = !!(selectedDept && selectedProgram && selectedSection && selectedCourse);
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name); setFatal('');
    const { rows, error } = await parseFile(file);
    if (error) { setFatal(error); return; }
    if (rows.length === 0) { setFatal('No data rows found in file'); return; }
    setValidatedRows(validateRows(rows));
    setStep('preview');
  };
  const validRows = validatedRows.filter(r => r.valid);
  const invalidRows = validatedRows.filter(r => !r.valid);
  const handleImport = async () => {
    if (validRows.length === 0 || !canProceedToUpload) return;
    setBusy(true); setFatal('');
    try {
      const payload: collegeAssignmentService.BulkCreatePayload = {
        educator_user_id: educatorUserId, department_id: selectedDept, program_id: selectedProgram,
        course_id: selectedCourse, course_name: selectedCourseObj?.course_name || '',
        course_code: selectedCourseObj?.course_code || '', section_id: selectedSection,
        section: selectedSectionObj?.section || '', semester: selectedSectionObj?.semester || 1,
        academic_year: selectedSectionObj?.academic_year || '', college_id: collegeId,
        auto_assign: autoAssign,
        tasks: validRows.map(r => ({ title: r.title, due_date: r.due_date, assignment_type: r.assignment_type,
          total_points: r.total_points, description: r.description, instructions: r.instructions,
          skill_outcomes: r.skill_outcomes, allow_late_submission: r.allow_late_submission, instruction_files: r.instruction_files })),
      };
      const result = await collegeAssignmentService.bulkCreateCollegeAssignments(payload);
      if (result.error) { setFatal(result.error); }
      else { toast.success((result.data?.count || validRows.length) + ' task(s) imported successfully!'); onSuccess(); onClose(); }
    } catch (err: any) { setFatal(err?.message || 'Import failed'); }
    finally { setBusy(false); }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Import Tasks</h2>
              <p className="text-sm text-gray-600 mt-0.5">Step {step === 'target' ? '1' : step === 'upload' ? '2' : '3'} of 3: {step === 'target' ? 'Select target class' : step === 'upload' ? 'Upload file' : 'Preview and import'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {fatal && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{fatal}</div>}
            {step === 'target' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select the class you want to bulk-import tasks into.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedProgram(''); setSelectedSection(''); setSelectedCourse(''); }} disabled={depsLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                      <option value="">{depsLoading ? 'Loading...' : 'Select Department'}</option>
                      {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                    <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setSelectedSection(''); setSelectedCourse(''); }} disabled={!selectedDept || progsLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                      <option value="">{progsLoading ? 'Loading...' : 'Select Program'}</option>
                      {programs.map((p: any) => {
                        const specs = Array.isArray(p.specializations) && p.specializations.length > 0 
                          ? ` (${p.specializations.join(', ')})` 
                          : '';
                        return <option key={p.id} value={p.id}>{p.name}{specs}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} disabled={!selectedProgram || coursesLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                      <option value="">{coursesLoading ? 'Loading...' : 'Select Course'}</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                    <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedProgram || sectLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                      <option value="">{sectLoading ? 'Loading...' : 'Select Section'}</option>
                      {sections.map((s: any) => <option key={s.id} value={s.id}>Sec {s.section} - Sem {s.semester} - {s.academic_year}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <input type="checkbox" id="auto-assign-bulk" checked={autoAssign} onChange={e => setAutoAssign(e.target.checked)} className="h-4 w-4 text-green-600 rounded border-gray-300" />
                  <label htmlFor="auto-assign-bulk" className="text-sm text-gray-700"><span className="font-medium">Auto-assign to learners</span> - automatically assign all tasks to enrolled learners in this section</label>
                </div>
              </div>
            )}
            {step === 'upload' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <strong>Target:</strong> {selectedDeptObj?.name} &rarr; {selectedProgramObj?.name} &rarr; Sec {selectedSectionObj?.section} Sem {selectedSectionObj?.semester}{selectedCourseObj && <span> &rarr; {selectedCourseObj.course_name}</span>}
                </div>
                <button onClick={generateExcelTemplate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  <Download size={16} /> Download Template (.xlsx)
                </button>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2"><FileSpreadsheet size={16} className="text-green-600" /> Template columns</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Title</strong> - required</li>
                    <li><strong>Due Date</strong> - required, format: YYYY-MM-DD</li>
                    <li><strong>Assignment Type</strong> - homework | project | quiz | exam | lab | essay | presentation | other</li>
                    <li><strong>Total Points</strong> - integer, default 100</li>
                    <li><strong>Description</strong> - optional</li>
                    <li><strong>Instructions</strong> - optional</li>
                    <li><strong>Skill Outcomes</strong> - optional, comma-separated</li>
                    <li><strong>Allow Late Submission</strong> - true or false, default true</li>
                    <li><strong>Instruction File URL</strong> - optional, single URL or comma-separated URLs (e.g., Google Drive, Dropbox links)</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload filled file (.csv / .xlsx / .xls) *</label>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={e => handleFile(e.target.files?.[0])} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    <Upload size={16} /> {fileName || 'Choose file (.csv / .xlsx / .xls)'}
                  </button>
                </div>
              </div>
            )}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700 font-medium"><CheckCircle size={16} /> {validRows.length} valid</span>
                  {invalidRows.length > 0 && <span className="flex items-center gap-1 text-red-700 font-medium"><XCircle size={16} /> {invalidRows.length} invalid (skipped)</span>}
                  <span className="text-gray-500">from {fileName}</span>
                </div>
                {invalidRows.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 mb-1">Rows with errors (will be skipped):</p>
                    <ul className="text-sm text-red-700 space-y-0.5 max-h-32 overflow-y-auto">
                      {invalidRows.flatMap(r => r.errors).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {validRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Points</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">OK</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {validRows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{r.title}</td>
                            <td className="px-3 py-2 text-gray-600">{r.due_date}</td>
                            <td className="px-3 py-2 text-gray-600 capitalize">{r.assignment_type}</td>
                            <td className="px-3 py-2 text-gray-600">{r.total_points}</td>
                            <td className="px-3 py-2"><CheckCircle size={16} className="text-green-500" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">No valid rows to import. Fix errors and re-upload.</p>}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <div className="flex items-center gap-3">
              {step !== 'target' && (
                <button onClick={() => setStep(step === 'preview' ? 'upload' : 'target')} className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              {step === 'target' && (
                <button onClick={() => setStep('upload')} disabled={!canProceedToUpload} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  Continue <ChevronRight size={16} />
                </button>
              )}
              {step === 'upload' && <span className="text-sm text-gray-500">Upload a file to continue</span>}
              {step === 'preview' && (
                <button onClick={handleImport} disabled={busy || validRows.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {busy ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Importing...</> : <><Upload size={16} /> Import {validRows.length} task(s)</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TaskBulkImportModal;
