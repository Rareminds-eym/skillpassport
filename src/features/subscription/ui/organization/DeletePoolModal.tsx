/**
 * DeletePoolModal Component
 * 
 * Confirmation modal for deleting a license pool.
 */

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
}

interface DeletePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (poolId: string) => Promise<void>;
  pool: LicensePool | null;
  isLoading?: boolean;
}

function DeletePoolModal({
  isOpen,
  onClose,
  onConfirm,
  pool,
  isLoading = false,
}: DeletePoolModalProps) {
  const [error, setError] = useState('');

  const handleConfirm = useCallback(async () => {
    if (!pool) return;
    
    try {
      setError('');
      await onConfirm(pool.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pool');
    }
  }, [pool, onConfirm]);

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

  if (!isOpen || !pool) return null;

  const hasAssignedSeats = pool.assignedSeats > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-900">Delete Pool</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-red-100 rounded-lg">
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasAssignedSeats ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Cannot Delete Pool</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This pool has {pool.assignedSeats} assigned license(s). 
                    Please unassign all licenses before deleting the pool.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the pool <strong>"{pool.poolName}"</strong>?
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pool Name</span>
                  <span className="font-medium text-gray-900">{pool.poolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Type</span>
                  <span className="font-medium text-gray-900 capitalize">{pool.memberType}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Allocated Seats</span>
                  <span className="font-medium text-gray-900">{pool.allocatedSeats}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                The {pool.allocatedSeats} allocated seats will be returned to the available pool.
              </p>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
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
          {!hasAssignedSeats && (
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Pool'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(DeletePoolModal);
