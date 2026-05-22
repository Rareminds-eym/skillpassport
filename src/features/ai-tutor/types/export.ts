/**
 * Export format types
 */
export type ExportFormat = 'pdf' | 'docx';

/**
 * Base export options shared across all formats
 */
export interface BaseExportOptions {
  content: string;
  courseTitle: string;
  lessonTitle: string;
  filename: string;
}

/**
 * Export state for UI components
 */
export interface ExportState {
  isExporting: boolean;
  format: ExportFormat | null;
  error: string | null;
}

// ExportResult removed — exportToPDF and exportToDOCX return Promise<void>.
// Re-add if export functions are refactored to return result objects.

/**
 * Structured error info returned when an export fails.
 * Carries the format that failed alongside the error message.
 */
export interface ExportErrorInfo {
  message: string;
  format: ExportFormat;
}
