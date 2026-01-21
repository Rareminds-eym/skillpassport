import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  User,
  Clock,
  ExternalLink,
  Github,
  FileText,
  Video,
  Presentation,
  Code,
} from 'lucide-react';
import { SchoolAdminNotificationService } from '../../../services/schoolAdminNotificationService';
import { toast } from 'react-hot-toast';

const ProjectDetailsModal = ({ project, isOpen, onClose, onAction, currentUserId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [actionType, setActionType] = useState('');

  if (!isOpen || !project) return null;

  const handleApprove = async () => {
    if (!currentUserId) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await SchoolAdminNotificationService.approveProject(project.project_id, currentUserId, notes);

      toast.success('Project approved successfully!');
      onAction('approved', project);
      onClose();
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error(error.message || 'Failed to approve project');
    } finally {
      setIsProcessing(false);
      setNotes('');
      setShowNotesInput(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!currentUserId) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await SchoolAdminNotificationService.rejectProject(project.project_id, currentUserId, notes);

      toast.success('Project rejected successfully!');
      onAction('rejected', project);
      onClose();
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error(error.message || 'Failed to reject project');
    } finally {
      setIsProcessing(false);
      setNotes('');
      setShowNotesInput(false);
    }
  };

  const handleActionClick = (type) => {
    setActionType(type);
    setShowNotesInput(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Project Review</h2>
              <p className="text-sm text-gray-600">Submitted by {project.student_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{project.title}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{project.student_name}</span>
              </div>

              {project.organization && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{project.organization}</span>
                </div>
              )}

              {project.status && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{project.status}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {formatDate(project.start_date)} - {formatDate(project.end_date)}
                </span>
              </div>
            </div>

            {project.description && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{project.description}</p>
              </div>
            )}

            {/* Tech Stack */}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Technologies Used</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1"
                    >
                      <Code className="h-3 w-3" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Project Links */}
            <div className="flex flex-wrap gap-3">
              {project.demo_link && (
                <a
                  href={project.demo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Demo
                </a>
              )}

              {project.github_link && (
                <a
                  href={project.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Github className="h-4 w-4" />
                  Source Code
                </a>
              )}

              {project.certificate_url && (
                <a
                  href={project.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <FileText className="h-4 w-4" />
                  Certificate
                </a>
              )}

              {project.video_url && (
                <a
                  href={project.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  <Video className="h-4 w-4" />
                  Video Demo
                </a>
              )}

              {project.ppt_url && (
                <a
                  href={project.ppt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  <Presentation className="h-4 w-4" />
                  Presentation
                </a>
              )}
            </div>
          </div>

          {/* Notes Input */}
          {showNotesInput && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {actionType === 'approve'
                  ? 'Approval Notes (Optional)'
                  : 'Rejection Reason (Required)'}
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Add any notes about the approval...'
                    : 'Please provide a reason for rejection...'
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="text-sm text-gray-600">Submitted on {formatDate(project.created_at)}</div>

          <div className="flex items-center gap-3">
            {!showNotesInput ? (
              <>
                <button
                  onClick={() => handleActionClick('reject')}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  onClick={() => handleActionClick('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowNotesInput(false);
                    setNotes('');
                    setActionType('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>

                <button
                  onClick={actionType === 'approve' ? handleApprove : handleReject}
                  disabled={isProcessing || (actionType === 'reject' && !notes.trim())}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : actionType === 'approve' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
