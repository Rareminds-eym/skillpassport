import React, { useState, useEffect } from "react";
import {
  BellIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  DocumentIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { circularsService, Circular, CreateCircularData, CircularsFilters } from "../../../services/circularsService";
import { uploadFile, validateFile, getDocumentUrl, deleteFile } from "../../../services/fileUploadService";
import { ConfirmModal } from "../../../components/shared/ConfirmModal";





const CircularsManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high" | "urgent">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    urgent_priority: 0,
  });





  const [formData, setFormData] = useState<{
    title: string;
    audience: 'all' | 'students' | 'faculty' | 'staff';
    priority: "low" | "medium" | "high" | "urgent";
    content: string;
    publish_date: string;
    expire_date: string;
    attachment_url: string;
    attachment_filename: string;
    attachment_file_size: number;
    status: "draft" | "published" | "archived";
  }>({
    title: "",
    audience: "all",
    priority: "medium",
    content: "",
    publish_date: "",
    expire_date: "",
    attachment_url: "",
    attachment_filename: "",
    attachment_file_size: 0,
    status: "draft",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // File upload states
  const [attachmentMode, setAttachmentMode] = useState<'url' | 'upload'>('url');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    url: string;
  } | null>(null);
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);
  const [deleteContext, setDeleteContext] = useState<{
    title: string;
    message: string;
    confirmText: string;
  }>({
    title: "Delete File",
    message: "Are you sure you want to delete this file?",
    confirmText: "Delete File"
  });

  // Load circulars on component mount and when filters change
  useEffect(() => {
    loadCirculars();
    loadStats();
  }, []);

  useEffect(() => {
    loadCirculars();
  }, [searchTerm, filterStatus, filterPriority]);

  // Real-time validation when form data changes
  useEffect(() => {
    if (showCreateModal && (formData.title || formData.content || formData.publish_date || formData.expire_date)) {
      validateForm();
    }
  }, [formData.title, formData.content, formData.publish_date, formData.expire_date, showCreateModal]);

  // Load circulars from database
  const loadCirculars = async () => {
    setLoading(true);
    setError(null);
    
    const filters: CircularsFilters = {
      status: filterStatus,
      priority: filterPriority,
      search: searchTerm || undefined,
    };

    const { data, error } = await circularsService.getCirculars(filters);
    
    if (error) {
      setError('Failed to load circulars');
      console.error('Error loading circulars:', error);
    } else {
      setCirculars(data || []);
    }
    
    setLoading(false);
  };

  // Load statistics
  const loadStats = async () => {
    const { data, error } = await circularsService.getCircularsStats();
    
    if (error) {
      console.error('Error loading stats:', error);
    } else if (data) {
      setStats(data);
    }
  };

  // Helper functions
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!formData.content.trim()) {
      errors.content = "Content is required";
    }
    
    if (!formData.publish_date) {
      errors.publish_date = "Publish date is required";
    }
    
    // Date validation - prevent past dates
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (formData.publish_date && formData.publish_date < currentDate) {
      errors.publish_date = "Publish date cannot be in the past";
    }
    
    if (formData.expire_date) {
      if (formData.expire_date < currentDate) {
        errors.expire_date = "Expiry date cannot be in the past";
      }
      
      if (formData.publish_date && formData.expire_date <= formData.publish_date) {
        errors.expire_date = "Expiry date must be after publish date";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCircular = async () => {
    if (validateForm()) {
      setLoading(true);
      
      const circularData: CreateCircularData = {
        title: formData.title,
        content: formData.content,
        audience: formData.audience,
        priority: formData.priority,
        publish_date: formData.publish_date,
        expire_date: formData.expire_date || undefined,
        attachment_url: formData.attachment_url || undefined,
        attachment_filename: formData.attachment_filename || undefined,
        attachment_file_size: formData.attachment_file_size || undefined,
        status: formData.status,
      };
      
      if (selectedCircular) {
        // Update existing circular
        const { error } = await circularsService.updateCircular({
          id: selectedCircular.id,
          ...circularData,
        });
        
        if (error) {
          setError('Failed to update circular');
          console.error('Error updating circular:', error);
        } else {
          await loadCirculars();
          await loadStats();
          setShowCreateModal(false);
          resetForm();
        }
      } else {
        // Create new circular
        const { error } = await circularsService.createCircular(circularData);
        
        if (error) {
          setError('Failed to create circular');
          console.error('Error creating circular:', error);
        } else {
          await loadCirculars();
          await loadStats();
          setShowCreateModal(false);
          resetForm();
        }
      }
      
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      audience: "all",
      priority: "medium",
      content: "",
      publish_date: "",
      expire_date: "",
      attachment_url: "",
      attachment_filename: "",
      attachment_file_size: 0,
      status: "draft",
    });
    setFormErrors({});
    setSelectedCircular(null);
    setAttachmentMode('url');
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    setLoading(true);
    
    const { error } = await circularsService.toggleCircularStatus(id, currentStatus);
    
    if (error) {
      setError('Failed to update circular status');
      console.error('Error toggling status:', error);
    } else {
      await loadCirculars();
      await loadStats();
    }
    
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const circularToDelete = circulars.find(c => c.id === id);
    const hasAttachment = circularToDelete?.attachment_url && 
      (circularToDelete.attachment_url.includes('.r2.dev') || circularToDelete.attachment_url.includes('r2.cloudflarestorage.com'));
    
    // Set up confirmation context for circular deletion
    setDeleteContext({
      title: "Delete Circular",
      message: hasAttachment 
        ? `Are you sure you want to delete the circular "${circularToDelete?.title}"? This action will permanently remove the circular and any attached files.`
        : `Are you sure you want to delete the circular "${circularToDelete?.title}"? This action cannot be undone.`,
      confirmText: "Delete Circular"
    });
    
    setPendingDeleteAction(() => async () => {
      setLoading(true);
      
      try {
        // If there's an attachment URL and it's an uploaded file (R2), delete it first
        if (hasAttachment && circularToDelete?.attachment_url) {
          console.log('Deleting associated file:', circularToDelete.attachment_url);
          
          const fileDeleteResult = await deleteFile(circularToDelete.attachment_url);
          if (!fileDeleteResult) {
            console.warn('Failed to delete associated file, but continuing with circular deletion');
          } else {
            console.log('Successfully deleted associated file');
          }
        }
        
        // Now delete the circular from database
        const { error } = await circularsService.deleteCircular(id);
        
        if (error) {
          setError('Failed to delete circular');
          console.error('Error deleting circular:', error);
        } else {
          await loadCirculars();
          await loadStats();
        }
      } catch (error) {
        console.error('Error in delete process:', error);
        setError('Failed to delete circular and associated files');
      }
      
      setLoading(false);
    });
    
    setShowDeleteConfirm(true);
  };

  const handleEdit = (circular: Circular) => {
    setSelectedCircular(circular);
    setFormData({
      title: circular.title,
      audience: circular.audience,
      priority: circular.priority,
      content: circular.content,
      publish_date: circular.publish_date,
      expire_date: circular.expire_date || "",
      attachment_url: circular.attachment_url || "",
      attachment_filename: circular.attachment_filename || "",
      attachment_file_size: circular.attachment_file_size || 0,
      status: circular.status,
    });
    
    // Set attachment mode and file info based on existing data
    if (circular.attachment_url) {
      // Check if it's an uploaded file (R2) or external URL
      if (circular.attachment_url.includes('.r2.dev') || circular.attachment_url.includes('r2.cloudflarestorage.com')) {
        // It's an uploaded file - set upload mode and create file info
        setAttachmentMode('upload');
        
        // Use stored filename if available, otherwise extract from URL
        let filename = circular.attachment_filename || 'uploaded-file';
        if (!filename || filename === '') {
          // Fallback to URL extraction
          const urlParts = circular.attachment_url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          
          if (lastPart && lastPart.includes('.')) {
            filename = lastPart;
          } else {
            for (let i = urlParts.length - 1; i >= 0; i--) {
              if (urlParts[i] && urlParts[i].includes('.')) {
                filename = urlParts[i];
                break;
              }
            }
          }
          
          // Clean up filename (remove timestamp prefixes if present)
          filename = filename.replace(/^\d+_[a-z0-9]+\./, '');
          if (!filename || filename === '') {
            filename = 'uploaded-file';
          }
        }
        
        setUploadedFile({
          name: filename,
          size: circular.attachment_file_size || 0,
          url: circular.attachment_url
        });
      } else {
        // It's an external URL - set URL mode
        setAttachmentMode('url');
        setUploadedFile(null);
      }
    } else {
      // No attachment - default to URL mode
      setAttachmentMode('url');
      setUploadedFile(null);
    }
    
    setShowCreateModal(true);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, {
      maxSize: 10, // 10MB
      allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt']
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // If we're editing and there's an existing uploaded file, delete it first
      const oldAttachmentUrl = selectedCircular?.attachment_url || formData.attachment_url;
      if (oldAttachmentUrl && (oldAttachmentUrl.includes('.r2.dev') || oldAttachmentUrl.includes('r2.cloudflarestorage.com'))) {
        console.log('Deleting old file before uploading new one:', oldAttachmentUrl);
        const deleteResult = await deleteFile(oldAttachmentUrl);
        if (deleteResult) {
          console.log('Successfully deleted old file');
        } else {
          console.warn('Failed to delete old file, but continuing with new upload');
        }
      }

      const result = await uploadFile(
        file,
        'circulars', // folder for circular attachments
        (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success && result.url) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          url: result.url
        });
        setFormData(prev => ({ 
          ...prev, 
          attachment_url: result.url || "",
          attachment_filename: file.name,
          attachment_file_size: file.size
        }));
      } else {
        alert(`Failed to upload file: ${result.error}`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      // Reset input
      e.target.value = "";
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    // Show confirmation modal before deleting
    const filename = uploadedFile?.name || 'this file';
    
    setDeleteContext({
      title: "Delete File",
      message: `Are you sure you want to delete "${filename}"? This action cannot be undone and the file will be permanently removed from storage.`,
      confirmText: "Delete File"
    });
    
    setPendingDeleteAction(() => async () => {
      // If there's an uploaded file URL, delete it from R2
      const fileUrl = uploadedFile?.url || formData.attachment_url;
      if (fileUrl && (fileUrl.includes('.r2.dev') || fileUrl.includes('r2.cloudflarestorage.com'))) {
        try {
          console.log('Deleting file from R2:', fileUrl);
          const deleteResult = await deleteFile(fileUrl);
          if (deleteResult) {
            console.log('Successfully deleted file from R2');
          } else {
            console.warn('Failed to delete file from R2');
          }
        } catch (error) {
          console.error('Error deleting file from R2:', error);
        }
      }
      
      setUploadedFile(null);
      setFormData(prev => ({ 
        ...prev, 
        attachment_url: "",
        attachment_filename: "",
        attachment_file_size: 0
      }));
    });
    setShowDeleteConfirm(true);
  };

  // Handle confirmation modal actions
  const handleConfirmDelete = () => {
    if (pendingDeleteAction) {
      pendingDeleteAction();
      setPendingDeleteAction(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setPendingDeleteAction(null);
    setShowDeleteConfirm(false);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get proper attachment URL (use document access for uploaded files, direct URL for external links)
  const getAttachmentUrl = (url: string): string => {
    // If it's an uploaded file (contains R2 domain patterns), use document access proxy
    if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
      return getDocumentUrl(url, 'inline');
    }
    // Otherwise, it's an external URL, use it directly
    return url;
  };









  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Circulars Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage institutional circulars and notices
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">{stats.published}</div>
            <div className="text-xs text-gray-600">Published</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-xs text-gray-600">Drafts</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-600">{stats.urgent_priority}</div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
              {/* Circulars Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Circulars Management</h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Create Circular
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search circulars..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Circulars List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading circulars...</p>
                  </div>
                ) : circulars.length > 0 ? (
                  circulars.map((circular) => (
                    <div
                      key={circular.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{circular.title}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                circular.priority === "urgent"
                                  ? "bg-red-100 text-red-700"
                                  : circular.priority === "high"
                                  ? "bg-orange-100 text-orange-700"
                                  : circular.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {circular.priority}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                circular.status === "published"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {circular.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <UserGroupIcon className="inline h-4 w-4 mr-1" />
                            Audience: {circular.audience}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            <CalendarIcon className="inline h-4 w-4 mr-1" />
                            Published: {circular.publish_date} 
                            {circular.expire_date && ` • Expires: ${circular.expire_date}`}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            Created by: {circular.creator_name || 'College Admin'}
                          </p>
                          {circular.attachment_url && (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-blue-600">
                                <PaperClipIcon className="inline h-4 w-4 mr-1" />
                                Attachment available
                              </p>
                              <a
                                href={getAttachmentUrl(circular.attachment_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                title="View attachment"
                              >
                                <EyeIcon className="h-3 w-3" />
                                View
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCircular(circular);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleEdit(circular)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handlePublishToggle(circular.id, circular.status)}
                            className={`p-2 rounded ${
                              circular.status === "published"
                                ? "text-yellow-600 hover:bg-yellow-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={circular.status === "published" ? "Unpublish" : "Publish"}
                            disabled={loading}
                          >
                            {circular.status === "published" ? (
                              <ClockIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleDelete(circular.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                            disabled={loading}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No circulars found</p>
                    <p className="text-sm">Create your first circular to get started.</p>
                  </div>
                )}
              </div>
        </div>
      </div>

      {/* Create/Edit Circular Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCircular ? "Edit Circular" : "Create New Circular"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCircular(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter circular title"
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience *
                </label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({...formData, audience: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.status === "published"
                        ? "bg-green-100 text-green-700"
                        : formData.status === "archived"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {formData.status === "published" ? "Published" : 
                     formData.status === "archived" ? "Archived" : "Draft"}
                  </span>
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Draft:</span> Save for later editing • 
                  <span className="font-medium"> Published:</span> Visible to audience • 
                  <span className="font-medium"> Archived:</span> Hidden from view
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.content ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter the circular content..."
                />
                {formErrors.content && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.content}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    value={formData.publish_date}
                    min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                    onChange={(e) => setFormData({...formData, publish_date: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.publish_date ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {formErrors.publish_date && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.publish_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expire_date}
                    min={formData.publish_date || new Date().toISOString().split('T')[0]} // Min is publish date or current date
                    onChange={(e) => setFormData({...formData, expire_date: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.expire_date ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {formErrors.expire_date && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.expire_date}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. Leave empty for no expiry date.
                  </p>
                </div>
              </div>

              {/* Validation Errors Display */}
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Please fix the following errors:
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {Object.entries(formErrors).map(([field, error]) => (
                            <li key={field}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Attachment
                </label>
                
                {/* Attachment Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      // If switching from upload mode and there's an uploaded file, ask for confirmation
                      if (attachmentMode === 'upload' && uploadedFile?.url) {
                        setDeleteContext({
                          title: "Switch to URL Mode",
                          message: `Switching to URL mode will permanently delete the uploaded file "${uploadedFile.name}". Are you sure you want to continue?`,
                          confirmText: "Switch Mode"
                        });
                        
                        setPendingDeleteAction(() => async () => {
                          // Delete the uploaded file from R2
                          if (uploadedFile.url.includes('.r2.dev') || uploadedFile.url.includes('r2.cloudflarestorage.com')) {
                            try {
                              await deleteFile(uploadedFile.url);
                              console.log('Deleted file when switching to URL mode');
                            } catch (error) {
                              console.error('Failed to delete file when switching modes:', error);
                            }
                          }
                          
                          setAttachmentMode('url');
                          setUploadedFile(null);
                          setFormData(prev => ({ 
                            ...prev, 
                            attachment_url: "",
                            attachment_filename: "",
                            attachment_file_size: 0
                          }));
                        });
                        setShowDeleteConfirm(true);
                        return;
                      }
                      
                      setAttachmentMode('url');
                      setUploadedFile(null);
                      setFormData(prev => ({ 
                        ...prev, 
                        attachment_url: "",
                        attachment_filename: "",
                        attachment_file_size: 0
                      }));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      attachmentMode === 'url'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    URL Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentMode('upload');
                      setFormData(prev => ({ 
                        ...prev, 
                        attachment_url: "",
                        attachment_filename: "",
                        attachment_file_size: 0
                      }));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      attachmentMode === 'upload'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    Upload File
                  </button>
                </div>

                {/* URL Input Mode */}
                {attachmentMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formData.attachment_url}
                      onChange={(e) => setFormData({...formData, attachment_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/document.pdf"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a URL to an external document or file</p>
                  </div>
                )}

                {/* File Upload Mode */}
                {attachmentMode === 'upload' && (
                  <div>
                    {!uploadedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                        <div className="flex flex-col items-center">
                          {uploadingFile ? (
                            <>
                              <ArrowPathIcon className="h-8 w-8 text-blue-600 mb-2 animate-spin" />
                              <span className="text-sm text-blue-600 mb-1">Uploading file...</span>
                              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{uploadProgress}% complete</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</span>
                              <span className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max 10MB)</span>
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploadingFile}
                                className="hidden"
                                id="circular-file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                              />
                              <label
                                htmlFor="circular-file-upload"
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium transition-colors"
                              >
                                Choose File
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <DocumentIcon className="h-5 w-5 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {uploadedFile.size > 0 ? formatFileSize(uploadedFile.size) + ' • ' : ''}
                            Uploaded successfully
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(getAttachmentUrl(uploadedFile.url), '_blank')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View file"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove file"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a file that will be stored securely and accessible to your audience
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCircular(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading || uploadingFile}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCircular}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  loading || uploadingFile || Object.keys(formErrors).length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={loading || uploadingFile || Object.keys(formErrors).length > 0}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="inline h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : uploadingFile ? (
                  <>
                    <ArrowPathIcon className="inline h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  selectedCircular 
                    ? `Update Circular (${formData.status === 'published' ? 'Publish' : formData.status === 'archived' ? 'Archive' : 'Save as Draft'})`
                    : `Create Circular (${formData.status === 'published' ? 'Publish' : formData.status === 'archived' ? 'Archive' : 'Save as Draft'})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Circular Modal */}
      {showViewModal && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">View Circular</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCircular(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 text-xl mb-2">{selectedCircular.title}</h4>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCircular.priority === "urgent"
                        ? "bg-red-100 text-red-700"
                        : selectedCircular.priority === "high"
                        ? "bg-orange-100 text-orange-700"
                        : selectedCircular.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedCircular.priority} priority
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCircular.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedCircular.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Audience:</span>
                  <p className="text-gray-600">{selectedCircular.audience}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-600">{selectedCircular.creator_name || 'College Admin'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Publish Date:</span>
                  <p className="text-gray-600">{selectedCircular.publish_date}</p>
                </div>
                {selectedCircular.expire_date && (
                  <div>
                    <span className="font-medium text-gray-700">Expiry Date:</span>
                    <p className="text-gray-600">{selectedCircular.expire_date}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="font-medium text-gray-700">Content:</span>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{selectedCircular.content}</p>
              </div>

              {selectedCircular.attachment_url && (
                <div>
                  <span className="font-medium text-gray-700">Attachment:</span>
                  <div className="mt-2">
                    <a
                      href={getAttachmentUrl(selectedCircular.attachment_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      <PaperClipIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">View Attachment</span>
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {selectedCircular.created_at && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created: {new Date(selectedCircular.created_at).toLocaleString()}
                  {selectedCircular.updated_at && selectedCircular.updated_at !== selectedCircular.created_at && (
                    <span> • Updated: {new Date(selectedCircular.updated_at).toLocaleString()}</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCircular(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={deleteContext.title}
        message={deleteContext.message}
        confirmText={deleteContext.confirmText}
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CircularsManagement;
