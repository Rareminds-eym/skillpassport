import React from 'react';
import { X, Loader2, AlertCircle, Paperclip, FileText, CheckCircle2, Upload } from 'lucide-react';
import { getApiUrl } from '@/shared/api/apiUtils';

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  assignment: any;
  loading: boolean;
  canSubmit: boolean;
  isOverdue: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  parseAsLocalDate: (dateString: string) => Date;
  getStatusBadge: (status: string) => React.ReactNode;
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  isOpen,
  assignment,
  loading,
  canSubmit,
  isOverdue,
  onClose,
  onUploadClick,
  parseAsLocalDate,
  getStatusBadge
}) => {
  if (!isOpen) return null;

  const openFile = (fileUrl: string) => {
    const storageApiUrl = getApiUrl('storage');
    const accessibleUrl = fileUrl.includes('/document-access')
      ? fileUrl
      : `${storageApiUrl}/document-access?url=${encodeURIComponent(fileUrl)}&mode=inline`;
    window.open(accessibleUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {assignment?.title || 'Assignment Details'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {assignment?.course_name} • Due: {assignment?.due_date && parseAsLocalDate(assignment.due_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading assignment details...</span>
            </div>
          ) : assignment ? (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(assignment.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Points</p>
                  <p className="text-lg font-semibold text-gray-900">{assignment.total_points}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {assignment.assignment_type?.replace('_', ' ') || 'Assignment'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {assignment.description && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {assignment.instructions && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h4>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-900 whitespace-pre-wrap">{assignment.instructions}</p>
                  </div>
                </div>
              )}

              {/* Instruction Files */}
              {assignment.instruction_files?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Instruction Files</h4>
                  <div className="space-y-2">
                    {assignment.instruction_files.map((file: any) => (
                      <div key={file.attachment_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {file.file_type} • {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openFile(file.file_url)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Files */}
              {assignment.submission_files?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Your Submissions</h4>
                  <div className="space-y-2">
                    {assignment.submission_files.map((file: any) => (
                      <div key={file.attachment_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">{file.original_filename}</p>
                            <p className="text-sm text-green-700">
                              Submitted on {new Date(file.uploaded_date).toLocaleDateString()} • {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openFile(file.file_url)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade & Feedback */}
              {assignment.status === 'graded' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Grade & Feedback</h4>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-700 font-medium">Grade Received:</span>
                      <span className="text-2xl font-bold text-green-800">
                        {assignment.grade_percentage}% ({assignment.grade_received}/{assignment.total_points})
                      </span>
                    </div>
                    {assignment.instructor_feedback && (
                      <div>
                        <p className="text-green-700 font-medium mb-2">Instructor Feedback:</p>
                        <p className="text-green-800 whitespace-pre-wrap">{assignment.instructor_feedback}</p>
                      </div>
                    )}
                    {assignment.graded_date && (
                      <p className="text-sm text-green-600 mt-3">
                        Graded on {new Date(assignment.graded_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Failed to load assignment details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {assignment && canSubmit && (
            <button
              onClick={onUploadClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Submission
            </button>
          )}
          {assignment && !canSubmit && assignment.status !== 'submitted' && assignment.status !== 'graded' && isOverdue && !assignment.allow_late_submission && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
              <AlertCircle className="w-4 h-4" />
              Late submission not allowed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsModal;
