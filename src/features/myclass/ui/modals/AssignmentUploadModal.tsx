import React, { useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Assignment } from '@/features/myclass';
import LearnerAssignmentFileUpload from '@/entities/learner/ui/LearnerAssignmentFileUpload';

interface AssignmentUploadModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  isUploading: boolean;
  uploadProgress: number;
  onClose: () => void;
  onSubmit: (stagedFiles: File[]) => void;
  parseAsLocalDate: (dateString: string) => Date;
}

const AssignmentUploadModal: React.FC<AssignmentUploadModalProps> = ({
  isOpen,
  assignment,
  isUploading,
  uploadProgress,
  onClose,
  onSubmit,
  parseAsLocalDate
}) => {
  const fileUploadRef = useRef<{ getStagedFiles: () => File[]; clearStagedFiles: () => void }>(null);

  if (!isOpen || !assignment) return null;

  const handleSubmit = () => {
    if (!fileUploadRef.current) return;
    const stagedFiles = fileUploadRef.current.getStagedFiles();
    onSubmit(stagedFiles);
  };

  const handleClose = () => {
    if (!isUploading) {
      fileUploadRef.current?.clearStagedFiles();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
            <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <LearnerAssignmentFileUpload
            ref={fileUploadRef}
            maxFiles={3}
            acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']}
            className="mb-6"
          />

          {isUploading && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Submitting assignment...</span>
                <span className="text-blue-600 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium text-gray-900">{assignment.course_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium text-gray-900">
                {parseAsLocalDate(assignment.due_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Points:</span>
              <span className="font-medium text-gray-900">{assignment.total_points}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentUploadModal;
