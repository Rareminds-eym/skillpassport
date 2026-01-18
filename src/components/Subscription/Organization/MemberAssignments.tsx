/**
 * MemberAssignments Component
 * 
 * Manages license assignments to organization members.
 * Supports search, bulk selection, assign/unassign actions, and assignment history.
 */

import {
    ArrowLeftRight,
    Check,
    ChevronDown,
    Clock,
    Search,
    Trash2,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import AddStudentModal from '../../educator/modals/Addstudentmodal';

interface Member {
  id: string;
  name: string;
  email: string;
  memberType: 'educator' | 'student';
  department?: string;
  hasLicense: boolean;
  assignedAt?: string;
  poolName?: string;
}

interface MemberAssignmentsProps {
  members: Member[];
  availableSeats: number;
  onAssign: (memberIds: string[]) => void;
  onUnassign: (memberIds: string[]) => void;
  onTransfer: (fromMemberId: string, toMemberId: string) => void;
  onViewHistory: (memberId: string) => void;
  onRemoveMember?: (memberId: string, memberType: 'educator' | 'student') => void;
  onMemberAdded?: () => void;
  isLoading?: boolean;
}

function MemberAssignments({
  members,
  availableSeats,
  onAssign,
  onUnassign,
  onTransfer,
  onViewHistory,
  onRemoveMember,
  onMemberAdded,
  isLoading = false,
}: MemberAssignmentsProps) {
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [memberTypeFilter, setMemberTypeFilter] = useState<'all' | 'educator' | 'student'>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState<string | null>(null);
  
  // Remove member confirmation modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Assignment filter
      const matchesAssignment =
        filterType === 'all' ||
        (filterType === 'assigned' && member.hasLicense) ||
        (filterType === 'unassigned' && !member.hasLicense);

      // Member type filter
      const matchesMemberType =
        memberTypeFilter === 'all' || member.memberType === memberTypeFilter;

      return matchesSearch && matchesAssignment && matchesMemberType;
    });
  }, [members, searchQuery, filterType, memberTypeFilter]);

  // Selection helpers
  const selectedMembers = useMemo(
    () => filteredMembers.filter((m) => selectedIds.has(m.id)),
    [filteredMembers, selectedIds]
  );

  const selectedAssigned = useMemo(
    () => selectedMembers.filter((m) => m.hasLicense),
    [selectedMembers]
  );

  const selectedUnassigned = useMemo(
    () => selectedMembers.filter((m) => !m.hasLicense),
    [selectedMembers]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  }, [filteredMembers, selectedIds.size]);

  const handleSelectMember = useCallback((memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const handleBulkAssign = useCallback(() => {
    const unassignedIds = selectedUnassigned.map((m) => m.id);
    if (unassignedIds.length > 0) {
      onAssign(unassignedIds);
      setSelectedIds(new Set());
    }
  }, [selectedUnassigned, onAssign]);

  const handleBulkUnassign = useCallback(() => {
    const assignedIds = selectedAssigned.map((m) => m.id);
    if (assignedIds.length > 0) {
      onUnassign(assignedIds);
      setSelectedIds(new Set());
    }
  }, [selectedAssigned, onUnassign]);

  const handleStartTransfer = useCallback((memberId: string) => {
    setTransferSource(memberId);
    setShowTransferModal(true);
  }, []);

  const handleCompleteTransfer = useCallback(
    (toMemberId: string) => {
      if (transferSource) {
        onTransfer(transferSource, toMemberId);
        setShowTransferModal(false);
        setTransferSource(null);
      }
    },
    [transferSource, onTransfer]
  );

  const handleOpenRemoveModal = useCallback((member: Member) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!memberToRemove || !onRemoveMember) return;
    
    setIsRemoving(true);
    try {
      await onRemoveMember(memberToRemove.id, memberToRemove.memberType);
      setShowRemoveModal(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsRemoving(false);
    }
  }, [memberToRemove, onRemoveMember]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Member Assignments</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {availableSeats} seats available for assignment
            </p>
          </div>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Assignment Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Members</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Member Type Filter */}
          <div className="relative">
            <select
              value={memberTypeFilter}
              onChange={(e) => setMemberTypeFilter(e.target.value as typeof memberTypeFilter)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="educator">Educators</option>
              <option value="student">Students</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            <strong>{selectedIds.size}</strong> member{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            {selectedUnassigned.length > 0 && availableSeats >= selectedUnassigned.length && (
              <button
                onClick={handleBulkAssign}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Assign ({selectedUnassigned.length})
              </button>
            )}
            {selectedAssigned.length > 0 && (
              <button
                onClick={handleBulkUnassign}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                Unassign ({selectedAssigned.length})
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No Members Found</h4>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery 
              ? 'Try adjusting your search or filters' 
              : members.length === 0 
                ? 'Add students and educators to your organization first'
                : 'No members match the current filters'}
          </p>
          {members.length === 0 && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Select All Header */}
          <div className="px-5 py-2 bg-gray-50 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredMembers.length && filteredMembers.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-500 uppercase">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Member Rows */}
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                selectedIds.has(member.id) ? 'bg-blue-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(member.id)}
                onChange={() => handleSelectMember(member.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{member.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      member.memberType === 'educator'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {member.memberType === 'educator' ? 'Educator' : 'Student'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 truncate">{member.email}</div>
              </div>

              {/* Assignment Status */}
              <div className="flex items-center gap-3">
                {member.hasLicense ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Assigned
                    </span>
                    {member.poolName && (
                      <span className="text-xs text-gray-500">{member.poolName}</span>
                    )}
                  </div>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    Unassigned
                  </span>
                )}

                {/* Individual Actions */}
                <div className="flex items-center gap-1">
                  {member.hasLicense ? (
                    <>
                      <button
                        onClick={() => handleStartTransfer(member.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Transfer license"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onUnassign([member.id])}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Unassign license"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAssign([member.id])}
                      disabled={availableSeats === 0}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Assign license"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onViewHistory(member.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="View history"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  {onRemoveMember && (
                    <button
                      onClick={() => handleOpenRemoveModal(member)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove from organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && transferSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Transfer License</h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferSource(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Select a member to transfer the license to:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {members
                  .filter((m) => !m.hasLicense && m.id !== transferSource)
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleCompleteTransfer(member.id)}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
          onMemberAdded?.();
        }}
      />

      {/* Remove Member Confirmation Modal */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Remove Member</h3>
              </div>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setMemberToRemove(null);
                }}
                disabled={isRemoving}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove this member from your organization?
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="font-medium text-gray-900">{memberToRemove.name}</div>
                <div className="text-sm text-gray-500">{memberToRemove.email}</div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    memberToRemove.memberType === 'educator'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {memberToRemove.memberType === 'educator' ? 'Educator' : 'Student'}
                  </span>
                  {memberToRemove.hasLicense && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      Has License
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This will remove the member's association with your organization. 
                  {memberToRemove.hasLicense && ' Their license will also be revoked.'}
                  {' '}The member's account will not be deleted.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setMemberToRemove(null);
                }}
                disabled={isRemoving}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRemoving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MemberAssignments);
