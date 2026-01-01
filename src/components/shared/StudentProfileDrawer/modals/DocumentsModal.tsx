// import React, { useState, useEffect } from 'react';
// import { XMarkIcon, DocumentIcon, EyeIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
// import { getStudentDocuments, getStudentDocumentUrl } from '../../../../services/studentDocumentService';

// interface Document {
//   url: string;
//   name: string;
//   type: 'resume' | 'certificate' | 'transcript' | 'id_proof' | 'other';
//   uploadedAt: string;
//   size: number;
// }

// interface DocumentsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   student: any;
// }

// const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose, student }) => {
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
//   const [downloading, setDownloading] = useState<string | null>(null);
//   const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

//   useEffect(() => {
//     if (isOpen && student?.id) {
//       loadDocuments();
//     }
//   }, [isOpen, student?.id]);

//   const loadDocuments = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const docs = await getStudentDocuments(student.id);
//       setDocuments(docs);
//       if (docs.length > 0) {
//         setSelectedDocument(docs[0]);
//       }
//     } catch (err) {
//       setError('Failed to load documents');
//       console.error('Error loading documents:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDocument = (document: Document) => {
//     const viewUrl = getStudentDocumentUrl(document.url, 'inline');
//     window.open(viewUrl, '_blank');
//   };

//   const handleDownloadDocument = (document: Document) => {
//     try {
//       console.log('Downloading document:', document.name);
//       const downloadUrl = getStudentDocumentUrl(document.url, 'download');
//       console.log('Download URL:', downloadUrl);
      
//       const link = document.createElement('a');
//       link.href = downloadUrl;
//       link.download = document.name;
//       link.target = '_blank'; // Add target blank as fallback
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       console.log('Download initiated for:', document.name);
//     } catch (error) {
//       console.error('Download failed:', error);
//       // Fallback: open in new tab if download fails
//       const viewUrl = getStudentDocumentUrl(document.url, 'inline');
//       window.open(viewUrl, '_blank');
//     }
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const formatDate = (dateString: string): string => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getDocumentTypeConfig = (type: string) => {
//     const typeConfig = {
//       resume: { 
//         icon: '📄', 
//         label: 'Resume/CV', 
//         color: 'text-blue-600',
//         bgColor: 'bg-blue-50',
//         borderColor: 'border-blue-200'
//       },
//       certificate: { 
//         icon: '🏆', 
//         label: 'Certificate', 
//         color: 'text-yellow-600',
//         bgColor: 'bg-yellow-50',
//         borderColor: 'border-yellow-200'
//       },
//       transcript: { 
//         icon: '📊', 
//         label: 'Transcript', 
//         color: 'text-green-600',
//         bgColor: 'bg-green-50',
//         borderColor: 'border-green-200'
//       },
//       id_proof: { 
//         icon: '🆔', 
//         label: 'ID Proof', 
//         color: 'text-purple-600',
//         bgColor: 'bg-purple-50',
//         borderColor: 'border-purple-200'
//       },
//       other: { 
//         icon: '📎', 
//         label: 'Other', 
//         color: 'text-gray-600',
//         bgColor: 'bg-gray-50',
//         borderColor: 'border-gray-200'
//       }
//     };
//     return typeConfig[type] || typeConfig.other;
//   };

//   const groupDocumentsByType = (docs: Document[]) => {
//     const grouped = docs.reduce((acc, doc) => {
//       const type = doc.type;
//       if (!acc[type]) {
//         acc[type] = [];
//       }
//       acc[type].push(doc);
//       return acc;
//     }, {} as Record<string, Document[]>);
    
//     return grouped;
//   };

//   if (!isOpen) return null;

//   const groupedDocuments = groupDocumentsByType(documents);

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
//       <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

//         <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

//         <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
//           {/* Header */}
//           <div className="bg-white px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
//                   {student?.name} - Documents
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Teacher document viewer
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
//                 onClick={onClose}
//               >
//                 <span className="sr-only">Close</span>
//                 <XMarkIcon className="h-6 w-6" aria-hidden="true" />
//               </button>
//             </div>
//           </div>

//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
//               <span className="ml-2 text-gray-600">Loading documents...</span>
//             </div>
//           ) : error ? (
//             <div className="text-center py-20 px-6">
//               <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading documents</h3>
//               <p className="mt-1 text-sm text-gray-500">{error}</p>
//               <button
//                 onClick={loadDocuments}
//                 className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
//               >
//                 Try Again
//               </button>
//             </div>
//           ) : documents.length === 0 ? (
//             <div className="text-center py-20 px-6">
//               <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
//               <p className="mt-1 text-sm text-gray-500">This student hasn't uploaded any documents yet.</p>
//             </div>
//           ) : (
//             <div className="flex h-96">
//               {/* Left Panel - Document List */}
//               <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
//                 <div className="p-4">
//                   <h4 className="text-sm font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                  
//                   {Object.entries(groupedDocuments).map(([type, docs]) => {
//                     const typeConfig = getDocumentTypeConfig(type);
//                     return (
//                       <div key={type} className="mb-6">
//                         <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
//                           {typeConfig.label}
//                         </h5>
//                         <div className="space-y-2">
//                           {docs.map((doc, index) => (
//                             <div
//                               key={index}
//                               onClick={() => setSelectedDocument(doc)}
//                               className={`p-3 rounded-lg border cursor-pointer transition-all ${
//                                 selectedDocument?.url === doc.url
//                                   ? `${typeConfig.bgColor} ${typeConfig.borderColor} border-2`
//                                   : 'bg-white border-gray-200 hover:bg-gray-50'
//                               }`}
//                             >
//                               <div className="flex items-center space-x-3">
//                                 <div className="flex-shrink-0">
//                                   <DocumentIcon className={`h-5 w-5 ${typeConfig.color}`} />
//                                 </div>
//                                 <div className="flex-1 min-w-0">
//                                   <p className="text-sm font-medium text-gray-900 truncate">
//                                     {doc.name}
//                                   </p>
//                                   <p className="text-xs text-gray-500">
//                                     PDF Document
//                                   </p>
//                                 </div>
//                                 <div className="flex space-x-1">
//                                   <button
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       handleViewDocument(doc);
//                                     }}
//                                     className="p-1 text-blue-600 hover:bg-blue-50 rounded"
//                                     title="View document"
//                                   >
//                                     <EyeIcon className="h-4 w-4" />
//                                   </button>
//                                   <button
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       handleDownloadDocument(doc);
//                                     }}
//                                     className="p-1 text-gray-600 hover:bg-gray-50 rounded"
//                                     title="Download document"
//                                   >
//                                     <ArrowDownTrayIcon className="h-4 w-4" />
//                                   </button>
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Right Panel - Document Preview */}
//               <div className="w-1/2 bg-gray-50 flex flex-col">
//                 {selectedDocument ? (
//                   <>
//                     <div className="p-4 bg-white border-b border-gray-200">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <h4 className="text-sm font-medium text-gray-900">Document Preview</h4>
//                           <p className="text-xs text-gray-500 mt-1">{selectedDocument.name}</p>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="flex-1 flex items-center justify-center p-8">
//                       <div className="text-center w-full max-w-xs">
//                         {/* Blurred Document Preview */}
//                         <div className="relative w-32 h-40 bg-white border-2 border-gray-200 rounded-lg shadow-lg mx-auto mb-4 overflow-hidden">
//                           {/* Simulated document content with blur effect */}
//                           <div className="absolute inset-0 p-3">
//                             <div className="space-y-2">
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-3/4"></div>
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-2/3"></div>
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-4/5"></div>
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-1/2"></div>
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-3/4"></div>
//                               <div className="h-2 bg-gray-300 rounded w-full"></div>
//                               <div className="h-2 bg-gray-300 rounded w-2/3"></div>
//                             </div>
//                           </div>
                          
//                           {/* Blur overlay */}
//                           <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
                          
//                           {/* Document icon overlay */}
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <DocumentIcon className="h-8 w-8 text-blue-500" />
//                           </div>
//                         </div>
                        
//                         <p className="text-sm text-gray-600 mb-4">Document Preview</p>
                        
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => handleViewDocument(selectedDocument)}
//                             className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
//                           >
//                             <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
//                             Open Document
//                           </button>
                          
//                           <button
//                             onClick={() => handleDownloadDocument(selectedDocument)}
//                             className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
//                           >
//                             <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
//                             Download
//                           </button>
//                         </div>
                        
//                         <div className="mt-4 text-xs text-gray-500 space-y-1 bg-gray-100 rounded-md p-2">
//                           <p><span className="font-medium">Size:</span> {formatFileSize(selectedDocument.size)}</p>
//                           <p><span className="font-medium">Uploaded:</span> {formatDate(selectedDocument.uploadedAt)}</p>
//                           <p><span className="font-medium">Type:</span> {getDocumentTypeConfig(selectedDocument.type).label}</p>
//                         </div>
//                       </div>
//                     </div>
//                   </>
//                 ) : (
//                   <div className="flex-1 flex items-center justify-center">
//                     <div className="text-center text-gray-500">
//                       <DocumentIcon className="h-12 w-12 mx-auto mb-2" />
//                       <p className="text-sm">Select a document to preview</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DocumentsModal;
import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentIcon, EyeIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getStudentDocuments, getStudentDocumentUrl } from '../../../../services/studentDocumentService';

interface Document {
  url: string;
  name: string;
  type: 'resume' | 'certificate' | 'transcript' | 'id_proof' | 'other';
  uploadedAt: string;
  size: number;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose, student }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student?.id) {
      loadDocuments();
    }
  }, [isOpen, student?.id]);

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
      if (docs.length > 0) {
        setSelectedDocument(docs[0]);
      }
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
        icon: '📎', 
        label: 'Other', 
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

  if (!isOpen) return null;

  const groupedDocuments = groupDocumentsByType(documents);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {student?.name} - Documents
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Teacher document viewer
                </p>
              </div>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 px-6">
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
          ) : documents.length === 0 ? (
            <div className="text-center py-20 px-6">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">This student hasn't uploaded any documents yet.</p>
            </div>
          ) : (
            /* Document List - Full Width */
            <div className="overflow-y-auto max-h-96">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                
                {Object.entries(groupedDocuments).map(([type, docs]) => {
                  const typeConfig = getDocumentTypeConfig(type);
                  return (
                    <div key={type} className="mb-6">
                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {typeConfig.label}
                      </h5>
                      <div className="space-y-2">
                        {docs.map((doc, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <DocumentIcon className={`h-5 w-5 ${typeConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  PDF Document • {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleViewDocument(doc)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="View document"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadDocument(doc)}
                                  disabled={downloading === doc.url}
                                  className={`p-1 rounded ${
                                    downloading === doc.url
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : downloadSuccess === doc.url
                                      ? 'text-green-600 hover:bg-green-50'
                                      : downloadError === doc.url
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                  title="Download document"
                                >
                                  {downloading === doc.url ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                                  ) : downloadSuccess === doc.url ? (
                                    <CheckCircleIcon className="h-4 w-4" />
                                  ) : (
                                    <ArrowDownTrayIcon className="h-4 w-4" />
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
            </div>
          )}

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
      </div>
    </div>
  );
};

export default DocumentsModal;