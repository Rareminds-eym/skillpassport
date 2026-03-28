import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import offerManagementService from '../../services/offerManagementService';

const OfferAcceptanceModal = ({ application, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const result = await offerManagementService.acceptOffer(application.id);
      
      if (result.success) {
        onSuccess('accepted');
        onClose();
      } else {
        alert(result.error || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await offerManagementService.rejectOffer(application.id, rejectReason);
      
      if (result.success) {
        onSuccess('rejected');
        onClose();
      } else {
        alert(result.error || 'Failed to reject offer');
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Job Offer Decision</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Job Details */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {application.jobTitle}
            </h3>
            <p className="text-sm text-gray-600">{application.company}</p>
            {application.salary && (
              <p className="text-sm text-indigo-600 font-semibold mt-2">
                {application.salary}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Important Decision</p>
              <p>
                Accepting this offer will reduce available openings. Other candidates may be notified if all positions are filled.
              </p>
            </div>
          </div>

          {/* Reject Reason Input */}
          {showRejectReason && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reason for rejection (required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="3"
                placeholder="Please provide a reason..."
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          {!showRejectReason ? (
            <>
              <button
                onClick={() => setShowRejectReason(true)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Reject Offer
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Accept Offer
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowRejectReason(false);
                  setRejectReason('');
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferAcceptanceModal;
