import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { bulkImportTeachers } from '../../../../services/teacherService';

interface ImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: string;
  designation?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  date_of_joining?: string;
  subjects?: string; // Comma-separated
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const TeacherBulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone_number,role,designation,department,qualification,specialization,experience_years,date_of_joining,subjects
John,Doe,john.doe@school.edu,+1234567890,subject_teacher,Senior Teacher,Mathematics,M.Sc Mathematics,Algebra,5,2020-01-15,"Mathematics,Algebra"
Jane,Smith,jane.smith@school.edu,+1234567891,class_teacher,Class Teacher,Science,M.Sc Physics,Quantum Physics,8,2018-06-01,"Physics,Chemistry"
`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as ImportRow[];
        setData(parsedData);
        validateData(parsedData);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Failed to parse CSV file');
      },
    });
  };

  const validateData = (rows: ImportRow[]) => {
    const validationErrors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ['school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher'];

    rows.forEach((row, index) => {
      // Required fields
      if (!row.first_name?.trim()) {
        validationErrors.push({
          row: index + 1,
          field: 'first_name',
          message: 'First name is required',
        });
      }

      if (!row.last_name?.trim()) {
        validationErrors.push({
          row: index + 1,
          field: 'last_name',
          message: 'Last name is required',
        });
      }

      if (!row.email?.trim()) {
        validationErrors.push({
          row: index + 1,
          field: 'email',
          message: 'Email is required',
        });
      } else if (!emailRegex.test(row.email)) {
        validationErrors.push({
          row: index + 1,
          field: 'email',
          message: 'Invalid email format',
        });
      }

      if (!row.role?.trim()) {
        validationErrors.push({
          row: index + 1,
          field: 'role',
          message: 'Role is required',
        });
      } else if (!validRoles.includes(row.role)) {
        validationErrors.push({
          row: index + 1,
          field: 'role',
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }

      // Optional field validation
      if (row.experience_years && isNaN(Number(row.experience_years))) {
        validationErrors.push({
          row: index + 1,
          field: 'experience_years',
          message: 'Experience years must be a number',
        });
      }

      if (row.date_of_joining && isNaN(Date.parse(row.date_of_joining))) {
        validationErrors.push({
          row: index + 1,
          field: 'date_of_joining',
          message: 'Invalid date format (use YYYY-MM-DD)',
        });
      }
    });

    setErrors(validationErrors);
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      alert('Please fix all validation errors before importing');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Get school_id from current user
      const schoolId = 'your-school-id'; // Replace with actual

      // Transform data for import
      const teachersToImport = data.map((row) => ({
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone_number: row.phone_number || null,
        role: row.role as any,
        designation: row.designation || null,
        department: row.department || null,
        qualification: row.qualification || null,
        specialization: row.specialization || null,
        experience_years: row.experience_years ? Number(row.experience_years) : null,
        date_of_joining: row.date_of_joining || null,
        subjects_handled: row.subjects ? row.subjects.split(',').map(s => s.trim()) : [],
        school_id: schoolId,
        onboarding_status: 'pending' as const,
      }));

      const result = await bulkImportTeachers(teachersToImport);
      
      setImportResult({
        success: result.length,
        failed: data.length - result.length,
      });

      // Clear form on success
      if (result.length === data.length) {
        setFile(null);
        setData([]);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bulk Import Teachers</h2>
        <p className="text-gray-600 mt-1">Import multiple teachers at once using a CSV file</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How to Import</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Download the CSV template below</li>
          <li>Fill in teacher information following the template format</li>
          <li>Upload the completed CSV file</li>
          <li>Review any validation errors</li>
          <li>Click "Import Teachers" to complete the process</li>
        </ol>
      </div>

      {/* Download Template */}
      <div className="flex gap-4">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Download className="h-5 w-5" />
          Download CSV Template
        </button>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <label className="cursor-pointer">
            <span className="text-indigo-600 hover:text-indigo-700 font-medium">
              Click to upload
            </span>
            <span className="text-gray-600"> or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">CSV file only</p>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  setData([]);
                  setErrors([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              {errors.length} Validation Error{errors.length !== 1 ? 's' : ''} Found
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-800 bg-red-100 rounded p-2">
                <span className="font-medium">Row {error.row}</span> - {error.field}: {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Data */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Preview ({data.length} teachers)</h3>
              <p className="text-sm text-gray-600">Review the data before importing</p>
            </div>
            {errors.length === 0 && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.subjects || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-xl p-6 border ${
          importResult.failed === 0
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className={`h-6 w-6 ${
              importResult.failed === 0 ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <h3 className={`font-semibold ${
              importResult.failed === 0 ? 'text-green-900' : 'text-yellow-900'
            }`}>
              Import Complete
            </h3>
          </div>
          <p className={`text-sm ${
            importResult.failed === 0 ? 'text-green-800' : 'text-yellow-800'
          }`}>
            Successfully imported {importResult.success} teacher{importResult.success !== 1 ? 's' : ''}.
            {importResult.failed > 0 && ` ${importResult.failed} failed.`}
          </p>
        </div>
      )}

      {/* Import Button */}
      {data.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={importing || errors.length > 0}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Import {data.length} Teacher{data.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherBulkImport;
