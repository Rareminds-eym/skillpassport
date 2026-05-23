import { useState, useCallback, useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExport } from '../model/useExport';
import type { ExportFormat } from '../types/export';

interface WorksheetExportButtonProps {
  content: string;
  courseTitle?: string;
  lessonTitle?: string;
  className?: string;
}

export const WorksheetExportButton = ({
  content,
  courseTitle = 'Course',
  lessonTitle = 'Lesson',
  className = '',
}: WorksheetExportButtonProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const { exportState, exportAs, clearError, isExporting } = useExport({
    content,
    courseTitle,
    lessonTitle,
  });

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setShowMenu(false);
      await exportAs(format);
    },
    [exportAs]
  );

  const handleMenuToggle = useCallback(() => {
    if (!isExporting) {
      setShowMenu(prev => !prev);
      clearError();
    }
  }, [isExporting, clearError]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        setShowMenu(false);
        clearError();
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMenu, clearError]);

  useEffect(() => {
    if (exportState.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportState.error, clearError]);

  const hasContent = content && content.trim().length > 0;

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleMenuToggle}
        disabled={isExporting || !hasContent}
        className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={hasContent ? 'Export worksheet' : 'No content to export'}
        aria-label="Export worksheet"
        aria-expanded={showMenu}
        aria-busy={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      <AnimatePresence>
        {showMenu && !isExporting && hasContent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-20 flex flex-col gap-2"
            >
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-red-50 border border-gray-200 rounded-full shadow-lg transition-colors"
                aria-label="Export as PDF"
              >
                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Export as PDF</span>
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('docx')}
                className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-full shadow-lg transition-colors"
                aria-label="Export as DOCX"
              >
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Export as DOCX</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportState.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-red-50 border border-red-200 rounded-full shadow-lg z-20 px-4 py-2 text-xs text-red-700 whitespace-nowrap"
          >
            <button
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-600 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
            {exportState.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorksheetExportButton;
