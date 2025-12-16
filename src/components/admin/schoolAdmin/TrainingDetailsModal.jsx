import React, { useState } from 'react';
import { X, User, Calendar, Building, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SchoolAdminNotificationService } from '../../../services/schoolAdminNotificationService';
import { CollegeAdminNotificationService } from '../../../services/collegeAdminNotificationService';
import { toast } from 'react-hot-toast';

const TrainingDetailsModal = ({ training, isOpen, onClose, onAction, currentUserId }) => {
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !training) return null;

  // Handle approve training
  const handleApprove = async () => {
    setActionLoading('approving');
    
    try {
      if (!currentUserId) {
        toast.error('User not authenticated');
        return;
      }

      let result;
      const approvalAuthority = training.approval_authority;
      
      if (approvalAuthority === 'college_admin') {
        result = await CollegeAdminNotificationService.approveTraining(
          training.id,
          currentUserId,
          'Approved by College Admin'
        );
      } else {
        result = await SchoolAdminNotificationService.approveTraining(
          training.id,
          currentUserId,
          'Approved by School Admin'
        );
      }
      
      toast.success(result.message || `Training "${training.title}" approved successfully!`);
      onAction && onAction('approved', training);
      onClose();
    } catch (error) {
      console.error('Error approving training:', error);
      toast.error(error.message || 'Failed to approve training');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject training
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading('rejecting');
    
    try {
      if (!currentUserId) {
        toast.error('User not authenticated');
        return;
      }

      let result;
      const approvalAuthority = training.approval_authority;
      
      if (approvalAuthority === 'college_admin') {
        result = await CollegeAdminNotificationService.rejectTraining(
          training.id,
          currentUserId,
          rejectionReason
        );
      } else {
        result = await SchoolAdminNotificationService.rejectTraining(
          training.id,
          currentUserId,
          rejectionReason
        );
      }
      
      toast.success(result.message || `Training "${training.title}" rejected.`);
      onAction && onAction('rejected', training);
      onClose();
    } catch (error) {
      console.error('Error rejecting training:', error);
      toast.error(error.message || 'Failed to reject training');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Duration not specified';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Training Details</h2>
            <p className="text-sm text-gray-600">Review and approve training submission</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{training.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{training.student_email}</p>
              </div>
            </div>
          </div>

          {/* Training Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Training Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Training Title</p>
                <p className="font-semibold text-gray-900 text-lg">{training.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Organization</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900">{training.organization}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900">
                      {formatDuration(training.start_date, training.end_date)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900">{formatDate(training.start_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900">{formatDate(training.end_date)}</p>
                  </div>
                </div>
              </div>
              
              {training.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900 mt-1 leading-relaxed">{training.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-yellow-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Approval
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted On</p>
                <p className="font-medium text-gray-900">{formatDate(training.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Rejection Reason</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this training..."
                className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'approving' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve Training
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'rejecting' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirm Rejection
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailsModal;