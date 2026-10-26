import { useState, useCallback, useEffect, useRef } from 'react';
import { Download, FileText, Loader2, Check } from 'lucide-react';
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
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { exportState, exportAs, clearError, isExporting } = useExport({
    content,
    courseTitle,
    lessonTitle,
  });

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setShowMenu(false);
      try {
        await exportAs(format);
        setExportedFormat(format);
        setTimeout(() => setExportedFormat(null), 2500);
      } catch {
        // error handled by useExport
      }
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
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        setShowMenu(false);
        clearError();
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
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
    <div className="relative inline-flex" ref={containerRef}>
      <button
        onClick={handleMenuToggle}
        disabled={isExporting || !hasContent}
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        title={hasContent ? 'Export as Document' : 'No content to export'}
        aria-label="Export content"
        aria-expanded={showMenu}
        aria-busy={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" aria-hidden="true" />
        ) : exportedFormat ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
        )}
        <span>{isExporting ? 'Exporting...' : exportedFormat ? 'Exported!' : 'Export'}</span>
      </button>

      <AnimatePresence>
        {showMenu && !isExporting && hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 z-30 w-56 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 text-xs"
          >
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-red-50/70 text-slate-700 hover:text-red-700 rounded-lg transition-colors text-left font-medium"
              aria-label="Export as PDF"
            >
              <div className="w-6 h-6 rounded-md bg-red-100/70 flex items-center justify-center text-red-600 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-900 leading-5">PDF Document</span>
                <span className="block text-[10px] leading-4 text-slate-500 font-normal">Formatted & ready to print</span>
              </div>
            </button>

            <button
              onClick={() => handleExport('docx')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 rounded-lg transition-colors text-left font-medium"
              aria-label="Export as DOCX"
            >
              <div className="w-6 h-6 rounded-md bg-blue-100/70 flex items-center justify-center text-blue-600 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-900 leading-5">Word Document</span>
                <span className="block text-[10px] leading-4 text-slate-500 font-normal">Editable .docx format</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportState.error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 bottom-full mb-2 w-56 max-w-[calc(100vw-2rem)] bg-red-50 border border-red-200 rounded-lg shadow-md z-30 px-3 py-1.5 text-xs text-red-700 break-words flex items-center gap-2"
          >
            <span>{exportState.error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 font-bold leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorksheetExportButton;
