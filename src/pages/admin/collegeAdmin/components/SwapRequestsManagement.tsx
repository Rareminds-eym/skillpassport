import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  getCollegeSwapRequestsWithDetails,
  getCollegeSwapStatistics,
  adminApproveSwapRequest,
} from '../../../../services/classSwapService';
import type {
  ClassSwapRequestWithDetails,
  SwapStatistics,
  SwapRequestStatus,
} from '../../../../types/classSwap';
import { useAuth } from '../../../../context/AuthContext';

interface SwapRequestsManagementProps {
  collegeId: string | null;
}

const SwapRequestsManagement: React.FC<SwapRequestsManagementProps> = ({ collegeId }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ClassSwapRequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ClassSwapRequestWithDetails[]>([]);
  const [stats, setStats] = useState<SwapStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<SwapRequestStatus | 'all'>('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClassSwapRequestWithDetails | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [approvalMessage, setApprovalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (collegeId) {
      loadData();
    }
  }, [collegeId]);

  useEffect(() => {
    filterRequests();
  }, [requests, selectedStatus]);

  const loadData = async () => {
    if (!collegeId) return;

    setLoading(true);
    try {
      const [requestsResult, statsResult] = await Promise.all([
        getCollegeSwapRequestsWithDetails(collegeId),
        getCollegeSwapStatistics(collegeId),
      ]);

      if (requestsResult.data) {
        setRequests(requestsResult.data);
      }

      setStats(statsResult);
    } catch (error) {
      console.error('Error loading swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (selectedStatus === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((r) => r.status === selectedStatus));
    }
  };

  const handleApprovalClick = (
    request: ClassSwapRequestWithDetails,
    action: 'approved' | 'rejected'
  ) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalMessage('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRequest || !user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await adminApproveSwapRequest(
        selectedRequest.id,
        {
          approval_status: approvalAction,
          response_message: approvalMessage || undefined,
        },
        user.id
      );

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert(`Request ${approvalAction} successfully!`);
        setShowApprovalModal(false);
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error submitting approval:', error);
      alert('Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: SwapRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Total Requests</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.total_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">Pending</p>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{stats.pending_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-900">Awaiting Approval</p>
            </div>
            <p className="text-3xl font-bold text-orange-900">{stats.pending_admin_approval}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">Completed</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.completed_swaps}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <p className="text-sm font-medium text-indigo-900">Accepted</p>
            </div>
            <p className="text-3xl font-bold text-indigo-900">{stats.accepted_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Rejected</p>
            </div>
            <p className="text-3xl font-bold text-red-900">{stats.rejected_requests}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'accepted', 'rejected', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No swap requests found</p>
            <p className="text-gray-500 text-sm mt-2">
              {selectedStatus === 'all'
                ? 'There are no swap requests yet'
                : `No ${selectedStatus} requests`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}
                  >
                    {request.status.toUpperCase()}
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                    {request.request_type === 'one_time' ? 'One-Time' : 'Permanent'}
                  </div>
                  {request.admin_approval_status === 'pending' && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Awaiting Admin Approval
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
              </div>

              {/* Faculty Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                {/* Requester */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Requester</p>
                  <p className="text-lg font-bold text-gray-900">
                    {request.requester_faculty?.first_name} {request.requester_faculty?.last_name}
                  </p>
                  {request.requester_slot && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="font-semibold text-blue-900">
                        {request.requester_slot.subject_name}
                      </p>
                      <p className="text-sm text-blue-700">{request.requester_slot.class_name}</p>
                      <p className="text-sm text-blue-600">
                        {getDayName(request.requester_slot.day_of_week)} • Period{' '}
                        {request.requester_slot.period_number}
                      </p>
                      <p className="text-sm text-blue-600">
                        {formatTime(request.requester_slot.start_time)} -{' '}
                        {formatTime(request.requester_slot.end_time)}
                      </p>
                      <p className="text-sm text-blue-600">
                        Room: {request.requester_slot.room_number}
                      </p>
                    </div>
                  )}
                </div>

                {/* Target */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Target Faculty</p>
                  <p className="text-lg font-bold text-gray-900">
                    {request.target_faculty?.first_name} {request.target_faculty?.last_name}
                  </p>
                  {request.target_slot && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="font-semibold text-green-900">
                        {request.target_slot.subject_name}
                      </p>
                      <p className="text-sm text-green-700">{request.target_slot.class_name}</p>
                      <p className="text-sm text-green-600">
                        {getDayName(request.target_slot.day_of_week)} • Period{' '}
                        {request.target_slot.period_number}
                      </p>
                      <p className="text-sm text-green-600">
                        {formatTime(request.target_slot.start_time)} -{' '}
                        {formatTime(request.target_slot.end_time)}
                      </p>
                      <p className="text-sm text-green-600">
                        Room: {request.target_slot.room_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Reason</p>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {request.reason}
                </p>
              </div>

              {/* Swap Date (for one-time swaps) */}
              {request.swap_date && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Swap Date</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <p>{formatDate(request.swap_date)}</p>
                  </div>
                </div>
              )}

              {/* Target Response */}
              {request.target_response && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Target Faculty Response
                  </p>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {request.target_response}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {request.admin_approval_status === 'pending' && request.status === 'accepted' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprovalClick(request, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve Swap
                  </button>
                  <button
                    onClick={() => handleApprovalClick(request, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject Swap
                  </button>
                </div>
              )}

              {/* Admin Response (if already processed) */}
              {request.admin_response && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Admin Response</p>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {request.admin_response}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {request.admin_responded_at &&
                      `Responded on ${formatDate(request.admin_responded_at)}`}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {approvalAction === 'approved' ? 'Approve' : 'Reject'} Swap Request
            </h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to {approvalAction === 'approved' ? 'approve' : 'reject'} this
              swap request between{' '}
              <span className="font-semibold">
                {selectedRequest.requester_faculty?.first_name}{' '}
                {selectedRequest.requester_faculty?.last_name}
              </span>{' '}
              and{' '}
              <span className="font-semibold">
                {selectedRequest.target_faculty?.first_name}{' '}
                {selectedRequest.target_faculty?.last_name}
              </span>
              ?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Message (Optional)
              </label>
              <textarea
                value={approvalMessage}
                onChange={(e) => setApprovalMessage(e.target.value)}
                placeholder="Add a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApproval}
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  approvalAction === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting
                  ? 'Processing...'
                  : `Confirm ${approvalAction === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRequestsManagement;
