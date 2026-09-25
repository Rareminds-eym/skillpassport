/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { XMarkIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { curriculumService } from '@/features/college-admin';
import { formatProgramLabel } from '@/shared/lib';

const logger = getLogger('attendance-bulk-import');

interface RowError { row: number; field?: string; message: string; }
interface ImportSummary { total: number; present: number; absent: number; late: number; excused: number; rosterSize: number; }
interface ImportSession {
  id: string;
  subject_name: string;
  department_name: string;
  program_name: string;
  program_id?: string | null;
  semester: number;
  section: string;
  faculty_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_learners?: number;
  programs?: { id: string; name: string; code?: string; specializations?: unknown } | null;
}

type Step = 'session' | 'file' | 'preview' | 'done';

const HEADER_ALIASES: Record<string, string> = {
  roll_number: 'roll_number', roll: 'roll_number', roll_no: 'roll_number', rollno: 'roll_number',
  email: 'email',
  status: 'status',
  time_in: 'time_in', timein: 'time_in', time: 'time_in',
  remarks: 'remarks', remark: 'remarks',
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
      if (parsed.errors.length > 0) {
        return { rows: [], error: `CSV parse error (row ${parsed.errors[0].row}): ${parsed.errors[0].message}` };
      }
      const rows = (parsed.data || []).map((r) => {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(r || {})) out[normalizeHeader(k)] = typeof v === 'string' ? v : v;
        return out;
      });
      return { rows };
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) return { rows: [], error: 'Excel file has no readable sheets' };
      const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
      if (matrix.length < 1) return { rows: [], error: 'The file has no data rows' };
      const headers = (matrix[0] as any[]).map(normalizeHeader);
      const rows = matrix.slice(1).map((cells) => {
        const out: Record<string, any> = {};
        headers.forEach((h, i) => { out[h] = cells[i] ?? ''; });
        return out;
      });
      return { rows };
    }
    return { rows: [], error: 'Unsupported file — upload .csv, .xlsx or .xls' };
  } catch (err: any) {
    return { rows: [], error: err?.message || 'Could not read file' };
  }
}

function sessionProgramLabel(s: ImportSession): string {
  if (s.programs) return formatProgramLabel(s.programs.name, s.programs);
  return s.program_name;
}

