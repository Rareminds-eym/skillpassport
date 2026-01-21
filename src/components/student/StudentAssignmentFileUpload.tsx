import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import NotificationModal from '../ui/NotificationModal';

interface StudentFileUploadProps {
  onFilesSelected?: (files: File[]) => void; // For staged files
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface StagedFile {
  file: File;
  id: string;
}

const StudentAssignmentFileUpload = React.forwardRef<
  { getStagedFiles: () => File[]; clearStagedFiles: () => void },
  StudentFileUploadProps
>(
  (
    {
      onFilesSelected,
      maxFiles = 3,
      acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'],
      className = '',
    },
    ref
  ) => {
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);

    // Notification modal state
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({
      type: 'info' as const,
      title: '',
      message: '',
    });

    const showNotificationModal = (
      type: 'error' | 'success' | 'warning' | 'info',
      title: string,
      message: string
    ) => {
      // @ts-expect-error - Auto-suppressed for migration
      setNotification({ type, title, message });
      setShowNotification(true);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    }, []);

    const validateFile = (file: File): string | null => {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        return `File type ${fileExtension} is not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return `File ${file.name} is too large. Maximum size is 10MB.`;
      }

      return null;
    };

    const handleFiles = (files: File[]) => {
      // Validate files
      const validFiles: File[] = [];
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          showNotificationModal('error', 'Invalid File', error);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Check max files limit
      const totalFiles = stagedFiles.length + validFiles.length;
      if (totalFiles > maxFiles) {
        const remaining = maxFiles - stagedFiles.length;
        showNotificationModal(
          'warning',
          'File Limit Exceeded',
          `Maximum ${maxFiles} files allowed. You can upload ${Math.max(0, remaining)} more files.`
        );
        return;
      }

      // Stage files for later upload
      const newStagedFiles: StagedFile[] = validFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
      }));

      setStagedFiles((prev) => [...prev, ...newStagedFiles]);
      onFilesSelected?.(validFiles);
    };

    const removeStagedFile = (fileId: string) => {
      setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Expose functions to parent component via ref
    React.useImperativeHandle(
      ref,
      () => ({
        getStagedFiles: () => stagedFiles.map((sf) => sf.file),
        clearStagedFiles: () => setStagedFiles([]),
      }),
      [stagedFiles]
    );

    return (
      <div className={className}>
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('student-file-upload-input')?.click()}
        >
          <DocumentArrowUpIcon className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-blue-700 mb-1">Upload your assignment files</h3>
          <p className="text-xs text-gray-500 mb-2">Drag and drop files here, or click to browse</p>
          <p className="text-xs text-gray-400">
            {acceptedTypes.join(', ')} • Max {maxFiles} files • 10MB each
          </p>

          <input
            id="student-file-upload-input"
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
        </div>

        {/* Staged Files */}
        {stagedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Files Ready to Submit ({stagedFiles.length}/{maxFiles})
            </h4>

            {stagedFiles.map((stagedFile) => (
              <div
                key={stagedFile.id}
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <PaperClipIcon className="h-5 w-5 text-blue-600" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {stagedFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(stagedFile.file.size)}</span>
                    <span className="text-blue-600">• Ready to submit</span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStagedFile(stagedFile.id);
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
                  title="Remove file"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              <strong>Note:</strong> These files will be uploaded when you submit the assignment.
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={showNotification}
          onClose={() => setShowNotification(false)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      </div>
    );
  }
);

StudentAssignmentFileUpload.displayName = 'StudentAssignmentFileUpload';

export default StudentAssignmentFileUpload;
