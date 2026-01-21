/**
 * Document Manager Component for Students
 * Allows students to upload, view, and manage their documents
 */

import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, Eye, Download, Plus } from 'lucide-react';
import {
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  getStudentDocumentUrl,
  validateStudentDocument,
} from '../../../services/studentDocumentService';

const DocumentManager = ({ studentId, className = '' }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const documentTypes = [
    { value: 'resume', label: 'Resume/CV', icon: '📄' },
    { value: 'certificate', label: 'Certificate', icon: '🏆' },
    { value: 'transcript', label: 'Transcript', icon: '📊' },
    { value: 'id_proof', label: 'ID Proof', icon: '🆔' },
    { value: 'other', label: 'Other', icon: '📎' },
  ];

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getStudentDocuments(studentId);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, documentType) => {
    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Validate file
      const validation = validateStudentDocument(file, documentType);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Upload document
      const result = await uploadStudentDocument(studentId, file, documentType);

      if (result.success) {
        setSuccess('Document uploaded successfully!');
        await loadDocuments(); // Refresh the list

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentUrl) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const success = await deleteStudentDocument(studentId, documentUrl);
      if (success) {
        setSuccess('Document deleted successfully!');
        await loadDocuments(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete document');
      }
    } catch (err) {
      setError('Failed to delete document');
      console.error('Delete error:', err);
    }
  };

  const handleViewDocument = (documentUrl) => {
    const viewUrl = getStudentDocumentUrl(documentUrl, 'inline');
    window.open(viewUrl, '_blank');
  };

  const handleDownloadDocument = (documentUrl, fileName) => {
    const downloadUrl = getStudentDocumentUrl(documentUrl, 'download');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocumentTypeInfo = (type) => {
    return documentTypes.find((dt) => dt.value === type) || documentTypes[4]; // Default to 'other'
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">My Documents</h3>
          <div className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Document
          </label>
          <div className="flex gap-3">
            <select
              id="documentType"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>
                Select document type
              </option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>

            <input
              type="file"
              id="documentFile"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files[0];
                const documentType = document.getElementById('documentType').value;

                if (file && documentType) {
                  handleFileUpload(file, documentType);
                  e.target.value = ''; // Reset input
                  document.getElementById('documentType').value = ''; // Reset select
                } else if (file && !documentType) {
                  setError('Please select a document type first');
                }
              }}
            />

            <button
              onClick={() => document.getElementById('documentFile').click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Upload your first document to get started</p>
            </div>
          ) : (
            documents.map((doc, index) => {
              const typeInfo = getDocumentTypeInfo(doc.type);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{typeInfo.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{typeInfo.label}</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(doc.url)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDownloadDocument(doc.url, doc.name)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDocument(doc.url)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
