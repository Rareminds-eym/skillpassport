import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { exportToPDF } from './exportToPDF';
import { exportToDOCX } from './exportToDOCX';
import { getLogger } from '@/shared/config/logging';
import type { ExportFormat, ExportState } from '../types/export';

const logger = getLogger('use-export');

const IDLE_STATE: ExportState = { isExporting: false, format: null, error: null };

interface UseExportOptions {
  content: string;
  courseTitle: string;
  lessonTitle: string;
  onSuccess?: (format: ExportFormat) => void;
  onError?: (error: Error, format: ExportFormat) => void;
}

interface UseExportReturn {
  exportState: ExportState;
  exportAs: (format: ExportFormat) => Promise<void>;
  clearError: () => void;
  isExporting: boolean;
}

/**
 * Custom hook for managing document export functionality
 * Handles PDF and DOCX exports with proper state management
 */
export function useExport({
  content,
  courseTitle,
  lessonTitle,
  onSuccess,
  onError,
}: UseExportOptions): UseExportReturn {
  const [exportState, setExportState] = useState<ExportState>(IDLE_STATE);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Sync latest callbacks into refs so `exportAs` can call them
  // without needing them in its dependency array (avoids unnecessary re-creation).
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onErrorRef.current = onError; }, [onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const isExportingRef = useRef(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const hasContent = useMemo(() => content.trim().length > 0, [content]);

  const clearError = useCallback(() => {
    setExportState(prev => ({ ...prev, error: null }));
  }, []);

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      if (isExportingRef.current || !hasContent) return;

      isExportingRef.current = true;

      if (mountedRef.current) {
        setExportState({
          isExporting: true,
          format,
          error: null,
        });
      }

      try {
        const filename = `${lessonTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;

        if (format === 'pdf') {
          await exportToPDF({
            content,
            courseTitle,
            lessonTitle,
            filename,
          });
        } else if (format === 'docx') {
          await exportToDOCX({
            content,
            courseTitle,
            lessonTitle,
            filename,
          });
        }

        logger.info('Export completed successfully', { format, filename });
        
        onSuccessRef.current?.(format);

        if (mountedRef.current) {
          setExportState(IDLE_STATE);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMessage = error.message || 'Export failed';

        logger.error('Export failed', error, { format });

        if (mountedRef.current) {
          setExportState({ ...IDLE_STATE, error: errorMessage });
        }

        onErrorRef.current?.(error, format);
      } finally {
        isExportingRef.current = false;
      }
    },
    [content, courseTitle, lessonTitle, hasContent]
    // onSuccess/onError intentionally omitted — accessed via stable refs above
  );

  return {
    exportState,
    exportAs,
    clearError,
    isExporting: exportState.isExporting,
  };
}
