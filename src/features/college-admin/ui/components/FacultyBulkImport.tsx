import React, { useCallback, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';
import {
  facultyBulkImportService,
  type BulkUploadError,
  type BulkUploadStatus,
} from '@/features/college-admin/api/facultyBulkImportService';

const logger = getLogger('faculty-bulk-import');

interface FacultyBulkImportProps {
  collegeId: string | null;
}

interface ParsedRow {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  department: string;
  specialization: string;
  qualification: string;
  experienceYears: string;
  role: string;
  error?: string;
}

const REQUIRED_COLUMNS = ['email', 'firstname', 'lastname', 'name'];
const MAX_ROWS = 500;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function validateRow(row: Record<string, unknown>, rowNumber: number): ParsedRow {
  const email = String(row.email || row.email || '').trim();
  const firstName = String(row.firstName || row.first_name || row.firstname || '').trim();
  const lastName = String(row.lastName || row.last_name || row.lastname || '').trim();
  const name = String(row.name || '').trim();
  const phone = String(row.phone || row.contactNumber || '').trim();
  const employeeId = String(row.employeeId || row.employeeid || '').trim();
  const department = String(row.department || '').trim();
  const specialization = String(row.specialization || '').trim();
  const qualification = String(row.qualification || '').trim();
  const experienceYears = String(row.experienceYears || row.experienceyears || '').trim();
  const role = String(row.role || '').trim();

  const base: ParsedRow = {
    rowNumber,
    email,
    firstName: firstName || name.split(' ')[0] || '',
    lastName: lastName || name.split(' ').slice(1).join(' ') || '',
    phone,
    employeeId,
    department,
    specialization,
    qualification,
    experienceYears,
    role,
  };

  const emailRegex = /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!email) {
    return { ...base, error: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { ...base, error: 'Invalid email format' };
  }
  if (!base.firstName && !base.lastName) {
    return { ...base, error: 'Name is required (firstName/lastName or name)' };
  }
  if (experienceYears && Number.isNaN(Number(experienceYears))) {
    return { ...base, error: 'experienceYears must be a number' };
  }
  return base;
}

const FacultyBulkImport: React.FC<FacultyBulkImportProps> = ({ collegeId }) => {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [finalStatus, setFinalStatus] = useState<BulkUploadStatus | null>(null);
  const [errorRows, setErrorRows] = useState<BulkUploadError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validRows, invalidRows } = useMemo(() => {
    if (!rows) return { validRows: 0, invalidRows: 0 };
    return {
      validRows: rows.filter((r) => !r.error).length,
      invalidRows: rows.filter((r) => r.error).length,
    };
  }, [rows]);

  const resetState = useCallback(() => {
    setRows(null);
    setError(null);
    setUploading(false);
    setUploadProgress(null);
    setFinalStatus(null);
    setErrorRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadTemplate = useCallback(async () => {
    try {
      const res = await ssoClient.fetch('/api/college-admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download-faculty-template' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? 'Failed to download template');
      }
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faculty-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setRows(null);
    setUploadProgress(null);
    setFinalStatus(null);
    setErrorRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            const errorMsg = results.errors.map((er) => `Row ${(er.row ?? 0) + 1}: ${er.message}`).join(', ');
            setError(`CSV parsing errors: ${errorMsg}`);
            return;
          }
          if (!results.data || results.data.length === 0) {
            setError('CSV file is empty or contains no valid data');
            return;
          }

          const firstRow = results.data[0] as Record<string, unknown>;
          const hasRequiredColumn = REQUIRED_COLUMNS.some((col) => col in firstRow);
          if (!hasRequiredColumn) {
            setError('CSV must contain required columns: email, firstName, lastName (or name)');
            return;
          }

          if (results.data.length > MAX_ROWS) {
            setError(`CSV exceeds the ${MAX_ROWS} row limit`);
            return;
          }

          const parsed = (results.data as Array<Record<string, unknown>>).map((r, i) =>
            validateRow(r, i + 2),
          );
          setRows(parsed);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        }
      },
    });
  }, []);

  const submitImport = useCallback(async () => {
    if (!rows || rows.length === 0) return;

    const validRowsOnly = rows.filter((r) => !r.error);
    if (validRowsOnly.length === 0) {
      setError('No valid rows to import. Please fix the errors in your CSV.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress({ current: 0, total: validRowsOnly.length });

    try {
      const userStr = useAuthStore.getState().user
        ? JSON.stringify(useAuthStore.getState().user)
        : localStorage.getItem('user');
      const userEmail = useAuthStore.getState().user?.email || localStorage.getItem('userEmail');

      let organizationId = collegeId || '';
      if (!organizationId) {
        try {
          const userData = JSON.parse(userStr || '{}');
          organizationId = userData.collegeId || userData.organizationId || '';
        } catch {
          logger.warn('Failed to parse user data from store/localStorage');
        }
      }

      if (!organizationId && userEmail) {
        const orgResult = await apiPost<any>('/college-admin/faculty', {
          action: 'get-organization-by-email',
          email: userEmail,
          organization_type: 'college',
        });
        if (orgResult?.data?.id) {
          organizationId = orgResult.data.id;
        }
      }

      if (!organizationId) {
        setError('Organization ID not found. Please ensure you are logged in as a college admin.');
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      const csvHeader = 'email,firstName,lastName,phone,employeeId,department,specialization,qualification,experienceYears,role';
      const csvLines = validRowsOnly.map((r) =>
        [r.email, r.firstName, r.lastName, r.phone, r.employeeId, r.department, r.specialization, r.qualification, r.experienceYears, r.role]
          .map((v) => (v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v))
          .join(','),
      );
      const csvText = [csvHeader, ...csvLines].join('\n');

      const queueResult = await facultyBulkImportService.queueBulkUpload(csvText, organizationId);
      if (!queueResult.success) {
        setError(queueResult.error?.message || 'Failed to queue bulk upload');
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      const batchId = queueResult.data.batch_id;
      if (!batchId) {
        setError('Failed to get batch ID from queue response');
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      const MAX_POLL_ATTEMPTS = 90;
      const MAX_CONSECUTIVE_POLL_FAILURES = 5;
      let pollAttempts = 0;
      let consecutiveFailures = 0;

      const poll = async () => {
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          setError('Upload is still processing in the background. Please wait a few minutes and check again.');
          setUploading(false);
          setUploadProgress(null);
          return;
        }
        pollAttempts++;

        try {
          const statusResult = await facultyBulkImportService.getBulkStatus(batchId);
          if (!statusResult.success) {
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
              setError(`Failed to check upload status: ${statusResult.error?.message || 'Unknown error'}`);
              setUploading(false);
              setUploadProgress(null);
            } else {
              setTimeout(poll, 2000);
            }
            return;
          }
          consecutiveFailures = 0;

          const s = statusResult.data;
          if (s.status === 'processing' && s.total_rows > 0) {
            setUploadProgress({ current: s.processed_rows, total: s.total_rows });
          }

          if (s.status === 'completed' || s.status === 'failed') {
            setFinalStatus(s);
            let errList: BulkUploadError[] = [];
            if (s.failed_count > 0) {
              const errResult = await facultyBulkImportService.getBulkErrors(batchId);
              if (errResult.success) {
                errList = errResult.data.errors;
              } else {
                logger.warn('Failed to fetch bulk import errors', errResult.error);
                setError(
                  `${s.failed_count} row(s) failed but the error details could not be loaded: ${errResult.error?.message || 'Unknown error'}`,
                );
              }
            }
            setErrorRows(errList);
            setUploading(false);
            setUploadProgress(null);
            return;
          }

          setTimeout(poll, 2000);
        } catch (err) {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
            setError(
              `Failed to check upload status: ${err instanceof Error ? err.message : String(err)}`,
            );
            setUploading(false);
            setUploadProgress(null);
          } else {
            setTimeout(poll, 2000);
          }
        }
      };

      void poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
      setUploading(false);
      setUploadProgress(null);
    }
  }, [rows, collegeId]);

  const downloadErrors = useCallback(() => {
    if (errorRows.length === 0) return;
    const csv = ['row,email,error', ...errorRows.map((e) => `"${e.row}","${e.email}","${e.error.replace(/"/g, '""')}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty-import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [errorRows]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Bulk Faculty Import
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Import multiple faculty members at once using a CSV file
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {!rows && !uploading && !finalStatus && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Step 1: Download the template</h2>
              <p className="text-sm text-gray-500 mt-1">
                Use the template below to format your faculty list correctly.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border-2 border-dashed border-gray-300 p-6 bg-gray-50">
            <div>
              <h3 className="text-base font-medium text-gray-800">Step 2: Upload your completed CSV</h3>
              <p className="text-sm text-gray-500 mt-1">
                Required columns: <code className="text-indigo-600">email, firstName, lastName</code>.
                Optional: phone, employeeId, department, specialization, qualification, experienceYears, role.
                Max {MAX_ROWS} rows.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose CSV File
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {rows && !uploading && !finalStatus && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Preview ({validRows} valid, {invalidRows} with errors)
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetState}
                className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitImport}
                disabled={validRows === 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {validRows} Faculty Members
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Row', 'Email', 'First Name', 'Last Name', 'Phone', 'Employee ID', 'Department', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.rowNumber} className={row.error ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 text-sm text-gray-500">{row.rowNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{row.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{row.firstName}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{row.lastName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.phone}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.employeeId}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.department}</td>
                    <td className="px-4 py-2 text-sm">
                      {row.error ? (
                        <span className="text-red-600 text-xs">{row.error}</span>
                      ) : (
                        <span className="text-green-600">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Importing faculty…</h2>
          {uploadProgress && uploadProgress.total > 0 && (
            <div className="space-y-3">
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((uploadProgress.current / uploadProgress.total) * 100))}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {uploadProgress.current} / {uploadProgress.total} processed — you can leave this page and check back later.
              </p>
            </div>
          )}
        </div>
      )}

      {finalStatus && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import complete</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-2xl font-bold text-green-700">{finalStatus.success_count}</p>
              <p className="text-sm text-green-600">Imported</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-2xl font-bold text-red-700">{finalStatus.failed_count}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-700">{finalStatus.total_rows}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>

          {errorRows.length > 0 && (
            <>
              <div className="overflow-x-auto max-h-64 overflow-y-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Row', 'Email', 'Error'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {errorRows.map((er, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-500">{er.row}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{er.email}</td>
                        <td className="px-4 py-2 text-sm text-red-600">{er.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={downloadErrors}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Download Error Report (.csv)
              </button>
            </>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={resetState}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Import Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyBulkImport;