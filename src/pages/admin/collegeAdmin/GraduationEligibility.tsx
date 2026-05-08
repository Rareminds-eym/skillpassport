import React, { useState, useEffect, useMemo } from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowUpIcon,
  StarIcon,
  BookOpenIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { SearchBar } from '@/shared/ui';
import { KPICard } from '@/features/analytics';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('college-admin-graduation-eligibility');

// Types
interface Learner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dept: string;
  college: string;
  semester: number;
  credits_earned: number;
  credits_required: number;
  cgpa: number;
  backlogs: number;
  pipeline_status: string;
  eligibility_flag: boolean;
  graduation_date?: string;
  documents_verified: boolean;
  created_at: string;
  last_updated: string;
}



// Filter Section Component
const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

// Checkbox Group Component
const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {options.map((option: any) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter((v: string) => v !== option.value));
              }
            }}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count !== undefined && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    enrolled: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Enrolled', icon: BookOpenIcon },
    eligible: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Eligible', icon: CheckCircleIcon },
    graduated: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Graduated', icon: AcademicCapIcon },
    alumni: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Alumni', icon: TrophyIcon },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending', icon: ClockIcon },
    ineligible: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Ineligible', icon: XCircleIcon },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    label: status,
    icon: ClockIcon
  };
  
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

