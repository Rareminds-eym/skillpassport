import React, { useState, useEffect } from 'react';
import { DocumentIcon, EyeIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getStudentDocuments, getStudentDocumentUrl } from '../../../../services/studentDocumentService';

interface Document {
  url: string;
  name: string;
  type: 'resume' | 'certificate' | 'transcript' | 'id_proof' | 'other';
  uploadedAt: string;
  size: number;
}

interface DocumentsTabProps {
  student: any;
  loading?: boolean;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ student, loading: externalLoading = false }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (student?.id) {
      loadDocuments();
    }
  }, [student?.id]);

  // Clear download success message after 3 seconds
  useEffect(() => {
    if (downloadSuccess) {
      const timer = setTimeout(() => {
        setDownloadSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [downloadSuccess]);

  // Clear download error message after 5 seconds
  useEffect(() => {
    if (downloadError) {
      const timer = setTimeout(() => {
        setDownloadError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [downloadError]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getStudentDocuments(student.id);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    const viewUrl = getStudentDocumentUrl(document.url, 'inline');
    window.open(viewUrl, '_blank');
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      setDownloading(document.url);
      setDownloadError(null);
      setDownloadSuccess(null);
      
      console.log('Downloading document:', document.name);
      const downloadUrl = getStudentDocumentUrl(document.url, 'download');
      console.log('Download URL:', downloadUrl);
      
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      console.log('Download initiated for:', document.name);
      
      // Set success state
      setDownloadSuccess(document.url);
      setDownloading(null);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(document.url);
      setDownloading(null);
      
      // Fallback: open in new tab if download fails
      const viewUrl = getStudentDocumentUrl(document.url, 'inline');
      window.open(viewUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentTypeConfig = (type: string) => {
    const typeConfig = {
      resume: { 
        icon: '📄', 
        label: 'Resume/CV', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      certificate: { 
        icon: '🏆', 
        label: 'Certificate', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      transcript: { 
        icon: '📊', 
        label: 'Transcript', 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      id_proof: { 
        icon: '🆔', 
        label: 'ID Proof', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      other: { 
        // label: 'Other', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    };
    return typeConfig[type] || typeConfig.other;
  };

  const groupDocumentsByType = (docs: Document[]) => {
    const grouped = docs.reduce((acc, doc) => {
      const type = doc.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
    
    return grouped;
  };

  if (loading || externalLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading documents</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadDocuments}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">This student hasn't uploaded any documents yet.</p>
        </div>
      </div>
    );
  }

  const groupedDocuments = groupDocumentsByType(documents);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Student Documents</h3>
        <p className="text-sm text-gray-500">View and download documents uploaded by the student</p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedDocuments).map(([type, docs]) => {
          const typeConfig = getDocumentTypeConfig(type);
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-3 ${typeConfig.bgColor} border-b ${typeConfig.borderColor}`}>
                <h4 className={`text-sm font-medium ${typeConfig.color} flex items-center`}>
                  <span className="mr-2">{typeConfig.icon}</span>
                  {typeConfig.label}
                  {/* <span className="ml-2 text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                    {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                  </span> */}
                </h4>
              </div>
              
              <div className="divide-y divide-gray-200">
                {docs.map((doc, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <DocumentIcon className={`h-6 w-6 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF Document • {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="View document"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </button>
                        
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          disabled={downloading === doc.url}
                          className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded transition-colors ${
                            downloading === doc.url
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : downloadSuccess === doc.url
                              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                          title="Download document"
                        >
                          {downloading === doc.url ? (
                            <>
                              <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full mr-1" />
                              Downloading...
                            </>
                          ) : downloadSuccess === doc.url ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Downloaded
                            </>
                          ) : (
                            <>
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Notifications */}
      {downloadSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center space-x-3 z-50">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Download started</p>
            <p className="text-xs text-green-700">Check your downloads folder</p>
          </div>
        </div>
      )}

      {downloadError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-center space-x-3 z-50">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-900">Download failed</p>
            <p className="text-xs text-red-700">Opening in new tab instead</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;