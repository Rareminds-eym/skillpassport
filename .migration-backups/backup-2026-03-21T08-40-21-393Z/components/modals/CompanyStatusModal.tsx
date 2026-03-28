import React from 'react';
import { X, CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react';

interface StatusOption {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface CompanyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  companyName: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  isUpdating: boolean;
}

const CompanyStatusModal: React.FC<CompanyStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  companyName,
  onStatusChange,
  isUpdating
}) => {
  if (!isOpen) return null;

  const statusOptions: StatusOption[] = [
    {
      value: 'pending',
      label: 'Pending',
      description: 'Company registration is under review',
      icon: Clock,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200 hover:border-yellow-300'
    },
    {
      value: 'approved',
      label: 'Approved',
      description: 'Company is approved but not yet active',
      icon: CheckCircle,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200 hover:border-blue-300'
    },
    {
      value: 'active',
      label: 'Active',
      description: 'Company can post jobs and recruit students',
      icon: CheckCircle,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200 hover:border-green-300'
    },
    {
      value: 'inactive',
      label: 'Inactive',
      description: 'Company cannot post new jobs temporarily',
      icon: AlertTriangle,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200 hover:border-orange-300'
    },
    {
      value: 'suspended',
      label: 'Suspended',
      description: 'Company access is temporarily suspended',
      icon: AlertTriangle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200 hover:border-red-300'
    },
    {
      value: 'rejected',
      label: 'Rejected',
      description: 'Company registration has been rejected',
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200 hover:border-red-300'
    },
    {
      value: 'blacklisted',
      label: 'Blacklisted',
      description: 'Company is permanently restricted from platform',
      icon: Shield,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200 hover:border-gray-300'
    }
  ];

  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      onClose();
      return;
    }

    try {
      await onStatusChange(newStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Company Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update status for <span className="font-medium">{companyName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Current Status */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              statusOptions.find(opt => opt.value === currentStatus)?.bgColor || 'bg-gray-100'
            } ${
              statusOptions.find(opt => opt.value === currentStatus)?.color || 'text-gray-700'
            }`}>
              {statusOptions.find(opt => opt.value === currentStatus)?.label || currentStatus}
            </span>
          </div>
        </div>

        {/* Status Options */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statusOptions.map((option) => {
              const IconComponent = option.icon;
              const isCurrentStatus = option.value === currentStatus;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  disabled={isUpdating || isCurrentStatus}
                  className={`
                    relative p-4 rounded-lg border-2 text-left transition-all duration-200
                    ${option.bgColor} ${option.color} ${option.borderColor}
                    ${isCurrentStatus 
                      ? 'opacity-50 cursor-not-allowed ring-2 ring-blue-200' 
                      : 'hover:shadow-md cursor-pointer transform hover:scale-[1.02]'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isCurrentStatus && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-1">
                        {option.label}
                        {isCurrentStatus && (
                          <span className="ml-2 text-xs font-normal opacity-75">(Current)</span>
                        )}
                      </div>
                      <div className="text-xs opacity-80 leading-relaxed">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isUpdating && (
          <div className="px-6 py-4 border-t border-gray-200 bg-blue-50">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-blue-700">Updating status...</span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyStatusModal;