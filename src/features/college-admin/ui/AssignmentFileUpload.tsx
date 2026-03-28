import React, { useState, useCallback, useEffect } from 'react';
import { 
  DocumentArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { uploadInstructionFile, deleteInstructionFile } from '@/features/educator-copilot/api/assignmentsService';
import { useUser } from '@/entities/user';
import { getPagesApiUrl } from '@/shared/lib/pagesUrl';
import { supabase } from '@/shared/api/supabase';
import { ConfirmationModal, NotificationModal } from '@/shared/ui';
import { validateFileSize, getValidationErrorMessage } from '@/shared/lib/fileValidation';
import { getFileSizeLimit } from '@/shared/config/fileSizeLimits';

interface FileUploadProps {
  assignmentId?: string;
  existingFiles?: any[];
  onFilesSelected?: (files: File[]) => void;
  onFilesUploaded?: (uploadResults: any[]) => void;
  onFileDeleted?: (fileId: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  mode?: 'create' | 'edit' | 'staged';
  ref?: React.Ref<{ uploadStagedFiles: (assignmentId: string) => Promise<any[]> }>;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

const AssignmentFileUpload = React.forwardRef<
  { uploadStagedFiles: (assignmentId: string) => Promise<any[]> },
  FileUploadProps
>(({
  assignmentId,
  existingFiles = [],
  onFilesSelected,
  onFilesUploaded,
  onFileDeleted,
  maxFiles = 5,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  className = '',
  mode = 'create'
}, ref) => {
  const user = useUser();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [existingFilesList, setExistingFilesList] = useState<any[]>(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: 'info' as const, title: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setExistingFilesList(existingFiles);
    setForceUpdate(prev => prev + 1);
  }, [existingFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    const sizeValidation = validateFileSize(file, { context: 'assignment' });
    if (!sizeValidation.valid) {
      return getValidationErrorMessage(sizeValidation);
    }

    return null;
  };

  const showNotificationModal = (type: 'error' | 'success' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ type, title, message });
    setShowNotification(true);
  };

  const handleFiles = async (files: File[]) => {
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

    const totalFiles = uploadedFiles.length + existingFilesList.length + stagedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      const remaining = maxFiles - uploadedFiles.length - existingFilesList.length - stagedFiles.length;
      showNotificationModal('warning', 'File Limit Exceeded', `Maximum ${maxFiles} files allowed. You can upload ${Math.max(0, remaining)} more files.`);
      return;
    }

    setStagedFiles(prev => [...prev, ...validFiles]);
    onFilesSelected?.(validFiles);
  };

  const handleDeleteExistingFile = async (file: any) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || user?.access_token;
    
    if (!token) {
      showNotificationModal('error', 'Authentication Error', 'Authentication required to delete files');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteInstructionFile(fileToDelete.attachment_id, token);
      
      setExistingFilesList(prev => {
        const newList = prev.filter(f => f.attachment_id !== fileToDelete.attachment_id);
        setTimeout(() => setForceUpdate(prev => prev + 1), 0);
        return newList;
      });
      
      if (onFileDeleted) {
        onFileDeleted(fileToDelete.attachment_id);
      }

      showNotificationModal('success', 'File Deleted', 'File has been successfully deleted.');
      
    } catch (error: any) {
      showNotificationModal('error', 'Delete Failed', error?.message || 'Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setFileToDelete(null);
    }
  };

  const removeStagedFile = (fileToRemove: File) => {
    setStagedFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const uploadStagedFiles = async (newAssignmentId: string) => {
    if (stagedFiles.length === 0) return [];
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || user?.access_token;
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const uploadResults: any[] = [];
    const filesToUpload: UploadedFile[] = stagedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(filesToUpload);

    for (let i = 0; i < filesToUpload.length; i++) {
      const uploadedFile = filesToUpload[i];
      
      try {
        setUploadedFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'uploading', progress: 10 }
            : f
        ));

        const result = await uploadInstructionFile(
          newAssignmentId, 
          uploadedFile.file, 
          token
        );

        setUploadedFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'success', progress: 100, result }
            : f
        ));

        uploadResults.push(result);

      } catch (error: any) {
        setUploadedFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'error', progress: 0, error: error?.message || 'Upload failed' }
            : f
        ));
        
        throw error;
      }
    }

    setStagedFiles([]);
    
    if (uploadResults.length > 0) {
      onFilesUploaded?.(uploadResults);
    }

    return uploadResults;
  };

  React.useImperativeHandle(ref, () => ({
    uploadStagedFiles
  }), [stagedFiles, user?.access_token]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      default:
        return <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <DocumentArrowUpIcon className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-emerald-700 mb-1">
          {existingFilesList.length > 0 ? 'Upload additional files' : 'Upload instruction files'}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400">
          {acceptedTypes.join(', ')} • Max {maxFiles} files total • {getFileSizeLimit('assignment').displaySize} each
        </p>
        
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
      </div>

      {existingFilesList.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Current Files ({existingFilesList.length})
          </h4>
          
          {existingFilesList.map((file) => (
            <div 
              key={`existing-${file.attachment_id}-${forceUpdate}`} 
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <CheckCircleIcon className="h-5 w-5 text-blue-500" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(file.file_size || 0)}</span>
                  <span className="text-blue-500">• Uploaded</span>
                </div>
              </div>

              {file.file_url && (
                <a
                  href={file.file_url.includes('/document-access') 
                    ? file.file_url 
                    : `${getPagesApiUrl('storage')}/document-access?url=${encodeURIComponent(file.file_url)}&mode=inline`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
                  title="View file"
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                </a>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExistingFile(file);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors text-red-500"
                title="Delete file"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {stagedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Files Ready to Upload ({stagedFiles.length})
          </h4>
          
          {stagedFiles.map((file, index) => (
            <div 
              key={`staged-${index}`} 
              className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <DocumentArrowUpIcon className="h-5 w-5 text-yellow-600" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span className="text-yellow-600">• Ready to upload</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStagedFile(file);
                }}
                className="p-1 hover:bg-yellow-100 rounded transition-colors text-yellow-600"
                title="Remove file"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
            <strong>Note:</strong> These files will be uploaded when you {existingFilesList.length > 0 ? 'update' : 'save'} the assignment.
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            New Files ({uploadedFiles.length}/{maxFiles - existingFilesList.length})
          </h4>
          
          {uploadedFiles.map((uploadedFile, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {getStatusIcon(uploadedFile.status)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(uploadedFile.file.size)}</span>
                  {uploadedFile.status === 'uploading' && (
                    <span>• Uploading {uploadedFile.progress}%</span>
                  )}
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <span className="text-red-500">• {uploadedFile.error}</span>
                  )}
                  {uploadedFile.status === 'success' && (
                    <span className="text-green-500">• Uploaded successfully</span>
                  )}
                </div>
                
                {uploadedFile.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadedFile.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(uploadedFile.file);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                disabled={uploadedFile.status === 'uploading'}
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDeleteFile}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.file_name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
      
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
});

AssignmentFileUpload.displayName = 'AssignmentFileUpload';

export default AssignmentFileUpload;
