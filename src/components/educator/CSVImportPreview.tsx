/**
 * CSV Import Preview Component
 * Clean, modern UI for previewing CSV data before import
 */

import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { ValidatedRow, ImportSummary } from '../../services/csvImportService';

interface Props {
  validatedRows: ValidatedRow[];
  summary: ImportSummary;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const CSVImportPreview: React.FC<Props> = ({
  validatedRows,
  summary,
  onConfirm,
  onCancel,
  loading,
}) => {
  const validStudents = validatedRows.filter((r) => r.isValid);
  const invalidStudents = validatedRows.filter((r) => !r.isValid);

  const downloadErrorCSV = () => {
    if (invalidStudents.length === 0) return;

    // Create CSV with errors
    const headers = ['Row', 'Student Name', 'Email', 'Errors'];
    const rows = invalidStudents.map((row) => [
      row.rowNumber,
      row.data.student_name || '',
      row.data.email || '',
      row.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Rows</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{summary.totalRows}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Valid</div>
          <div className="text-2xl font-semibold text-green-700 mt-1">{summary.validRows}</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Invalid</div>
          <div className="text-2xl font-semibold text-red-700 mt-1">{summary.invalidRows}</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm text-amber-600">Capacity Issues</div>
          <div className="text-2xl font-semibold text-amber-700 mt-1">{summary.capacityIssues}</div>
        </div>
      </div>

      {/* Additional Info */}
      {summary.classesUpdated > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-900 mb-2">Class Information</div>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• {summary.classesUpdated} existing class(es) will be updated</div>
          </div>
        </div>
      )}

      {/* Valid Students Section */}
      {validStudents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              Valid Students ({validStudents.length})
            </h4>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Grade & Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Guardian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validStudents.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{row.rowNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.data.student_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.data.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.data.grade} {row.data.section}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.data.guardian_name}
                        {row.data.guardian_phone && (
                          <div className="text-xs text-gray-500">{row.data.guardian_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Students Section */}
      {invalidStudents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900 flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              Invalid Students ({invalidStudents.length})
            </h4>
            <button
              onClick={downloadErrorCSV}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download Error CSV
            </button>
          </div>

          <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Grade & Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invalidStudents.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-red-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{row.rowNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.data.student_name || (
                          <span className="text-gray-400 italic">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.data.email || <span className="text-gray-400 italic">Missing</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.data.grade && row.data.section ? (
                          `${row.data.grade} ${row.data.section}`
                        ) : (
                          <span className="text-gray-400 italic">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {row.errors.map((error, idx) => (
                            <div key={idx} className="flex items-start text-xs text-red-600">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>
                                <span className="font-medium">{error.field}:</span> {error.message}
                              </span>
                            </div>
                          ))}
                          {row.capacityIssue && (
                            <div className="flex items-start text-xs text-amber-600">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span>{row.capacityIssue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {validStudents.length > 0 ? (
            <span>
              <span className="font-medium text-gray-900">{validStudents.length}</span> student(s)
              ready to import
            </span>
          ) : (
            <span className="text-red-600 font-medium">No valid students to import</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>

          {validStudents.length > 0 && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Confirm Import ({validStudents.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportPreview;