const AttendanceBulkImportModal = ({
  isOpen,
  onClose,
  onSuccess,
  collegeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collegeId: string | null;
}) => {
  const [step, setStep] = useState<Step>('session');
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filters, setFilters] = useState({ department: '', program: '', subject: '', date: '' });
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState('');
  const [templateInfo, setTemplateInfo] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedSession = sessions.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    if (!isOpen) return;
    setStep('session'); setFatal(''); setTemplateInfo(''); setFileName('');
    setParsedRows([]); setErrors([]); setSummary(null); setSessionInfo(null);
    setResult(null);
    setFilters({ department: '', program: '', subject: '', date: '' });
    setSelectedId(''); setSessions([]);
    curriculumService.getDepartments()
      .then((r) => setDepartments(r || []))
      .catch((err: any) => {
        logger.error('Failed to load departments:', err as Error);
        setFatal('Failed to load departments — close and retry');
      });
  }, [isOpen]);

  // Hierarchical: department → programs (auto-pick when exactly one).
  useEffect(() => {
    if (!filters.department) { setPrograms([]); return; }
    curriculumService.getPrograms(filters.department)
      .then((r) => {
        const list = r || [];
        setPrograms(list);
        if (list.length === 1) setFilters((f) => ({ ...f, program: list[0].id }));
      })
      .catch(() => setPrograms([]));
  }, [filters.department]);

  // Session list refreshes on every filter change.
  useEffect(() => {
    if (!isOpen || !collegeId) return;
    setSessionsLoading(true);
    apiPost<any>('/college-admin/attendance', {
      action: 'get-import-sessions',
      college_id: collegeId,
      department_name: filters.department
        ? departments.find((d: any) => d.id === filters.department)?.name || undefined
        : undefined,
      program_id: filters.program || undefined,
      subject_query: filters.subject.trim() || undefined,
      date: filters.date || undefined,
    })
      .then((res) => {
        const list: ImportSession[] = res?.data?.sessions || [];
        setSessions(list);
        // Auto-select when the filters narrow to exactly one session.
        setSelectedId((prev) => (list.length === 1 ? list[0].id : list.some((s) => s.id === prev) ? prev : ''));
      })
      .catch((err: any) => {
        logger.error('Failed to load sessions:', err as Error);
        setSessions([]);
      })
      .finally(() => setSessionsLoading(false));
  }, [isOpen, collegeId, filters, departments]);

  const handleDownloadTemplate = async () => {
    if (!selectedSession) return;
    setBusy(true); setFatal(''); setTemplateInfo('');
    try {
      const res: any = await apiPost('/college-admin/attendance', {
        action: 'download-attendance-template',
        college_id: collegeId,
        session_id: selectedSession.id,
      });
      const blob = new Blob([res.data.csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(a.href);
      setTemplateInfo(`Template downloaded — ${res.data.rosterSize} student(s). Fill the status column and upload below.`);
      setStep('file');
    } catch (err: any) {
      setFatal(err?.message || 'Failed to download template');
    } finally {
      setBusy(false);
    }
  };

  const runValidate = async (rows: Record<string, any>[]) => {
    if (!selectedSession) return;
    setBusy(true); setFatal('');
    try {
      const res: any = await apiPost('/college-admin/attendance', {
        action: 'validate-attendance-import',
        college_id: collegeId,
        session_id: selectedSession.id,
        rows,
      });
      if (res.data?.valid) {
        setErrors([]); setSummary(res.data.summary); setSessionInfo(res.data.session);
        setStep('preview');
      } else {
        setErrors(res.data?.errors || []);
        setSummary(res.data?.summary || null);
        setStep('preview');
      }
    } catch (err: any) {
      setFatal(err?.message || 'Validation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name); setFatal('');
    const { rows, error } = await parseFile(file);
    if (error) { setFatal(error); return; }
    setParsedRows(rows);
    await runValidate(rows);
  };

  const handleImport = async () => {
    if (!selectedSession) return;
    setBusy(true); setFatal('');
    try {
      const res: any = await apiPost('/college-admin/attendance', {
        action: 'import-attendance',
        college_id: collegeId,
        session_id: selectedSession.id,
        rows: parsedRows,
      });
      setResult(res.data);
      setStep('done');
      onSuccess();
    } catch (err: any) {
      setFatal(err?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const downloadErrorReport = () => {
    const lines = ['row,field,message', ...errors.map((e) => `${e.row},"${e.field || ''}","${e.message.replace(/"/g, '""')}"`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'attendance-import-errors.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Import Attendance</h2>
              <p className="text-sm text-gray-600 mt-0.5">Step {step === 'session' ? '1' : step === 'file' ? '2' : step === 'preview' ? '3' : '4'}: {
                step === 'session' ? 'Pick a session' : step === 'file' ? 'Template & upload' : step === 'preview' ? 'Validate & confirm' : 'Done'
              }</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {fatal && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{fatal}</div>
            )}

            {step === 'session' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value, program: '' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">All Departments</option>
                      {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })} disabled={!filters.department} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100">
                      <option value="">All Programs</option>
                      {programs.map((p: any) => <option key={p.id} value={p.id}>{formatProgramLabel(p.name, p)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject contains</label>
                    <input value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} placeholder="e.g., Data Structures" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={filters.date} max={new Date().toISOString().split('T')[0]} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {sessionsLoading ? (
                  <p className="text-sm text-gray-500">Loading sessions…</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    No sessions found — create one via New Session first, then import into it.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto">
                    {sessions.map((s) => (
                      <li key={s.id}>
                        <label className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${selectedId === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="import-session" checked={selectedId === s.id} onChange={() => setSelectedId(s.id)} className="mt-1" />
                          <span className="flex-1">
                            <span className="block text-sm font-semibold text-gray-900">{s.subject_name}</span>
                            <span className="block text-xs text-gray-600 mt-0.5">
                              {sessionProgramLabel(s)} · {s.department_name} · Sem {s.semester} · Sec {s.section}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {s.faculty_name} · {s.date} · {s.start_time}{s.end_time ? `–${s.end_time}` : ''}
                            </span>
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {s.status}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 'file' && selectedSession && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  Session: <strong>{selectedSession.subject_name}</strong> · {sessionProgramLabel(selectedSession)} · {selectedSession.date} ({selectedSession.status})
                </p>
                <button onClick={handleDownloadTemplate} disabled={busy} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium">
                  <ArrowDownTrayIcon className="h-4 w-4" /> Download students template (CSV)
                </button>
                {templateInfo && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{templateInfo}</p>}
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1.5">How to fill the template</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Pre-filled, do not change:</strong> roll_number, name, email.</li>
                    <li><strong>Fill for every row — status:</strong> <code className="bg-white px-1 rounded border">present</code>, <code className="bg-white px-1 rounded border">absent</code>, <code className="bg-white px-1 rounded border">late</code> or <code className="bg-white px-1 rounded border">excused</code>.</li>
                    <li><strong>late</strong> needs <code className="bg-white px-1 rounded border">time_in</code> as HH:MM (e.g. 09:15).</li>
                    <li><strong>excused</strong> needs a <code className="bg-white px-1 rounded border">remarks</code> reason (e.g. Medical leave).</li>
                    <li>Every student in the class must appear in the file — a missing row blocks the import and names the roll number.</li>
                    <li>One session = one import. Attendance already marked for a session cannot be re-uploaded.</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload filled file (.csv / .xlsx / .xls) *</label>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
                    <ArrowUpTrayIcon className="h-4 w-4" /> {fileName || 'Choose file'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">Columns: roll_number, status (present/absent/late/excused), optional email, time_in (HH:MM, required for late), remarks (required for excused).</p>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                {sessionInfo && (
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    Session: <strong>{sessionInfo.subject}</strong> on {sessionInfo.date} ({sessionInfo.status})
                  </p>
                )}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    {[['Students', summary.rosterSize], ['Present', summary.present], ['Absent', summary.absent], ['Late', summary.late], ['Excused', summary.excused]].map(([k, v]) => (
                      <div key={k} className="border border-gray-200 rounded-lg p-2">
                        <p className="text-xs text-gray-500">{k}</p>
                        <p className="text-lg font-bold text-gray-900">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
                {errors.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-red-700">{errors.length} error(s) — fix the file and re-upload. Nothing was written.</p>
                      <button onClick={downloadErrorReport} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Download error report</button>
                    </div>
                    <ul className="max-h-56 overflow-y-auto text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                      {errors.map((e, i) => <li key={i}>{e.message}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">All rows valid — ready to import.</p>
                )}
              </div>
            )}

            {step === 'done' && result && (
              <div className="text-center space-y-3">
                <p className="text-lg font-semibold text-green-700">Imported {result.imported} record(s)</p>
                <p className="text-sm text-gray-600">
                  {result.present} present · {result.absent} absent · {result.late} late · {result.excused} excused · {result.attendance_percentage}% attendance
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            {step === 'session' && (
              <button onClick={() => { if (selectedSession) setStep('file'); }} disabled={!selectedSession} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                Continue
              </button>
            )}
            {step === 'file' && (
              <button onClick={() => setStep('session')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Back</button>
            )}
            {step === 'preview' && (
              <>
                <button onClick={() => { setStep('file'); setErrors([]); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Back to file</button>
                <button onClick={handleImport} disabled={errors.length > 0 || busy} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {busy ? 'Importing…' : `Import ${summary?.total || 0} record(s)`}
                </button>
              </>
            )}
            {step === 'done' && (
              <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Close</button>
            )}
            {step !== 'done' && step !== 'preview' && (
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceBulkImportModal;
