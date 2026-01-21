/**
 * PoolAssignmentsModal Component
 *
 * Modal to view and manage members assigned to a license pool.
 */

import { Search, UserMinus, Users, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
}

interface AssignedMember {
  id: string;
  name: string;
  email: string;
  assignedAt: string;
  licenseAssignmentId?: string;
}

interface PoolAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnassign: (memberId: string, licenseAssignmentId: string) => Promise<void>;
  pool: LicensePool | null;
  assignedMembers: AssignedMember[];
  isLoading?: boolean;
}

function PoolAssignmentsModal({
  isOpen,
  onClose,
  onUnassign,
  pool,
  assignedMembers,
  isLoading = false,
}: PoolAssignmentsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return assignedMembers;
    const query = searchQuery.toLowerCase();
    return assignedMembers.filter(
      (m) => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
    );
  }, [assignedMembers, searchQuery]);

  const handleUnassign = useCallback(
    async (member: AssignedMember) => {
      if (!member.licenseAssignmentId) return;

      setUnassigningId(member.id);
      try {
        await onUnassign(member.id, member.licenseAssignmentId);
      } finally {
        setUnassigningId(null);
      }
    },
    [onUnassign]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  if (!isOpen || !pool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{pool.poolName}</h2>
              <p className="text-sm text-gray-500">
                {pool.assignedSeats} of {pool.allocatedSeats} seats assigned
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading assignments...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">
                {searchQuery ? 'No matching members' : 'No assignments yet'}
              </h4>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Assign members to this pool from the Members tab'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      Assigned {new Date(member.assignedAt).toLocaleDateString()}
                    </span>
                    {member.licenseAssignmentId && (
                      <button
                        onClick={() => handleUnassign(member)}
                        disabled={unassigningId === member.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Unassign license"
                      >
                        {unassigningId === member.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} shown
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(PoolAssignmentsModal);
