import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  LinkIcon,
  CloudArrowUpIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Resource, FileUpload } from '../../../types/educator/course';

interface ResourceUploadComponentProps {
  onResourcesAdded: (resources: Resource[]) => void;
  onClose: () => void;
  existingResources?: Resource[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = {
  pdf: ['.pdf'],
  document: ['.doc', '.docx', '.ppt', '.pptx', '.txt'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
};

const ResourceUploadComponent: React.FC<ResourceUploadComponentProps> = ({
  onResourcesAdded,
  onClose,
  existingResources = []
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkType, setLinkType] = useState<'link' | 'youtube' | 'drive'>('link');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (fileName: string): Resource['type'] => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (ALLOWED_FILE_TYPES.pdf.includes(ext)) return 'pdf';
    if (ALLOWED_FILE_TYPES.document.includes(ext)) return 'document';
    if (ALLOWED_FILE_TYPES.video.includes(ext)) return 'video';
    if (ALLOWED_FILE_TYPES.image.includes(ext)) return 'image';
    return 'document';
  };

  const getFileIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return DocumentIcon;
      case 'video':
        return VideoCameraIcon;
      case 'image':
        return PhotoIcon;
      default:
        return DocumentIcon;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`;
    }
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const allAllowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
    if (!allAllowedTypes.includes(ext)) {
      return 'File type not supported';
    }
    return null;
  };

  const simulateUpload = (fileUpload: FileUpload, index: number) => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFileUploads(prev =>
          prev.map((fu, i) =>
            i === index
              ? { ...fu, progress: 100, status: 'completed' }
              : fu
          )
        );
      } else {
        setFileUploads(prev =>
          prev.map((fu, i) =>
            i === index
              ? { ...fu, progress, status: 'uploading' }
              : fu
          )
        );
      }
    }, 500);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    const newUploads: FileUpload[] = [];

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      newUploads.push({
        file,
        progress: 0,
        status: 'pending'
      });
    });

    if (newUploads.length > 0) {
      const startIndex = fileUploads.length;
      setFileUploads([...fileUploads, ...newUploads]);

      // Start simulated uploads
      newUploads.forEach((upload, index) => {
        simulateUpload(upload, startIndex + index);
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFileUpload = (index: number) => {
    setFileUploads(prev => prev.filter((_, i) => i !== index));
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    let embedUrl: string | undefined;
    let finalType = linkType;

    if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
      finalType = 'youtube';
      embedUrl = getYouTubeEmbedUrl(linkUrl) || undefined;
    } else if (linkUrl.includes('drive.google.com')) {
      finalType = 'drive';
    }

    const newResource: Resource = {
      id: `resource-${Date.now()}`,
      name: linkName.trim() || linkUrl,
      type: finalType,
      url: linkUrl,
      embedUrl
    };

    onResourcesAdded([newResource]);
    setLinkUrl('');
    setLinkName('');
    onClose();
  };

  const handleSaveFiles = () => {
    const completedUploads = fileUploads.filter(fu => fu.status === 'completed');

    if (completedUploads.length === 0) {
      setError('Please wait for uploads to complete');
      return;
    }

    const newResources: Resource[] = completedUploads.map(fu => ({
      id: `resource-${Date.now()}-${Math.random()}`,
      name: fu.file.name,
      type: getFileType(fu.file.name),
      url: URL.createObjectURL(fu.file), // In production, this would be the uploaded file URL
      size: formatFileSize(fu.file.size)
    }));

    onResourcesAdded(newResources);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Resources</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMode === 'file'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
              Upload Files
            </button>
            <button
              onClick={() => setUploadMode('link')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMode === 'link'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <LinkIcon className="h-5 w-5 inline mr-2" />
              Add Link
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {uploadMode === 'file' ? (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Drag and drop files here
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept={Object.values(ALLOWED_FILE_TYPES).flat().join(',')}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Supported: PDF, DOC, DOCX, PPT, PPTX, MP4, Images (Max {formatFileSize(MAX_FILE_SIZE)})
                </p>
              </div>

              {/* Upload List */}
              {fileUploads.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Uploading Files</h3>
                  {fileUploads.map((upload, index) => {
                    const Icon = getFileIcon(getFileType(upload.file.name));
                    return (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {upload.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(upload.file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {upload.status === 'completed' && (
                              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                            )}
                            {upload.status === 'error' && (
                              <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                            )}
                            <button
                              onClick={() => removeFileUpload(index)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <TrashIcon className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        {upload.status !== 'completed' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLinkType('link')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      linkType === 'link'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <LinkIcon className="h-5 w-5 mx-auto mb-1" />
                    URL Link
                  </button>
                  <button
                    onClick={() => setLinkType('youtube')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      linkType === 'youtube'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <VideoCameraIcon className="h-5 w-5 mx-auto mb-1" />
                    YouTube
                  </button>
                  <button
                    onClick={() => setLinkType('drive')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      linkType === 'drive'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <CloudArrowUpIcon className="h-5 w-5 mx-auto mb-1" />
                    Google Drive
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Name (Optional)
                </label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Introduction Video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={
                    linkType === 'youtube'
                      ? 'https://youtube.com/watch?v=...'
                      : linkType === 'drive'
                      ? 'https://drive.google.com/...'
                      : 'https://example.com/resource'
                  }
                />
              </div>

              {linkType === 'youtube' && linkUrl && getYouTubeEmbedUrl(linkUrl) && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700 font-medium mb-2">Preview:</p>
                  <div className="aspect-video bg-black rounded overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(linkUrl) || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={uploadMode === 'file' ? handleSaveFiles : handleAddLink}
            disabled={
              uploadMode === 'file'
                ? fileUploads.filter(fu => fu.status === 'completed').length === 0
                : !linkUrl.trim()
            }
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploadMode === 'file' ? 'Add Files' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceUploadComponent;
