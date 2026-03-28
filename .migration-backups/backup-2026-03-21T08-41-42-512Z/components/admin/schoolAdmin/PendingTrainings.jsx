import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { SchoolAdminNotificationService } from '../../../services/schoolAdminNotificationService';
import { toast } from 'react-hot-toast';

const PendingTrainings = ({ schoolId, onTrainingAction, currentUserId }) => {
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch pending trainings
  const fetchPendingTrainings = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    try {
      const data = await SchoolAdminNotificationService.getPendingTrainings(schoolId);
      setPendingTrainings(data);
    } catch (error) {
      console.error('Error fetching pending trainings:', error);
      toast.error('Failed to load pending trainings');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve training
  const handleApprove = async (training) => {
    if (!currentUserId) {
      toast.error('User not authenticated');
      return;
    }

    setActionLoading(prev => ({ ...prev, [training.id]: 'approving' }));
    
    try {
      const result = await SchoolAdminNotificationService.approveTraining(
        training.id,
        currentUserId,
        'Approved by School Admin'
      );
      
      toast.success(result.message || `Training "${training.title}" approved successfully!`);
      fetchPendingTrainings(); // Refresh list
      onTrainingAction && onTrainingAction('approved', training);
    } catch (error) {
      console.error('Error approving training:', error);
      toast.error(error.message || 'Failed to approve training');
    } finally {
      setActionLoading(prev => ({ ...prev, [training.id]: null }));
    }
  };

  // Handle reject training
  const handleReject = async (training) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    if (!currentUserId) {
      toast.error('User not authenticated');
      return;
    }

    setActionLoading(prev => ({ ...prev, [training.id]: 'rejecting' }));
    
    try {
      const result = await SchoolAdminNotificationService.rejectTraining(
        training.id,
        currentUserId,
        reason
      );
      
      toast.success(result.message || `Training "${training.title}" rejected.`);
      fetchPendingTrainings(); // Refresh list
      onTrainingAction && onTrainingAction('rejected', training);
    } catch (error) {
      console.error('Error rejecting training:', error);
      toast.error(error.message || 'Failed to reject training');
    } finally {
      setActionLoading(prev => ({ ...prev, [training.id]: null }));
    }
  };

  // Handle view details
  const handleViewDetails = (training) => {
    onTrainingAction && onTrainingAction('view', training);
  };

  useEffect(() => {
    fetchPendingTrainings();
  }, [schoolId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pending Trainings</h2>
            <p className="text-sm text-gray-600">
              {pendingTrainings.length} training{pendingTrainings.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
        </div>
        
        {pendingTrainings.length > 0 && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
            {pendingTrainings.length} Pending
          </span>
        )}
      </div>

      {/* Trainings List */}
      {pendingTrainings.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">No pending trainings</p>
          <p className="text-gray-400 text-sm">All trainings have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTrainings.map((training) => (
            <div
              key={training.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
            >
              {/* Student Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{training.student_name}</h3>
                    <p className="text-sm text-gray-600">{training.student_email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm font-medium text-gray-600">
                    {formatDate(training.created_at)}
                  </p>
                </div>
              </div>

              {/* Training Details */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{training.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Organization</p>
                    <p className="font-medium text-gray-900">{training.organization}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">
                      {formatDuration(training.start_date, training.end_date)}
                    </p>
                  </div>
                </div>
                
                {training.description && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm">Description</p>
                    <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                      {training.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatDate(training.start_date)} - {formatDate(training.end_date)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(training)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  
                  <button
                    onClick={() => handleReject(training)}
                    disabled={actionLoading[training.id]}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading[training.id] === 'rejecting' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </button>
                  
                  <button
                    onClick={() => handleApprove(training)}
                    disabled={actionLoading[training.id]}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading[training.id] === 'approving' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingTrainings;