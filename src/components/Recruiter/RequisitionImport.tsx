import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';

interface RequisitionImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  userId?: string;
}

interface ImportRow {
  job_title: string;
  company_name: string;
  department: string;
  location: string;
  mode: string;
  employment_type: string;
  experience_level: string;
  experience_required: string;
  salary_range_min: number;
  salary_range_max: number;
  status: string;
  description: string;
  requirements: string;
  responsibilities: string;
  skills_required: string;
  benefits: string;
  deadline: string;
  recruiter_email?: string;
}

const RequisitionImport: React.FC<RequisitionImportProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  userId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const downloadTemplate = () => {
    const template = [
      {
        job_title: 'Senior Full Stack Developer',
        company_name: 'Tech Corp Inc.',
        department: 'Engineering',
        location: 'Bangalore, Remote',
        mode: 'Remote',
        employment_type: 'Full-time',
        experience_level: 'Senior',
        experience_required: '5-7 years',
        salary_range_min: 1500000,
        salary_range_max: 2500000,
        status: 'open',
        description: 'We are looking for an experienced Full Stack Developer to join our team.',
        requirements: 'Bachelor degree in CS | 5+ years experience | React expertise | Node.js proficiency',
        responsibilities: 'Develop features | Code reviews | Mentor juniors | Architecture decisions',
        skills_required: 'React | Node.js | TypeScript | PostgreSQL | AWS',
        benefits: 'Health Insurance | Remote Work | Learning Budget | Stock Options',
        deadline: '2026-03-31',
        recruiter_email: 'recruiter@example.com'
      },
      {
        job_title: 'Data Analyst',
        company_name: 'Analytics Solutions Ltd.',
        department: 'Data Science',
        location: 'Mumbai, Hybrid',
        mode: 'Hybrid',
        employment_type: 'Full-time',
        experience_level: 'Mid',
        experience_required: '3-5 years',
        salary_range_min: 800000,
        salary_range_max: 1200000,
        status: 'open',
        description: 'Join our data team to drive insights and business decisions.',
        requirements: 'Statistics background | SQL expertise | Python knowledge | Data visualization skills',
        responsibilities: 'Analyze data | Create dashboards | Present insights | Collaborate with teams',
        skills_required: 'SQL | Python | Tableau | Excel | Statistics',
        benefits: 'Health Insurance | Flexible Hours | Training Programs',
        deadline: '2026-02-28',
        recruiter_email: 'hr@analytics.com'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requisitions');

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // job_title
      { wch: 25 }, // company_name
      { wch: 20 }, // department
      { wch: 25 }, // location
      { wch: 12 }, // mode
      { wch: 15 }, // employment_type
      { wch: 15 }, // experience_level
      { wch: 15 }, // experience_required
      { wch: 15 }, // salary_range_min
      { wch: 15 }, // salary_range_max
      { wch: 12 }, // status
      { wch: 50 }, // description
      { wch: 50 }, // requirements
      { wch: 50 }, // responsibilities
      { wch: 40 }, // skills_required
      { wch: 40 }, // benefits
      { wch: 12 }, // deadline
      { wch: 25 }  // recruiter_email
    ];

    XLSX.writeFile(wb, 'requisitions_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setSuccessCount(0);
    }
  };

  const validateRow = (row: any, index: number): string | null => {
    const requiredFields = ['job_title', 'department', 'location', 'employment_type', 'experience_level', 'status'];
    
    for (const field of requiredFields) {
      if (!row[field]) {
        return `Row ${index + 2}: Missing required field '${field}'`;
      }
    }

    // Validate status
    const validStatuses = ['draft', 'open', 'closed', 'on_hold'];
    if (!validStatuses.includes(row.status?.toLowerCase())) {
      return `Row ${index + 2}: Invalid status '${row.status}'. Must be one of: ${validStatuses.join(', ')}`;
    }

    // Validate employment_type
    const validEmploymentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    if (!validEmploymentTypes.includes(row.employment_type)) {
      return `Row ${index + 2}: Invalid employment_type '${row.employment_type}'. Must be one of: ${validEmploymentTypes.join(', ')}`;
    }

    // Validate experience_level
    const validExperienceLevels = ['Entry', 'Mid', 'Senior', 'Lead'];
    if (!validExperienceLevels.includes(row.experience_level)) {
      return `Row ${index + 2}: Invalid experience_level '${row.experience_level}'. Must be one of: ${validExperienceLevels.join(', ')}`;
    }

    // Validate mode if provided
    if (row.mode) {
      const validModes = ['Remote', 'On-site', 'Hybrid'];
      if (!validModes.includes(row.mode)) {
        return `Row ${index + 2}: Invalid mode '${row.mode}'. Must be one of: ${validModes.join(', ')}`;
      }
    }

    return null;
  };

  const parseArrayField = (value: string): string[] => {
    if (!value) return [];
    return value.split('|').map(item => item.trim()).filter(Boolean);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setSuccessCount(0);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setErrors(['The file is empty or has no valid data']);
        setImporting(false);
        return;
      }

      const validationErrors: string[] = [];
      const validRows: any[] = [];

      // Validate all rows first
      jsonData.forEach((row, index) => {
        const error = validateRow(row, index);
        if (error) {
          validationErrors.push(error);
        } else {
          validRows.push(row);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setImporting(false);
        return;
      }

      // Get recruiter IDs if emails are provided
      const recruiterEmails = validRows
        .map(row => row.recruiter_email)
        .filter(Boolean);
      
      let recruiterMap: Record<string, string> = {};
      
      if (recruiterEmails.length > 0) {
        const { data: recruiters } = await supabase
          .from('recruiters')
          .select('id, email')
          .in('email', recruiterEmails);
        
        if (recruiters) {
          recruiterMap = recruiters.reduce((acc, r) => {
            acc[r.email] = r.id;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Import rows
      let imported = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        
        try {
          const requisitionData = {
            title: row.job_title,
            job_title: row.job_title,
            company_name: row.company_name || 'Not Specified',
            company_logo: null,
            department: row.department,
            location: row.location,
            mode: row.mode || null,
            employment_type: row.employment_type,
            experience_level: row.experience_level,
            experience_required: row.experience_required || null,
            salary_range_min: row.salary_range_min ? Number(row.salary_range_min) : null,
            salary_range_max: row.salary_range_max ? Number(row.salary_range_max) : null,
            status: row.status.toLowerCase(),
            description: row.description || '',
            requirements: parseArrayField(row.requirements),
            responsibilities: parseArrayField(row.responsibilities),
            skills_required: parseArrayField(row.skills_required),
            benefits: parseArrayField(row.benefits),
            deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
            applications_count: 0,
            messages_count: 0,
            views_count: 0,
            created_by: userId,
            posted_date: new Date().toISOString(),
            is_active: row.status.toLowerCase() === 'open',
            recruiter_id: row.recruiter_email ? recruiterMap[row.recruiter_email] : null
          };

          const { error } = await supabase
            .from('opportunities')
            .insert(requisitionData);

          if (error) {
            importErrors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          importErrors.push(`Row ${i + 2}: ${err.message}`);
        }

        setProgress(Math.round(((i + 1) / validRows.length) * 100));
      }

      setSuccessCount(imported);
      
      if (importErrors.length > 0) {
        setErrors(importErrors);
      }

      if (imported > 0) {
        setTimeout(() => {
          onImportComplete();
          if (importErrors.length === 0) {
            onClose();
          }
        }, 1500);
      }
    } catch (error: any) {
      setErrors([`Import failed: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Requisitions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={importing}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">Step 1: Download Template</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Download the Excel template with sample data and required format
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="ml-4 inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>

          {/* Upload File */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Step 2: Upload Filled Template</h3>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
              <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={importing}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                {file && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Format Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Required Fields:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>job_title, department, location</li>
              <li>employment_type: Full-time, Part-time, Contract, Internship</li>
              <li>experience_level: Entry, Mid, Senior, Lead</li>
              <li>status: draft, open, closed, on_hold</li>
              <li>mode (optional): Remote, On-site, Hybrid</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Use pipe (|) to separate multiple items in requirements, responsibilities, skills, and benefits
            </p>
          </div>

          {/* Progress */}
          {importing && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Importing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {successCount > 0 && !importing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Successfully imported {successCount} requisition{successCount !== 1 ? 's' : ''}!
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-red-900 mb-2">
                Errors ({errors.length}):
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : 'Import Requisitions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequisitionImport;
