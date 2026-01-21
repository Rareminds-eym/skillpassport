/**
 * EditPoolModal Component
 *
 * Modal for editing an existing license pool.
 */

import { AlertCircle, Edit2, X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  autoAssignNewMembers: boolean;
  isActive: boolean;
}

interface EditPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poolId: string, updates: PoolUpdateData) => Promise<void>;
  pool: LicensePool | null;
  maxAdditionalSeats: number;
  isLoading?: boolean;
}

export interface PoolUpdateData {
  poolName?: string;
  allocatedSeats?: number;
  autoAssignNewMembers?: boolean;
  isActive?: boolean;
}

function EditPoolModal({
  isOpen,
  onClose,
  onSubmit,
  pool,
  maxAdditionalSeats,
  isLoading = false,
}: EditPoolModalProps) {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PoolUpdateData>({
    poolName: '',
    allocatedSeats: 0,
    autoAssignNewMembers: false,
    isActive: true,
  });

  // Initialize form data when pool changes
  useEffect(() => {
    if (pool) {
      setFormData({
        poolName: pool.poolName,
        allocatedSeats: pool.allocatedSeats,
        autoAssignNewMembers: pool.autoAssignNewMembers,
        isActive: pool.isActive,
      });
    }
  }, [pool]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
      }));
      if (error) setError('');
    },
    [error]
  );

  const handleSubmit = useCallback(async () => {
    if (!pool) return;

    if (!formData.poolName?.trim()) {
      setError('Pool name is required');
      return;
    }

    if ((formData.allocatedSeats || 0) < (pool.assignedSeats || 0)) {
      setError(`Cannot reduce seats below ${pool.assignedSeats} (currently assigned)`);
      return;
    }

    const maxAllowed = pool.allocatedSeats + maxAdditionalSeats;
    if ((formData.allocatedSeats || 0) > maxAllowed) {
      setError(`Cannot allocate more than ${maxAllowed} seats`);
      return;
    }

    try {
      setError('');
      await onSubmit(pool.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pool');
    }
  }, [pool, formData, maxAdditionalSeats, onSubmit]);

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

  if (!isOpen || !pool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Pool</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pool Name</label>
            <input
              type="text"
              name="poolName"
              value={formData.poolName || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Allocated Seats
            </label>
            <input
              type="number"
              name="allocatedSeats"
              value={formData.allocatedSeats || 0}
              onChange={handleInputChange}
              min={pool.assignedSeats}
              max={pool.allocatedSeats + maxAdditionalSeats}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: {pool.assignedSeats} (assigned) | Max: {pool.allocatedSeats + maxAdditionalSeats}{' '}
              (available)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoAssign"
              name="autoAssignNewMembers"
              checked={formData.autoAssignNewMembers || false}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoAssign" className="text-sm text-gray-700">
              Auto-assign to new members
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive || false}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Pool is active
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EditPoolModal);
