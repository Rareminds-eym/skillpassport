import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { apiPost } from '@/shared/api/apiClient';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

interface RequisitionImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// NOTE: rows are submitted as untyped normalized objects (parsed sheet cells);
// no local row interface is needed after validation.
const VALID_STATUSES = ['draft', 'open', 'closed', 'on_hold'];
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 500;

// Parse a deadline cell into a canonical 'YYYY-MM-DD' string.
// Handles: ISO/plain text dates, and Excel date serials (numbers > ~20000 are
// days since 1899-12-30). Anything unparseable yields undefined so the row is
// rejected during validation instead of silently creating a bad record.
const parseDeadline = (value: any): string | undefined => {
  if (value == null || String(value).trim() === '') return undefined;

  const numeric = typeof value === 'number' ? value : (/^[\d.]+$/.test(String(value).trim()) ? Number(value) : null);
  if (numeric != null && !isNaN(numeric)) {
    if (numeric > 0 && numeric <= 60) return undefined; // small numbers are not dates
    if (numeric > 20000 && numeric < 100000) {
      // Excel serial → epoch ms (25569 days between 1899-12-30 and 1970-01-01)
      const d = new Date((numeric - 25569) * 86400 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (numeric > 0) {
      // Bare number outside the Excel serial range — cannot be a sane deadline
      return undefined;
    }
    return undefined;
  }

  const trimmed = String(value).trim();
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const RequisitionImport: React.FC<RequisitionImportProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  // Real staged progress (parse → validate → submit). The old fake percent
  // bar jumped 0 → 100 and misled users; a staged label is honest.
  const [stage, setStage] = useState<'parse' | 'validate' | 'submit' | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  // Escape closes the import dialog — but never while a submission is running.
  useEscapeToClose({ enabled: isOpen && !importing, onEscape: onClose });

  useEffect(() => {
    if (isOpen) overlayRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

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
    setErrors([]);
    setSuccessCount(0);
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_BYTES) {
      setErrors([
        `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Please upload a file under 2 MB.`,
      ]);
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const validateRow = (row: any, index: number): string | null => {
    const requiredFields = ['job_title', 'department', 'location', 'employment_type', 'experience_level', 'status'];

    for (const field of requiredFields) {
      if (!row[field]) {
        return `Row ${index + 2}: Missing required field '${field}'`;
      }
    }

    // Validate status (already normalized/whitelisted during row cleanup)
    if (!row.status || !VALID_STATUSES.includes(row.status)) {
      return `Row ${index + 2}: Invalid status '${row.status ?? ''}'. Must be one of: ${VALID_STATUSES.join(', ')}`;
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

  const handleImport = async () => {
    if (!file || importing) return;

    setImporting(true);
    setErrors([]);
    setSuccessCount(0);
    setStage('parse');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rawRows.length === 0) {
        setErrors(['The file is empty or has no valid data']);
        setImporting(false);
        setStage(null);
        return;
      }

      if (rawRows.length > MAX_ROWS) {
        setErrors([
          `The file contains ${rawRows.length} rows. A maximum of ${MAX_ROWS} rows can be imported at once.`,
        ]);
        setImporting(false);
        setStage(null);
        return;
      }

      setStage('validate');

      const validationErrors: string[] = [];
      const validRows: any[] = [];

      rawRows.forEach((raw, index) => {
        // Reject obviously invalid deadlines early (Excel serials / ISO / text
        // are accepted — anything unparseable is a hard row error).
        if (raw.deadline != null && String(raw.deadline).trim() !== '' && parseDeadline(raw.deadline) === undefined) {
          validationErrors.push(`Row ${index + 2}: Invalid deadline '${raw.deadline}'`);
          return;
        }

        // Normalize BEFORE validation: trim + lowercase status ('Open' → 'open',
        // 'On Hold' → 'on_hold') so cascade cases don't bounce.
        const row: any = { ...raw };
        if (row.status != null && String(row.status).trim() !== '') {
          row.status = String(row.status).trim().toLowerCase().replace(/\s+/g, '_');
        }
        // Normalize other multi-word keys the same way (harmless for already-clean input)
        if (row.experience_level != null && String(row.experience_level).trim() !== '') {
          row.experience_level = String(row.experience_level).trim();
        }
        if (row.mode != null && String(row.mode).trim() !== '') {
          row.mode = String(row.mode).trim();
        }
        const parsedDeadline = parseDeadline(row.deadline);
        if (parsedDeadline) row.deadline = parsedDeadline;

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
        setStage(null);
        return;
      }

      setStage('submit');

      const result: any = await apiPost('/recruiter/actions', {
        action: 'import-requisitions',
        rows: validRows,
      });

      // apiPost returns the { success, data, error, meta } envelope; the import
      // payload lives in result.data: { success, failed, errors }.
      const payload = result?.data ?? {};
      setSuccessCount(payload?.success || 0);

      if (payload?.errors?.length > 0) {
        setErrors(payload.errors.map((e: any) => `Row ${e.row}: ${e.error}`));
      }

      if ((payload?.success || 0) > 0) {
        setTimeout(() => {
          onImportComplete();
          if (!payload?.errors?.length) {
            onClose();
          }
        }, 1500);
      }
      setStage(null);
    } catch (error: any) {
      setErrors([`Import failed: ${error.message}`]);
      setStage(null);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const stageLabel = stage === 'parse'
    ? 'Reading file…'
    : stage === 'validate'
      ? 'Validating rows…'
      : stage === 'submit'
        ? 'Submitting to server…'
        : 'Importing…';

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 outline-none"
    >
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
                <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls) · max 2 MB · max 500 rows</p>
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
              <li>deadline (optional): date value — Excel dates and 'YYYY-MM-DD' are both accepted</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Use pipe (|) to separate multiple items in requirements, responsibilities, skills, and benefits
            </p>
          </div>

          {/* Staged progress */}
          {importing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>{stageLabel}</span>
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
            {importing ? stageLabel.replace('…', '...') : 'Import Requisitions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequisitionImport;
