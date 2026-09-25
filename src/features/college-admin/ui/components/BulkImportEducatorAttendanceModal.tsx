import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { apiPost } from '@/shared/api/apiClient';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface BulkImportEducatorAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facultyList: Faculty[];
  collegeId: string | null;
}

interface ParsedRecord {
  facultyId: string;
  facultyName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  subject?: string;
  roomNumber?: string;
  remarks?: string;
  error?: string;
}

export default function BulkImportEducatorAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  facultyList,
  collegeId,
}: BulkImportEducatorAttendanceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const downloadTemplate = () => {
    const csvContent = [
      'Faculty Email,Date (YYYY-MM-DD),Start Time (HH:MM),End Time (HH:MM),Status (completed/scheduled),Subject,Room Number,Remarks',
      'john.doe@college.edu,2026-09-25,09:00,10:00,completed,Mathematics,Room 301,Regular class',
      'jane.smith@college.edu,2026-09-25,10:00,11:00,completed,Physics,Lab 2,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'educator_attendance_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (file: File) => {
    setLoading(true);
    setError('');
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file is empty or has no data rows');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const records: ParsedRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 5) continue; // Skip incomplete rows

        const [email, date, startTime, endTime, status, subject, roomNumber, remarks] = values;

        // Find faculty by email
        const faculty = facultyList.find(f => f.email.toLowerCase() === email.toLowerCase());
        
        if (!faculty) {
          records.push({
            facultyId: '',
            facultyName: email,
            date,
            startTime,
            endTime,
            status,
            subject,
            roomNumber,
            remarks,
            error: `Faculty not found: ${email}`,
          });
          continue;
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          records.push({
            facultyId: faculty.id,
            facultyName: faculty.name,
            date,
            startTime,
            endTime,
            status,
            subject,
            roomNumber,
            remarks,
            error: 'Invalid date format (use YYYY-MM-DD)',
          });
          continue;
        }

        // Validate time format
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
          records.push({
            facultyId: faculty.id,
            facultyName: faculty.name,
            date,
            startTime,
            endTime,
            status,
            subject,
            roomNumber,
            remarks,
            error: 'Invalid time format (use HH:MM)',
          });
          continue;
        }

        // Validate status
        if (status !== 'completed' && status !== 'scheduled') {
          records.push({
            facultyId: faculty.id,
            facultyName: faculty.name,
            date,
            startTime,
            endTime,
            status,
            subject,
            roomNumber,
            remarks,
            error: 'Status must be "completed" or "scheduled"',
          });
          continue;
        }

        records.push({
          facultyId: faculty.id,
          facultyName: faculty.name,
          date,
          startTime,
          endTime,
          status,
          subject,
          roomNumber,
          remarks,
        });
      }

      setParsedData(records);
      
      const validRecords = records.filter(r => !r.error).length;
      const invalidRecords = records.filter(r => r.error).length;
      
      if (validRecords === 0) {
        setError('No valid records found in CSV file');
      } else {
        setError(`Found ${validRecords} valid record(s)${invalidRecords > 0 ? ` and ${invalidRecords} invalid record(s)` : ''}`);
      }
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError('Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const validRecords = parsedData.filter(r => !r.error);
    
    if (validRecords.length === 0) {
      setError('No valid records to import');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const result = await apiPost('/college-admin/attendance', {
        action: 'bulk-import-educator',
        collegeId,
        attendanceData: validRecords.map(r => ({
          facultyId: r.facultyId,
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
          subject: r.subject || '',
          roomNumber: r.roomNumber || '',
          remarks: r.remarks || '',
        })),
        createdBy: null,
      });

      if (result.data?.imported) {
        setSuccessCount(result.data.imported);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(result.data?.message || 'Failed to import records');
      }
    } catch (err: any) {
      console.error('Error importing records:', err);
      setError(err.message || 'Failed to import records');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    setSuccessCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bulk Import Educator Attendance
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-800 dark:text-blue-400 list-decimal list-inside space-y-1">
                <li>Download the CSV template</li>
                <li>Fill in the attendance data (one row per session)</li>
                <li>Make sure faculty emails match exactly</li>
                <li>Use date format: YYYY-MM-DD (e.g., 2026-09-25)</li>
                <li>Use time format: HH:MM (e.g., 09:00, 14:30)</li>
                <li>Upload the completed CSV file</li>
              </ol>
            </div>

            {/* Download Template */}
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Download CSV Template
            </button>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Loading/Error Messages */}
            {loading && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                Parsing CSV file...
              </div>
            )}

            {error && (
              <div className={`border rounded-lg p-4 ${
                parsedData.filter(r => !r.error).length > 0
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              }`}>
                {error}
              </div>
            )}

            {successCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 rounded-lg p-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Successfully imported {successCount} attendance record(s)!
              </div>
            )}

            {/* Preview Table */}
            {parsedData.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Preview ({parsedData.length} records)
                </h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Faculty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Time</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {parsedData.map((record, idx) => (
                          <tr key={idx} className={record.error ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              {record.error ? (
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" title={record.error} />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {record.facultyName}
                              {record.error && (
                                <div className="text-xs text-red-600 dark:text-red-400">{record.error}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {record.date}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {record.startTime} - {record.endTime}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {record.subject || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={importing}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || parsedData.filter(r => !r.error).length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  `Import ${parsedData.filter(r => !r.error).length} Records`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
