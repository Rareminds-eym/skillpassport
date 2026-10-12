/**
 * Export Menu Component
 * Dropdown menu for exporting analytics data
 */

import { useState, useRef, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';
import type { ExportFormat } from '../types';

interface ExportMenuProps {
  orgId: string;
  currentTab: string;
}

export function ExportMenu({ orgId, currentTab }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { filters } = useAnalyticsFilters();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('org_id', orgId);
      params.set('format', format);
      params.set('tab', currentTab);

      // Add filters
      if (filters.dateRange?.from) params.set('from', filters.dateRange.from);
      if (filters.dateRange?.to) params.set('to', filters.dateRange.to);
      if (filters.departments?.length > 0) params.set('departments', filters.departments.join(','));
      if (filters.locations?.length > 0) params.set('locations', filters.locations.join(','));
      if (filters.jobTypes?.length > 0) params.set('jobTypes', filters.jobTypes.join(','));
      if (filters.recruiters?.length > 0) params.set('recruiters', filters.recruiters.join(','));

      // Call export API
      const response = await fetch(`/api/recruitment/analytics/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      link.download = `analytics-${currentTab}-${timestamp}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message (you can use a toast library here)
      alert('Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="
          flex items-center gap-2 px-4 py-2
          text-sm font-medium text-gray-700
          bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="
          absolute right-0 mt-2 w-56
          bg-white rounded-lg border border-gray-200 shadow-lg
          z-50
        ">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Export Format
            </div>

            <button
              onClick={() => handleExport('pdf')}
              className="
                w-full flex items-center gap-3 px-3 py-2
                text-sm text-gray-700
                hover:bg-gray-50 rounded-md
                transition-colors
              "
            >
              <DocumentTextIcon className="h-5 w-5 text-red-600" />
              <div className="text-left flex-1">
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-gray-500">Visual report with charts</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="
                w-full flex items-center gap-3 px-3 py-2
                text-sm text-gray-700
                hover:bg-gray-50 rounded-md
                transition-colors
              "
            >
              <DocumentChartBarIcon className="h-5 w-5 text-green-600" />
              <div className="text-left flex-1">
                <div className="font-medium">Excel Workbook</div>
                <div className="text-xs text-gray-500">Formatted data in .xlsx</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="
                w-full flex items-center gap-3 px-3 py-2
                text-sm text-gray-700
                hover:bg-gray-50 rounded-md
                transition-colors
              "
            >
              <TableCellsIcon className="h-5 w-5 text-blue-600" />
              <div className="text-left flex-1">
                <div className="font-medium">CSV File</div>
                <div className="text-xs text-gray-500">Raw data in .csv</div>
              </div>
            </button>
          </div>

          <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs text-gray-600">
            Export includes current filters and {currentTab} tab data
          </div>
        </div>
      )}
    </div>
  );
}
