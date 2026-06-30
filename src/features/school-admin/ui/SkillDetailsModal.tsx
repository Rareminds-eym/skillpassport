import React, { useState } from 'react';
import { X, User, CheckCircle, XCircle, Zap, TrendingUp } from 'lucide-react';
import { approveSkill, rejectSkill } from '@/shared/api/verificationService';
import { toast } from 'react-hot-toast';
import type { SkillDetailsModalProps } from '../model/types';

const SkillDetailsModal: React.FC<SkillDetailsModalProps> = ({ 
  skill, 
  isOpen, 
  onClose, 
  onAction, 
  currentUserId 
}) => {
  const [actionLoading, setActionLoading] = useState<'approving' | 'rejecting' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !skill) return null;

  // Validate and get approval authority
  const getApprovalAuthority = (): 'college_admin' | 'school_admin' => {
    const authority = skill?.approval_authority;
    if (authority === 'college_admin' || authority === 'school_admin') {
      return authority;
    }
    return 'school_admin'; // Default fallback
  };

  // Handle approve skill
  const handleApprove = async () => {
    setActionLoading('approving');
    
    try {
      if (!currentUserId) {
        toast.error('User not authenticated');
        return;
      }

      const approvalAuthority = getApprovalAuthority();
      const notes = approvalAuthority === 'college_admin' 
        ? 'Approved by College Admin' 
        : 'Approved by School Admin';
      
      const result = await approveSkill(
        skill.id,
        currentUserId,
        notes,
        approvalAuthority
      );
      
      toast.success(result.message || `Skill "${skill.skill_name || skill.name}" approved successfully!`);
      
      if (onAction) {
        await Promise.resolve(onAction('approved', skill));
      }
      
      onClose();
    } catch (error) {
      console.error('Error approving skill:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to approve skill');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject skill
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

      const approvalAuthority = getApprovalAuthority();
      
      const result = await rejectSkill(
        skill.id,
        currentUserId,
        rejectionReason,
        approvalAuthority
      );
      
      toast.success(result.message || `Skill "${skill.skill_name || skill.name}" rejected.`);
      
      if (onAction) {
        await Promise.resolve(onAction('rejected', skill));
      }
      
      onClose();
    } catch (error) {
      console.error('Error rejecting skill:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to reject skill');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLevelBadgeColor = (level: number | undefined): string => {
    const levelNum = parseInt(String(level || 0)) || 0;
    if (levelNum >= 4) return 'bg-green-100 text-green-800';
    if (levelNum >= 3) return 'bg-blue-100 text-blue-800';
    if (levelNum >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Skill Details</h2>
            <p className="text-sm text-gray-600">Review and approve skill submission</p>
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
          {/* Learner Information */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{skill.learner_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{skill.learner_email}</p>
              </div>
            </div>
          </div>

          {/* Skill Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Zap className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Skill Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Skill Name</p>
                <p className="font-semibold text-gray-900 text-lg">{skill.skill_name || skill.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Proficiency Level</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(skill.level)}`}>
                      Level {skill.level || 'N/A'} / 5
                    </span>
                  </div>
                </div>
                {skill.type && (
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium text-gray-900">{skill.type}</p>
                  </div>
                )}
              </div>

              {skill.category && (
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">{skill.category}</p>
                </div>
              )}

              {skill.source && (
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-medium text-gray-900">{skill.source}</p>
                </div>
              )}
              
              {skill.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900 mt-1 leading-relaxed">{skill.description}</p>
                </div>
              )}

              {skill.years_of_experience && (
                <div>
                  <p className="text-sm text-gray-600">Years of Experience</p>
                  <p className="font-medium text-gray-900">{skill.years_of_experience} years</p>
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
                <p className="font-medium text-gray-900">{formatDate(skill.created_at)}</p>
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
                placeholder="Please provide a reason for rejecting this skill..."
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
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              
              <button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'approving' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve Skill
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
                disabled={!!actionLoading || !rejectionReason.trim()}
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

export default SkillDetailsModal;
