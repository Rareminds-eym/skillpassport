/**
 * LicensePoolManager Component
 *
 * Manages license pools for organization subscriptions.
 * Allows creating, editing, and viewing pool allocations.
 */

import { Edit2, MoreVertical, Plus, Settings, Trash2, Users } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  autoAssignNewMembers: boolean;
  isActive: boolean;
  createdAt: string;
}

interface LicensePoolManagerProps {
  pools: LicensePool[];
  totalAvailableSeats: number;
  onCreatePool: () => void;
  onEditPool: (poolId: string) => void;
  onDeletePool: (poolId: string) => void;
  onConfigureAutoAssign: (poolId: string) => void;
  onViewAssignments: (poolId: string) => void;
  isLoading?: boolean;
}

function LicensePoolManager({
  pools,
  totalAvailableSeats,
  onCreatePool,
  onEditPool,
  onDeletePool,
  onConfigureAutoAssign,
  onViewAssignments,
  isLoading = false,
}: LicensePoolManagerProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuToggle = useCallback((poolId: string) => {
    setOpenMenuId((prev) => (prev === poolId ? null : poolId));
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    setOpenMenuId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">License Pools</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Organize and allocate seats to different groups
          </p>
        </div>
        <button
          onClick={onCreatePool}
          disabled={totalAvailableSeats === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Pool
        </button>
      </div>

      {/* Available Seats Banner */}
      {totalAvailableSeats > 0 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            <strong>{totalAvailableSeats}</strong> unallocated seats available
          </span>
          <button
            onClick={onCreatePool}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Allocate to pool →
          </button>
        </div>
      )}

      {/* Pool List */}
      {pools.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No License Pools</h4>
          <p className="text-sm text-gray-500 mb-4">
            Create pools to organize seat allocation by department, grade, or role.
          </p>
          <button
            onClick={onCreatePool}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first pool
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {pools.map((pool) => {
            const utilization =
              pool.allocatedSeats > 0
                ? Math.round((pool.assignedSeats / pool.allocatedSeats) * 100)
                : 0;

            return (
              <div
                key={pool.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !pool.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{pool.poolName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          pool.memberType === 'educator'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {pool.memberType === 'educator' ? 'Educators' : 'Students'}
                      </span>
                      {pool.autoAssignNewMembers && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          Auto-assign
                        </span>
                      )}
                      {!pool.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Seat allocation */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {pool.assignedSeats} / {pool.allocatedSeats} seats assigned
                        </span>
                        <span className="text-gray-500">{utilization}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilization >= 90
                              ? 'bg-red-500'
                              : utilization >= 70
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>{pool.availableSeats} available</span>
                      <button
                        onClick={() => onViewAssignments(pool.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View assignments →
                      </button>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => handleMenuToggle(pool.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Pool actions"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenuId === pool.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleAction(() => onEditPool(pool.id))}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Pool
                          </button>
                          <button
                            onClick={() => handleAction(() => onConfigureAutoAssign(pool.id))}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Auto-assign Settings
                          </button>
                          <button
                            onClick={() => handleAction(() => onViewAssignments(pool.id))}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            View Assignments
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => handleAction(() => onDeletePool(pool.id))}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Pool
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(LicensePoolManager);
