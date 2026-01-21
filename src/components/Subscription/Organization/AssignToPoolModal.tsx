/**
 * AssignToPoolModal Component
 *
 * Modal for selecting which license pool to assign members to.
 */

import { AlertCircle, Layers, UserPlus, Users, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  isActive: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  memberType: 'educator' | 'student';
}

interface AssignToPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (poolId: string, memberIds: string[]) => Promise<void>;
  pools: LicensePool[];
  membersToAssign: Member[];
  isLoading?: boolean;
}

function AssignToPoolModal({
  isOpen,
  onClose,
  onConfirm,
  pools,
  membersToAssign,
  isLoading = false,
}: AssignToPoolModalProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [error, setError] = useState('');

  // Filter pools that have available seats and match member types
  const memberTypes = new Set(membersToAssign.map((m) => m.memberType));
  const availablePools = pools.filter((p) => {
    if (!p.isActive || p.availableSeats < membersToAssign.length) return false;
    // If assigning students, pool must be for students
    // If assigning educators, pool must be for educators
    // If mixed, show all pools with enough seats
    if (memberTypes.size === 1) {
      const type = Array.from(memberTypes)[0];
      return p.memberType === type;
    }
    return true;
  });

  const handleConfirm = useCallback(async () => {
    if (!selectedPoolId) {
      setError('Please select a license pool');
      return;
    }

    const selectedPool = pools.find((p) => p.id === selectedPoolId);
    if (!selectedPool) {
      setError('Selected pool not found');
      return;
    }

    if (selectedPool.availableSeats < membersToAssign.length) {
      setError(
        `Not enough seats. Pool has ${selectedPool.availableSeats} available, need ${membersToAssign.length}`
      );
      return;
    }

    try {
      setError('');
      await onConfirm(
        selectedPoolId,
        membersToAssign.map((m) => m.id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign licenses');
    }
  }, [selectedPoolId, pools, membersToAssign, onConfirm]);

  const handleClose = useCallback(() => {
    setSelectedPoolId('');
    setError('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Assign to Pool</h2>
              <p className="text-sm text-blue-100">
                {membersToAssign.length} member{membersToAssign.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Members Preview */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Members to assign:</h4>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {membersToAssign.slice(0, 5).map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.memberType === 'educator' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                    />
                    {member.name}
                  </span>
                ))}
                {membersToAssign.length > 5 && (
                  <span className="px-2 py-1 text-sm text-gray-500">
                    +{membersToAssign.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pool Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select license pool:</h4>

            {availablePools.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <Layers className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-800 font-medium">No suitable pools available</p>
                <p className="text-xs text-amber-600 mt-1">
                  {pools.length === 0
                    ? 'Create a license pool first'
                    : 'No pools have enough available seats or match the member type'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availablePools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => {
                      setSelectedPoolId(pool.id);
                      setError('');
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPoolId === pool.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedPoolId === pool.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          <Users
                            className={`w-5 h-5 ${
                              selectedPoolId === pool.id ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{pool.poolName}</h5>
                          <p className="text-xs text-gray-500">
                            {pool.memberType === 'educator' ? 'Educators' : 'Students'} •
                            {pool.availableSeats} seats available
                          </p>
                        </div>
                      </div>
                      {selectedPoolId === pool.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Seat usage bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{pool.assignedSeats} assigned</span>
                        <span>{pool.allocatedSeats} total</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pool.assignedSeats / pool.allocatedSeats) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
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
            onClick={handleConfirm}
            disabled={isLoading || !selectedPoolId || availablePools.length === 0}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign to Pool
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AssignToPoolModal);
