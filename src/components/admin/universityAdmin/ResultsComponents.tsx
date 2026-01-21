import React, { useState } from 'react';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Result Status Badge Component
export const ResultStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pass':
        return {
          icon: CheckCircleIcon,
          className: 'bg-green-100 text-green-800',
          text: 'Pass',
        };
      case 'fail':
        return {
          icon: XCircleIcon,
          className: 'bg-red-100 text-red-800',
          text: 'Fail',
        };
      case 'absent':
        return {
          icon: ExclamationTriangleIcon,
          className: 'bg-gray-100 text-gray-800',
          text: 'Absent',
        };
      case 'pending':
        return {
          icon: ClockIcon,
          className: 'bg-yellow-100 text-yellow-800',
          text: 'Pending',
        };
      default:
        return {
          icon: ClockIcon,
          className: 'bg-gray-100 text-gray-800',
          text: status,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </span>
  );
};

// Grade Badge Component
export const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B+' || grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C' || grade === 'D') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade)}`}
    >
      {grade}
    </span>
  );
};

// Quick Stats Card Component
export const QuickStatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <Icon className={`h-8 w-8 ${color.replace('text-', 'text-').replace('-600', '-500')}`} />
      </div>
    </div>
  );
};

// Results Filter Panel Component
export const ResultsFilterPanel: React.FC<{
  filters: any;
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}> = ({ filters, onFilterChange, onReset }) => {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
        <button onClick={onReset} className="text-sm text-blue-600 hover:text-blue-800">
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            value={filters.academicYear}
            onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select
            value={filters.program}
            onChange={(e) => handleFilterChange('program', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Programs</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={filters.semester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem.toString()}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
          <select
            value={filters.college}
            onChange={(e) => handleFilterChange('college', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Colleges</option>
            <option value="Engineering College A">Engineering College A</option>
            <option value="Engineering College B">Engineering College B</option>
            <option value="Engineering College C">Engineering College C</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Bulk Actions Toolbar Component
export const BulkActionsToolbar: React.FC<{
  selectedCount: number;
  onBulkPublish: () => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
}> = ({ selectedCount, onBulkPublish, onBulkExport, onBulkDelete }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} result{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={onBulkPublish}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Publish Selected
          </button>
          <button
            onClick={onBulkExport}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Export Selected
          </button>
          <button
            onClick={onBulkDelete}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};

// Results Summary Component
export const ResultsSummary: React.FC<{
  totalResults: number;
  publishedResults: number;
  pendingResults: number;
  passRate: number;
}> = ({ totalResults, publishedResults, pendingResults, passRate }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
      <h2 className="text-xl font-bold mb-4">Results Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold">{totalResults}</p>
          <p className="text-sm opacity-90">Total Results</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{publishedResults}</p>
          <p className="text-sm opacity-90">Published</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{pendingResults}</p>
          <p className="text-sm opacity-90">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{passRate.toFixed(1)}%</p>
          <p className="text-sm opacity-90">Pass Rate</p>
        </div>
      </div>
    </div>
  );
};

// Export Options Modal Component
export const ExportOptionsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, options: any) => void;
}> = ({ isOpen, onClose, onExport }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [includeFilters, setIncludeFilters] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(exportFormat, {
      includeFilters,
      includeStats,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                Excel (.xlsx)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                PDF Report
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                CSV File
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Include Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeFilters}
                  onChange={(e) => setIncludeFilters(e.target.checked)}
                  className="mr-2"
                />
                Applied Filters Summary
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="mr-2"
                />
                Statistical Summary
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