// Eligibility Badge Component
const EligibilityBadge = ({ learner }: { learner: Learner }) => {
  const isEligible = learner.credits_earned >= learner.credits_required && 
                    learner.backlogs === 0 && 
                    learner.cgpa >= 6.0 && 
                    learner.documents_verified;

  return (
    <div className="flex items-center gap-2">
      {isEligible ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Eligible
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Ineligible
        </span>
      )}
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ current, total, label }: { current: number; total: number; label: string }) => {
  const percentage = Math.min((current / total) * 100, 100);
  const isComplete = current >= total;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
          {current}/{total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : percentage >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Learner Card Component
const LearnerCard = ({ 
  learner, 
  onViewDetails, 
  onMarkGraduated, 
  onPromote, 
  onPushToAlumni, 
  onOverrideEligibility 
}: {
  learner: Learner;
  onViewDetails: (learner: Learner) => void;
  onMarkGraduated: (learner: Learner) => void;
  onPromote: (learner: Learner) => void;
  onPushToAlumni: (learner: Learner) => void;
  onOverrideEligibility: (learner: Learner) => void;
}) => {
  const isEligible = learner.credits_earned >= learner.credits_required && 
                    learner.backlogs === 0 && 
                    learner.cgpa >= 6.0 && 
                    learner.documents_verified;

  const canGraduate = isEligible && learner.pipeline_status === 'enrolled';
  const canPromote = learner.semester < 8 && learner.pipeline_status === 'enrolled';
  const canPushToAlumni = learner.pipeline_status === 'graduated';

  // Get avatar color - consistent blue for all learners
  const getAvatarColor = (name: string) => {
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className={`w-14 h-14 ${getAvatarColor(learner.name)} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white font-bold text-xl">
              {learner.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          
          {/* Learner Info and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                  {learner.name}
                </h3>
                <p className="text-sm text-gray-600 truncate mb-2">{learner.email}</p>
              </div>
              
              {/* Status Badges - Top Right */}
              <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                <StatusBadge status={learner.pipeline_status} />
                <EligibilityBadge learner={learner} />
              </div>
            </div>
            
            {/* Department and Semester */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="font-medium">{learner.dept}</span>
              <span>•</span>
              <span>Semester {learner.semester}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Progress Section */}
      <div className="px-6 pb-4">
        <ProgressBar 
          current={learner.credits_earned} 
          total={learner.credits_required} 
          label="Credits Progress" 
        />
      </div>

      {/* Academic Metrics */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* CGPA */}
          <div className="text-center bg-blue-50 rounded-xl py-4 px-2">
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {learner.cgpa.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              CGPA
            </div>
          </div>
          
          {/* Backlogs */}
          <div className={`text-center rounded-xl py-4 px-2 ${
            learner.backlogs > 0 ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <div className={`text-2xl font-bold mb-1 ${
              learner.backlogs > 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              {learner.backlogs}
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${
              learner.backlogs > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              BACKLOGS
            </div>
          </div>
          
          {/* Documents */}
          <div className={`text-center rounded-xl py-4 px-2 ${
            learner.documents_verified ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-center mb-2">
              {learner.documents_verified ? (
                <CheckCircleIcon className="h-7 w-7 text-green-600" />
              ) : (
                <XCircleIcon className="h-7 w-7 text-gray-400" />
              )}
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${
              learner.documents_verified ? 'text-green-600' : 'text-gray-500'
            }`}>
              DOCUMENTS
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        {(() => {
          // Count available action buttons
          const actionButtons = [];
          if (canGraduate) actionButtons.push('graduate');
          if (canPromote) actionButtons.push('promote');
          if (canPushToAlumni) actionButtons.push('alumni');
          if (!isEligible) actionButtons.push('override');
          
          const hasMultipleActions = actionButtons.length > 1;
          
          return (
            <div className={`space-y-2 min-h-[80px] flex flex-col ${hasMultipleActions ? 'justify-end' : 'justify-start'}`}>
              {/* View Details Button - Always on top row */}
              <button
                onClick={() => onViewDetails(learner)}
                className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all text-xs font-medium"
              >
                <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
                View Details
              </button>
              
              {/* Action Buttons Row - Only show if there are action buttons */}
              {actionButtons.length > 0 && (
                <div className="flex gap-2">
                  {canGraduate && (
                    <button
                      onClick={() => onMarkGraduated(learner)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold shadow-sm"
                    >
                      <AcademicCapIcon className="h-3.5 w-3.5 mr-1.5" />
                      Graduate
                    </button>
                  )}
                  
                  {canPromote && (
                    <button
                      onClick={() => onPromote(learner)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-semibold shadow-sm"
                    >
                      <ArrowUpIcon className="h-3.5 w-3.5 mr-1.5" />
                      Promote
                    </button>
                  )}
                  
                  {canPushToAlumni && (
                    <button
                      onClick={() => onPushToAlumni(learner)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-xs font-semibold shadow-sm"
                    >
                      <TrophyIcon className="h-3.5 w-3.5 mr-1.5" />
                      Alumni
                    </button>
                  )}
                  
                  {!isEligible && (
                    <button
                      onClick={() => onOverrideEligibility(learner)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-xs font-semibold shadow-sm"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5 mr-1.5" />
                      Override
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
// Action Modal Component
const ActionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  learner, 
  actionType, 
  onConfirm 
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  learner: Learner | null;
  actionType: string;
  onConfirm: (reason?: string) => void;
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !learner) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (error) {
      logger.error('Action failed:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Learner: <span className="font-medium">{learner.name}</span></p>
              <p className="text-sm text-gray-600">Email: <span className="font-medium">{learner.email}</span></p>
            </div>

            {actionType === 'override' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Override (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Provide a detailed reason for overriding eligibility requirements..."
                  required
                />
              </div>
            )}

            {actionType !== 'override' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Add any additional notes..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (actionType === 'override' && !reason.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Learner Details Modal Component
const LearnerDetailsModal = ({ 
  isOpen, 
  onClose, 
  learner 
}: {
  isOpen: boolean;
  onClose: () => void;
  learner: Learner | null;
}) => {
  if (!isOpen || !learner) return null;

  // Get avatar color - consistent blue for all learners
  const getAvatarColor = (name: string) => {
    return 'bg-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${getAvatarColor(learner.name)} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <span className="text-white font-bold text-2xl">
                    {learner.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{learner.name}</h3>
                  <p className="text-gray-600 text-sm">{learner.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <StatusBadge status={learner.pipeline_status} />
                    <EligibilityBadge learner={learner} />
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Department</p>
                <p className="font-bold text-gray-900 text-sm">{learner.dept}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Semester</p>
                <p className="font-bold text-gray-900 text-xl">{learner.semester}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">College</p>
                <p className="font-bold text-gray-900 text-sm truncate">{learner.college}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Phone</p>
                <p className="font-bold text-gray-900 text-sm">{learner.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Academic Progress */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                Academic Progress
              </h4>
              
              {/* Credits Progress Bar */}
              <div className="mb-8">
                <ProgressBar 
                  current={learner.credits_earned} 
                  total={learner.credits_required} 
                  label="Credits Progress" 
                />
              </div>

              {/* Academic Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 mb-2 font-semibold">Current CGPA</p>
                      <p className="text-4xl font-bold text-blue-600">{learner.cgpa.toFixed(2)}</p>
                    </div>
                    <StarIcon className="h-10 w-10 text-blue-500" />
                  </div>
                </div>
                
                <div className={`${learner.backlogs > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-xl p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-2 font-semibold ${learner.backlogs > 0 ? 'text-red-700' : 'text-green-700'}`}>Active Backlogs</p>
                      <p className={`text-4xl font-bold ${learner.backlogs > 0 ? 'text-red-600' : 'text-green-600'}`}>{learner.backlogs}</p>
                    </div>
                    {learner.backlogs > 0 ? (
                      <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-10 w-10 text-green-500" />
                    )}
                  </div>
                </div>
                
                <div className={`${learner.documents_verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-2 font-semibold ${learner.documents_verified ? 'text-green-700' : 'text-yellow-700'}`}>Documents</p>
                      <p className={`text-xl font-bold ${learner.documents_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {learner.documents_verified ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                    {learner.documents_verified ? (
                      <CheckCircleIcon className="h-10 w-10 text-green-500" />
                    ) : (
                      <ClockIcon className="h-10 w-10 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility Checklist */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />
                Graduation Eligibility Checklist
              </h4>
              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  learner.credits_earned >= learner.credits_required 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {learner.credits_earned >= learner.credits_required ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Credits Requirement</span>
                    <p className="text-xs text-gray-600 mt-1">
                      {learner.credits_earned}/{learner.credits_required} credits completed
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  learner.backlogs === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {learner.backlogs === 0 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-gray-900">No Active Backlogs</span>
                    <p className="text-xs text-gray-600 mt-1">
                      {learner.backlogs === 0 ? 'All subjects cleared' : `${learner.backlogs} subjects pending`}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  learner.cgpa >= 6.0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {learner.cgpa >= 6.0 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Minimum CGPA Requirement</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Current: {learner.cgpa.toFixed(2)} (Required: 6.0)
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  learner.documents_verified 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  {learner.documents_verified ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <ClockIcon className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Document Verification</span>
                    <p className="text-xs text-gray-600 mt-1">
                      {learner.documents_verified ? 'All documents verified' : 'Verification pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
                Learner Timeline
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">Enrolled:</span>
                    <p className="text-gray-600 mt-1">{new Date(learner.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Last Updated:</span>
                    <p className="text-gray-600 mt-1">{new Date(learner.last_updated).toLocaleDateString()}</p>
                  </div>
                  {learner.graduation_date && (
                    <div>
                      <span className="font-semibold text-gray-900">Graduation Date:</span>
                      <p className="text-gray-600 mt-1">{new Date(learner.graduation_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Main Component
const GraduationEligibility: React.FC = () => {
  // State
  const [learners, setlearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionTitle, setActionTitle] = useState<string>('');

  const [filters, setFilters] = useState({
    departments: [] as string[],
    semesters: [] as string[],
    statuses: [] as string[],
    eligibility: [] as string[],
  });

  // Mock data for demonstration - In real app, this would come from Supabase
  const mocklearners: Learner[] = [
    {
      id: '1',
      name: 'Arjun Sharma',
      email: 'arjun.sharma@college.edu',
      phone: '+91 9876543210',
      dept: 'Computer Science',
      college: 'ABC Engineering College',
      semester: 8,
      credits_earned: 180,
      credits_required: 180,
      cgpa: 8.5,
      backlogs: 0,
      pipeline_status: 'enrolled',
      eligibility_flag: true,
      documents_verified: true,
      created_at: '2021-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya.patel@college.edu',
      phone: '+91 9876543211',
      dept: 'Electronics Engineering',
      college: 'ABC Engineering College',
      semester: 8,
      credits_earned: 175,
      credits_required: 180,
      cgpa: 7.8,
      backlogs: 1,
      pipeline_status: 'enrolled',
      eligibility_flag: false,
      documents_verified: true,
      created_at: '2021-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
    {
      id: '3',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@college.edu',
      phone: '+91 9876543212',
      dept: 'Mechanical Engineering',
      college: 'ABC Engineering College',
      semester: 7,
      credits_earned: 150,
      credits_required: 180,
      cgpa: 9.2,
      backlogs: 0,
      pipeline_status: 'enrolled',
      eligibility_flag: false,
      documents_verified: true,
      created_at: '2021-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
    {
      id: '4',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@college.edu',
      phone: '+91 9876543213',
      dept: 'Computer Science',
      college: 'ABC Engineering College',
      semester: 8,
      credits_earned: 180,
      credits_required: 180,
      cgpa: 8.9,
      backlogs: 0,
      pipeline_status: 'graduated',
      eligibility_flag: true,
      graduation_date: '2024-06-15T00:00:00Z',
      documents_verified: true,
      created_at: '2021-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
    {
      id: '5',
      name: 'Vikram Singh',
      email: 'vikram.singh@college.edu',
      phone: '+91 9876543214',
      dept: 'Civil Engineering',
      college: 'ABC Engineering College',
      semester: 6,
      credits_earned: 120,
      credits_required: 180,
      cgpa: 7.5,
      backlogs: 0,
      pipeline_status: 'enrolled',
      eligibility_flag: false,
      documents_verified: false,
      created_at: '2022-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
    {
      id: '6',
      name: 'Ananya Gupta',
      email: 'ananya.gupta@college.edu',
      phone: '+91 9876543215',
      dept: 'Information Technology',
      college: 'ABC Engineering College',
      semester: 8,
      credits_earned: 180,
      credits_required: 180,
      cgpa: 8.7,
      backlogs: 0,
      pipeline_status: 'alumni',
      eligibility_flag: true,
      graduation_date: '2024-06-15T00:00:00Z',
      documents_verified: true,
      created_at: '2020-08-15T00:00:00Z',
      last_updated: '2024-12-10T00:00:00Z',
    },
  ];

  // Initialize with mock data
  useEffect(() => {
    setlearners(mocklearners);
    setLoading(false);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Generate filter options from data
  const departmentOptions = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    learners.forEach((s) => {
      if (s.dept) {
        deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
      }
    });
    return Object.entries(deptCounts).map(([dept, count]) => ({
      value: dept,
      label: dept,
      count,
    }));
  }, [learners]);

  const semesterOptions = useMemo(() => {
    const semCounts: Record<string, number> = {};
    learners.forEach((s) => {
      const sem = s.semester.toString();
      semCounts[sem] = (semCounts[sem] || 0) + 1;
    });
    return Object.entries(semCounts)
      .map(([sem, count]) => ({
        value: sem,
        label: `Semester ${sem}`,
        count,
      }))
      .sort((a, b) => parseInt(a.value) - parseInt(b.value));
  }, [learners]);

  const statusOptions = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    learners.forEach((s) => {
      statusCounts[s.pipeline_status] = (statusCounts[s.pipeline_status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  }, [learners]);

  const eligibilityOptions = [
    { value: 'eligible', label: 'Eligible', count: learners.filter(s => s.eligibility_flag).length },
    { value: 'ineligible', label: 'Ineligible', count: learners.filter(s => !s.eligibility_flag).length },
  ];

  // Apply filters and sorting
  const filteredlearners = useMemo(() => {
    let filtered = learners;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.dept?.toLowerCase().includes(query)
      );
    }

    // Department filter
    if (filters.departments.length > 0) {
      filtered = filtered.filter((s) => filters.departments.includes(s.dept));
    }

    // Semester filter
    if (filters.semesters.length > 0) {
      filtered = filtered.filter((s) => filters.semesters.includes(s.semester.toString()));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((s) => filters.statuses.includes(s.pipeline_status));
    }

    // Eligibility filter
    if (filters.eligibility.length > 0) {
      filtered = filtered.filter((s) => {
        const isEligible = s.eligibility_flag;
        return (
          (filters.eligibility.includes('eligible') && isEligible) ||
          (filters.eligibility.includes('ineligible') && !isEligible)
        );
      });
    }

    // Sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'cgpa':
        sorted.sort((a, b) => b.cgpa - a.cgpa);
        break;
      case 'credits':
        sorted.sort((a, b) => (b.credits_earned / b.credits_required) - (a.credits_earned / a.credits_required));
        break;
      case 'semester':
        sorted.sort((a, b) => b.semester - a.semester);
        break;
      case 'eligibility':
        sorted.sort((a, b) => Number(b.eligibility_flag) - Number(a.eligibility_flag));
        break;
      default:
        break;
    }

    return sorted;
  }, [learners, searchQuery, filters, sortBy]);

  const totalItems = filteredlearners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedlearners = filteredlearners.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const total = learners.length;
    const eligible = learners.filter(s => s.eligibility_flag).length;
    const graduated = learners.filter(s => s.pipeline_status === 'graduated').length;
    const alumni = learners.filter(s => s.pipeline_status === 'alumni').length;
    const avgCgpa = learners.reduce((sum, s) => sum + s.cgpa, 0) / total;

    return { total, eligible, graduated, alumni, avgCgpa };
  }, [learners]);

  // Action handlers
  const handleViewDetails = (learner: Learner) => {
    setSelectedLearner(learner);
    setShowDetailsModal(true);
  };

  const handleMarkGraduated = (learner: Learner) => {
    setSelectedLearner(learner);
    setActionType('graduate');
    setActionTitle('Mark as Graduated');
    setShowActionModal(true);
  };

  const handlePromote = (learner: Learner) => {
    setSelectedLearner(learner);
    setActionType('promote');
    setActionTitle('Promote to Next Semester');
    setShowActionModal(true);
  };

  const handlePushToAlumni = (learner: Learner) => {
    setSelectedLearner(learner);
    setActionType('alumni');
    setActionTitle('Push to Alumni');
    setShowActionModal(true);
  };

  const handleOverrideEligibility = (learner: Learner) => {
    setSelectedLearner(learner);
    setActionType('override');
    setActionTitle('Override Eligibility');
    setShowActionModal(true);
  };

  const handleActionConfirm = async (reason?: string) => {
    if (!selectedLearner) return;

    try {
      // In a real app, this would make API calls to update the database
      logger.info('Learner action performed', { actionType, learnerName: selectedLearner.name, reason });
      
      // Update local state for demo
      setlearners(prev => prev.map(s => {
        if (s.id === selectedLearner.id) {
          switch (actionType) {
            case 'graduate':
              return { ...s, pipeline_status: 'graduated', graduation_date: new Date().toISOString() };
            case 'promote':
              return { ...s, semester: s.semester + 1 };
            case 'alumni':
              return { ...s, pipeline_status: 'alumni' };
            case 'override':
              return { ...s, eligibility_flag: true };
            default:
              return s;
          }
        }
        return s;
      }));

      // Show success message (you can add toast notification here)
      toast.success(`Action completed successfully!`);
    } catch (error) {
      logger.error('Action failed:', error as Error);
      toast.error('Action failed. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      departments: [],
      semesters: [],
      statuses: [],
      eligibility: [],
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateEligibilityList = () => {
    const eligiblelearners = learners.filter(s => s.eligibility_flag);
    logger.info('Generating eligibility list', { eligibleCount: eligiblelearners.length });
    toast.success(`Generated eligibility list for ${eligiblelearners.length} learners`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading graduation data...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-indigo-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2 sm:gap-3">
              <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Graduation & Alumni Management</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage graduation eligibility, certify readiness, and track alumni transitions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleGenerateEligibilityList}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Generate Eligibility List</span>
              <span className="sm:hidden">Generate List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Learners"
          value={stats.total}
          icon={<UserGroupIcon className="h-6 w-6" />}
          color="blue"
        />

        <KPICard
          title="Eligible for Graduation"
          value={stats.eligible}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          color="green"
        />

        <KPICard
          title="Graduated"
          value={stats.graduated}
          icon={<AcademicCapIcon className="h-6 w-6" />}
          color="purple"
        />

        <KPICard
          title="Alumni"
          value={stats.alumni}
          icon={<TrophyIcon className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="flex-1 min-w-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, email, department..."
                size="md"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium relative"
              >
                <FunnelIcon className="h-4 w-4 flex-shrink-0" />
                <span>Filters</span>
                {(filters.departments.length + filters.semesters.length + filters.statuses.length + filters.eligibility.length) > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                    {filters.departments.length + filters.semesters.length + filters.statuses.length + filters.eligibility.length}
                  </span>
                )}
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[180px]"
              >
                <option value="name">Sort by Name</option>
                <option value="cgpa">Sort by CGPA</option>
                <option value="credits">Sort by Credits</option>
                <option value="semester">Sort by Semester</option>
                <option value="eligibility">Sort by Eligibility</option>
              </select>
              
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2.5 text-sm font-medium border-l border-gray-300 transition-colors ${viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Info - Now directly below search bar */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">{Math.min(endIndex, totalItems)}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span> learner{totalItems !== 1 ? 's' : ''}
            {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-full lg:w-80 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-0">
              <FilterSection title="Department" defaultOpen>
                <CheckboxGroup
                  options={departmentOptions}
                  selectedValues={filters.departments}
                  onChange={(values: string[]) => setFilters({ ...filters, departments: values })}
                />
              </FilterSection>

              <FilterSection title="Semester">
                <CheckboxGroup
                  options={semesterOptions}
                  selectedValues={filters.semesters}
                  onChange={(values: string[]) => setFilters({ ...filters, semesters: values })}
                />
              </FilterSection>

              <FilterSection title="Status">
                <CheckboxGroup
                  options={statusOptions}
                  selectedValues={filters.statuses}
                  onChange={(values: string[]) => setFilters({ ...filters, statuses: values })}
                />
              </FilterSection>

              <FilterSection title="Eligibility">
                <CheckboxGroup
                  options={eligibilityOptions}
                  selectedValues={filters.eligibility}
                  onChange={(values: string[]) => setFilters({ ...filters, eligibility: values })}
                />
              </FilterSection>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">


          {/* Learners Grid/Table */}
          {viewMode === 'grid' ? (
            <div className={`grid gap-6 ${
              showFilters 
                ? 'grid-cols-1 lg:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3'
            }`}>
              {paginatedlearners.map((learner) => (
                <LearnerCard
                  key={learner.id}
                  learner={learner}
                  onViewDetails={handleViewDetails}
                  onMarkGraduated={handleMarkGraduated}
                  onPromote={handlePromote}
                  onPushToAlumni={handlePushToAlumni}
                  onOverrideEligibility={handleOverrideEligibility}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Learner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eligibility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedlearners.map((learner) => (
                      <tr key={learner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {learner.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{learner.name}</div>
                              <div className="text-sm text-gray-500">{learner.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {learner.dept}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {learner.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {learner.credits_earned}/{learner.credits_required}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {learner.cgpa.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={learner.pipeline_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EligibilityBadge learner={learner} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(learner)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {learner.eligibility_flag && learner.pipeline_status === 'enrolled' && (
                              <button
                                onClick={() => handleMarkGraduated(learner)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <AcademicCapIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              
              <p className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}

          {/* Empty State */}
          {paginatedlearners.length === 0 && !loading && (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No learners found</h3>
              <p className="text-gray-500">
                {searchQuery || Object.values(filters).some(f => f.length > 0)
                  ? 'Try adjusting your search or filters'
                  : 'No learners are currently enrolled in the system'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LearnerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        learner={selectedLearner}
      />

      <ActionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionTitle}
        learner={selectedLearner}
        actionType={actionType}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
};

export default GraduationEligibility;