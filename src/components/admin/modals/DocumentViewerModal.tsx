import React, { useState } from 'react';
import { X, FileText, Download, Eye, ExternalLink } from 'lucide-react';

interface Document {
  name: string;
  url: string;
  size?: number;
  type: string;
  uploadedAt?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: {
    degreeUrl?: string | null;
    idProofUrl?: string | null;
    experienceUrls?: string[] | null;
  };
  personName: string;
  personType: 'student' | 'teacher';
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  personName,
  personType
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  if (!isOpen) return null;

  // Convert document URLs to structured format
  const documentList: Array<{ category: string; docs: Document[] }> = [];

  // Add degree certificate
  if (documents.degreeUrl) {
    documentList.push({
      category: 'Degree Certificate',
      docs: [{
        name: 'Degree Certificate',
        url: documents.degreeUrl,
        type: 'application/pdf'
      }]
    });
  }

  // Add ID proof
  if (documents.idProofUrl) {
    documentList.push({
      category: 'ID Proof',
      docs: [{
        name: 'ID Proof',
        url: documents.idProofUrl,
        type: 'image/jpeg'
      }]
    });
  }

  // Add experience letters
  if (documents.experienceUrls && documents.experienceUrls.length > 0) {
    documentList.push({
      category: 'Experience Letters',
      docs: documents.experienceUrls.map((url, index) => ({
        name: `Experience Letter ${index + 1}`,
        url: url,
        type: 'application/pdf'
      }))
    });
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `(${mb.toFixed(2)} MB)`;
  };

  const handleDocumentView = (url: string) => {
    setSelectedDocument(url);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {personName} - Documents
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {personType === 'teacher' ? 'Teacher' : 'Student'} document viewer
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {documentList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
              <p className="text-gray-500">No documents have been uploaded for this {personType}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document List */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Uploaded Documents</h4>
                
                {documentList.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">{category.category}</h5>
                    <div className="space-y-2">
                      {category.docs.map((doc, docIndex) => (
                        <div key={docIndex} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {doc.type.includes('pdf') ? 'PDF Document' : 'Image File'} 
                                {formatFileSize(doc.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDocumentView(doc.url)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Select Document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Open Document"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDownload(doc.url, doc.name)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Document Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Document Access</h4>
                
                {selectedDocument ? (
                  <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    {/* Primary Access Method */}
                    <div className="p-6 text-center border-b border-gray-200">
                      <FileText className="h-12 w-12 text-indigo-500 mx-auto mb-3" />
                      <h5 className="text-lg font-semibold text-gray-900 mb-2">Document Ready</h5>
                      <p className="text-gray-600 mb-4">Click to open the document in a new tab</p>
                      
                      <a
                        href={selectedDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Open Document
                      </a>
                    </div>
                    
                    {/* Preview Attempt */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3">Preview (may not work for private documents):</p>
                      {selectedDocument.toLowerCase().includes('.pdf') || selectedDocument.includes('application/pdf') ? (
                        <iframe
                          src={`${selectedDocument}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-64 border border-gray-200 rounded"
                          title="Document Preview"
                          onError={() => {
                            console.log('Preview failed - this is expected for private documents');
                          }}
                        />
                      ) : (
                        <img
                          src={selectedDocument}
                          alt="Document Preview"
                          className="w-full h-64 object-contain border border-gray-200 rounded"
                          onError={() => {
                            console.log('Image preview failed - this is expected for private documents');
                          }}
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        If preview doesn't work, use the "Open Document" button above
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Click on a document to access it</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;