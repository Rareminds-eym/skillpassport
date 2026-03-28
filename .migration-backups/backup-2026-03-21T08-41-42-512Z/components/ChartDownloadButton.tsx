import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon, PhotoIcon, DocumentTextIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { downloadChartAsPNG, downloadChartDataAsCSV, copyChartToClipboard } from '../utils/chartDownload';

interface ChartDownloadButtonProps {
  chartId: string;
  chartName: string;
  data?: any[];
  compact?: boolean;
}

const ChartDownloadButton: React.FC<ChartDownloadButtonProps> = ({ 
  chartId, 
  chartName, 
  data,
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadPNG = () => {
    downloadChartAsPNG(chartId, chartName);
    setIsOpen(false);
  };

  const handleDownloadCSV = () => {
    if (data) {
      downloadChartDataAsCSV(data, chartName);
    }
    setIsOpen(false);
  };

  const handleCopyToClipboard = () => {
    copyChartToClipboard(chartId);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <button
        onClick={handleDownloadPNG}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        title="Download chart as PNG"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Download</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-1">
            <button
              onClick={handleDownloadPNG}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Download as PNG</span>
            </button>

            {data && data.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Download Data (CSV)</span>
              </button>
            )}

            <button
              onClick={handleCopyToClipboard}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
            >
              <ClipboardIcon className="h-4 w-4" />
              <span>Copy to Clipboard</span>
            </button>
          </div>

          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {chartName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartDownloadButton;
