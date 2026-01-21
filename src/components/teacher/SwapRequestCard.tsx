import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Ban,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermissions';
import type { ClassSwapRequestWithDetails } from '../../types/classSwap';

interface SwapRequestCardProps {
  request: ClassSwapRequestWithDetails;
  viewMode: 'sent' | 'received' | 'history';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string, reason?: string) => void;
  onCancel?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STATUS_CONFIG = {
  pending: {
    color: 'yellow',
    icon: AlertCircle,
    label: 'Pending',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-300',
    textClass: 'text-yellow-800',
    badgeClass: 'bg-yellow-100 text-yellow-800',
  },
  accepted: {
    color: 'blue',
    icon: CheckCircle,
    label: 'Accepted',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  rejected: {
    color: 'red',
    icon: XCircle,
    label: 'Rejected',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-300',
    textClass: 'text-red-800',
    badgeClass: 'bg-red-100 text-red-800',
  },
  cancelled: {
    color: 'gray',
    icon: Ban,
    label: 'Cancelled',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-300',
    textClass: 'text-gray-800',
    badgeClass: 'bg-gray-100 text-gray-800',
  },
  completed: {
    color: 'green',
    icon: CheckCircle,
    label: 'Completed',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-300',
    textClass: 'text-green-800',
    badgeClass: 'bg-green-100 text-green-800',
  },
};

const SwapRequestCard: React.FC<SwapRequestCardProps> = ({
  request,
  viewMode,
  onAccept,
  onReject,
  onCancel,
  onViewDetails,
}) => {
  const { user } = useAuth();

  // Permission controls for Classroom Management module - same as MyTimetable
  const canView = usePermission('Classroom Management', 'view');
  // @ts-expect-error - Auto-suppressed for migration
  const canEdit = usePermission('Classroom Management', 'edit');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const statusConfig = STATUS_CONFIG[request.status];
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const handleAccept = async () => {
    if (!onAccept) return;
    if (!canEdit.allowed) {
      console.log('❌ [SwapRequestCard] Action Blocked: Accept Request - No Edit Permission');
      alert('❌ Access Denied: You need EDIT permission to accept swap requests');
      return;
    }

    console.log('📅 [SwapRequestCard] Action: Accept Swap Request', {
      userRole: user?.role,
      module: 'Classroom Management',
      action: 'Accept Swap Request',
      permissions: {
        canView: canView.allowed,
        canEdit: canEdit.allowed,
      },
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });

    setIsProcessing(true);
    try {
      await onAccept(request.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    if (!canEdit.allowed) {
      console.log('❌ [SwapRequestCard] Action Blocked: Reject Request - No Edit Permission');
      alert('❌ Access Denied: You need EDIT permission to reject swap requests');
      return;
    }

    console.log('📅 [SwapRequestCard] Action: Reject Swap Request', {
      userRole: user?.role,
      module: 'Classroom Management',
      action: 'Reject Swap Request',
      permissions: {
        canView: canView.allowed,
        canEdit: canEdit.allowed,
      },
      requestId: request.id,
      rejectReason: rejectReason,
      timestamp: new Date().toISOString(),
    });

    setIsProcessing(true);
    try {
      await onReject(request.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    if (!canEdit.allowed) {
      console.log('❌ [SwapRequestCard] Action Blocked: Cancel Request - No Edit Permission');
      alert('❌ Access Denied: You need EDIT permission to cancel swap requests');
      return;
    }

    if (!confirm('Are you sure you want to cancel this swap request?')) return;

    console.log('📅 [SwapRequestCard] Action: Cancel Swap Request', {
      userRole: user?.role,
      module: 'Classroom Management',
      action: 'Cancel Swap Request',
      permissions: {
        canView: canView.allowed,
        canEdit: canEdit.allowed,
      },
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });

    setIsProcessing(true);
    try {
      await onCancel(request.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = () => {
    if (!canView.allowed) {
      console.log('❌ [SwapRequestCard] Action Blocked: View Details - No View Permission');
      alert('❌ Access Denied: You need VIEW permission to view swap request details');
      return;
    }

    console.log('📅 [SwapRequestCard] Action: View Details Clicked', {
      userRole: user?.role,
      module: 'Classroom Management',
      action: 'View Swap Request Details',
      permissions: {
        canView: canView.allowed,
        canEdit: canEdit.allowed,
      },
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });

    onViewDetails?.(request.id);
  };

  return (
    <>
      <div
        className={`border-2 rounded-lg p-4 ${statusConfig.borderClass} ${statusConfig.bgClass} transition-all hover:shadow-md`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.textClass}`} />
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig.badgeClass}`}
            >
              {statusConfig.label}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                request.request_type === 'one_time'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {request.request_type === 'one_time' ? 'One-time' : 'Permanent'}
            </span>
          </div>
          <span className="text-xs text-gray-500">{getTimeAgo(request.created_at)}</span>
        </div>

        {/* Faculty Info */}
        {viewMode === 'received' && request.requester_faculty && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              From:{' '}
              <span className="font-medium">
                {request.requester_faculty.first_name} {request.requester_faculty.last_name}
              </span>
            </span>
          </div>
        )}

        {viewMode === 'sent' && request.target_faculty && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              To:{' '}
              <span className="font-medium">
                {request.target_faculty.first_name} {request.target_faculty.last_name}
              </span>
            </span>
          </div>
        )}

        {/* Swap Date (for one-time swaps) */}
        {request.request_type === 'one_time' && request.swap_date && (
          <div className="mb-3 bg-white bg-opacity-50 rounded-lg p-2 border border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-gray-700">
                Swap Date: <span className="font-semibold">{formatDate(request.swap_date)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Swap Explanation */}
        <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-800">
            <strong>Time Slot Exchange:</strong> Each educator continues teaching their own subject
            to their own students, just at the swapped time.
          </p>
        </div>

        {/* Slot Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-gray-200">
            {viewMode === 'received' ? (
              <>
                <div className="text-xs font-medium text-gray-500 mb-1">Your Time Slot</div>
                {request.target_slot && (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      {DAYS[request.target_slot.day_of_week - 1]}, {request.target_slot.start_time}{' '}
                      - {request.target_slot.end_time}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Room {request.target_slot.room_number}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        You teach: {request.target_slot.subject_name} to{' '}
                        {request.target_slot.class_name}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-xs font-medium text-gray-500 mb-1">Your Time Slot</div>
                {request.requester_slot && (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      {DAYS[request.requester_slot.day_of_week - 1]},{' '}
                      {request.requester_slot.start_time} - {request.requester_slot.end_time}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Room {request.requester_slot.room_number}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        You teach: {request.requester_slot.subject_name} to{' '}
                        {request.requester_slot.class_name}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-gray-200">
            {viewMode === 'received' ? (
              <>
                <div className="text-xs font-medium text-gray-500 mb-1">Their Time Slot</div>
                {request.requester_slot && (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      {DAYS[request.requester_slot.day_of_week - 1]},{' '}
                      {request.requester_slot.start_time} - {request.requester_slot.end_time}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Room {request.requester_slot.room_number}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        They teach: {request.requester_slot.subject_name} to{' '}
                        {request.requester_slot.class_name}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-xs font-medium text-gray-500 mb-1">Their Time Slot</div>
                {request.target_slot && (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      {DAYS[request.target_slot.day_of_week - 1]}, {request.target_slot.start_time}{' '}
                      - {request.target_slot.end_time}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Room {request.target_slot.room_number}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        They teach: {request.target_slot.subject_name} to{' '}
                        {request.target_slot.class_name}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Reason:</div>
          <p className="text-sm text-gray-700 line-clamp-2">{request.reason}</p>
        </div>

        {/* Admin Approval Status */}
        {request.status === 'accepted' && request.requires_admin_approval && (
          <div className="mb-3 bg-white bg-opacity-50 rounded-lg p-2 border border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-gray-700">
                Admin Approval:{' '}
                <span
                  className={`font-semibold ${
                    request.admin_approval_status === 'approved'
                      ? 'text-green-600'
                      : request.admin_approval_status === 'rejected'
                        ? 'text-red-600'
                        : 'text-amber-600'
                  }`}
                >
                  {request.admin_approval_status === 'approved'
                    ? 'Approved'
                    : request.admin_approval_status === 'rejected'
                      ? 'Rejected'
                      : 'Pending'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Response Messages */}
        {request.target_response && (
          <div className="mb-3 bg-white bg-opacity-50 rounded-lg p-2 border border-gray-200">
            <div className="text-xs font-medium text-gray-500 mb-1">Response:</div>
            <p className="text-sm text-gray-700">{request.target_response}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          {viewMode === 'received' && request.status === 'pending' && (
            <>
              <button
                onClick={handleAccept}
                disabled={isProcessing || !canEdit.allowed}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  canEdit.allowed
                    ? 'text-white bg-green-600 hover:bg-green-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50 blur-sm'
                }`}
                title={canEdit.allowed ? 'Accept Request' : '❌ No EDIT permission'}
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </button>
              <button
                onClick={() => {
                  if (!canEdit.allowed) {
                    console.log(
                      '❌ [SwapRequestCard] Action Blocked: Reject Button - No Edit Permission'
                    );
                    alert('❌ Access Denied: You need EDIT permission to reject swap requests');
                    return;
                  }
                  setShowRejectModal(true);
                }}
                disabled={isProcessing || !canEdit.allowed}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  canEdit.allowed
                    ? 'text-white bg-red-600 hover:bg-red-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50 blur-sm'
                }`}
                title={canEdit.allowed ? 'Reject Request' : '❌ No EDIT permission'}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}

          {viewMode === 'sent' && request.status === 'pending' && (
            <button
              onClick={handleCancel}
              disabled={isProcessing || !canEdit.allowed}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                canEdit.allowed
                  ? 'text-white bg-gray-600 hover:bg-gray-700'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50 blur-sm'
              }`}
              title={canEdit.allowed ? 'Cancel Request' : '❌ No EDIT permission'}
            >
              <Ban className="h-4 w-4" />
              Cancel Request
            </button>
          )}

          <button
            onClick={handleViewDetails}
            disabled={!canView.allowed}
            className={`px-4 py-2 text-sm font-medium border rounded-lg transition flex items-center gap-2 ${
              canView.allowed
                ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-50 blur-sm'
            }`}
            title={canView.allowed ? 'View Details' : '❌ No VIEW permission'}
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Swap Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this swap request (optional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., I have another commitment at that time..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwapRequestCard;
