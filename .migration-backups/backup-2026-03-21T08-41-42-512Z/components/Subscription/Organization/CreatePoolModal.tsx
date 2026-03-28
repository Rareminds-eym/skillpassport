/**
 * CreatePoolModal Component
 * 
 * Modal wizard for creating a new license pool.
 * Allows setting pool name, member type, seat allocation, and auto-assign settings.
 */

import { AlertCircle, Layers, Settings, Users, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poolData: PoolFormData) => Promise<void>;
  totalAvailableSeats: number;
  organizationId: string;
  subscriptionId: string;
  isLoading?: boolean;
}

export interface PoolFormData {
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  autoAssignNewMembers: boolean;
  assignmentCriteria?: {
    departments?: string[];
    grades?: string[];
  };
}

function CreatePoolModal({
  isOpen,
  onClose,
  onSubmit,
  totalAvailableSeats,
  isLoading = false,
}: CreatePoolModalProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PoolFormData>({
    poolName: '',
    memberType: 'student',
    allocatedSeats: Math.min(10, totalAvailableSeats),
    autoAssignNewMembers: false,
  });

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) || 0 : value,
    }));
    if (error) setError('');
  }, [error]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!formData.poolName.trim()) {
        setError('Pool name is required');
        return;
      }
      if (formData.poolName.length < 3) {
        setError('Pool name must be at least 3 characters');
        return;
      }
    }
    if (step === 2) {
      if (formData.allocatedSeats < 1) {
        setError('Must allocate at least 1 seat');
        return;
      }
      if (formData.allocatedSeats > totalAvailableSeats) {
        setError(`Cannot allocate more than ${totalAvailableSeats} available seats`);
        return;
      }
    }
    setStep(prev => prev + 1);
  }, [step, formData, totalAvailableSeats]);

  const handleBack = useCallback(() => {
    setStep(prev => prev - 1);
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setError('');
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        poolName: '',
        memberType: 'student',
        allocatedSeats: Math.min(10, totalAvailableSeats),
        autoAssignNewMembers: false,
      });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pool');
    }
  }, [formData, onSubmit, totalAvailableSeats]);

  const handleClose = useCallback(() => {
    setFormData({
      poolName: '',
      memberType: 'student',
      allocatedSeats: Math.min(10, totalAvailableSeats),
      autoAssignNewMembers: false,
    });
    setStep(1);
    setError('');
    onClose();
  }, [onClose, totalAvailableSeats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create License Pool</h2>
              <p className="text-sm text-blue-100">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Pool Details</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Give your pool a name and select the member type
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pool Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="poolName"
                    value={formData.poolName}
                    onChange={handleInputChange}
                    placeholder="e.g., Science Department, Grade 10 Students"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Member Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, memberType: 'student' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.memberType === 'student'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${
                        formData.memberType === 'student' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.memberType === 'student' ? 'text-blue-700' : 'text-gray-600'
                      }`}>Students</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, memberType: 'educator' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.memberType === 'educator'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${
                        formData.memberType === 'educator' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.memberType === 'educator' ? 'text-blue-700' : 'text-gray-600'
                      }`}>Educators</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Seat Allocation */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Allocate Seats</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how many seats to allocate to this pool
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Available Seats</span>
                  <span className="text-lg font-bold text-blue-700">{totalAvailableSeats}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Seats to Allocate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="allocatedSeats"
                  value={formData.allocatedSeats}
                  onChange={handleInputChange}
                  min={1}
                  max={totalAvailableSeats}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  You can allocate between 1 and {totalAvailableSeats} seats
                </p>
              </div>

              {/* Quick allocation buttons */}
              <div className="flex gap-2">
                {[10, 25, 50, 100].filter(n => n <= totalAvailableSeats).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, allocatedSeats: num }))}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      formData.allocatedSeats === num
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, allocatedSeats: totalAvailableSeats }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.allocatedSeats === totalAvailableSeats
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All ({totalAvailableSeats})
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Auto-assign Settings */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Auto-assign Settings</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configure automatic license assignment
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="autoAssignNewMembers"
                    checked={formData.autoAssignNewMembers}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Auto-assign to new members
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automatically assign licenses to new {formData.memberType}s when they join
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-blue-900">Pool Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Name</span>
                    <span className="font-medium text-blue-900">{formData.poolName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Member Type</span>
                    <span className="font-medium text-blue-900 capitalize">{formData.memberType}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Allocated Seats</span>
                    <span className="font-medium text-blue-900">{formData.allocatedSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Auto-assign</span>
                    <span className="font-medium text-blue-900">
                      {formData.autoAssignNewMembers ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Pool'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CreatePoolModal);
