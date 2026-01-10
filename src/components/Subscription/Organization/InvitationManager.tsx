/**
 * InvitationManager Component
 * 
 * Manages member invitations for organization subscriptions.
 * Supports sending individual/bulk invitations, viewing pending invitations,
 * and resend/cancel actions.
 */

import {
    AlertCircle,
    Check,
    Clock,
    Mail,
    MoreVertical,
    Plus,
    RefreshCw,
    Send,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';

interface Invitation {
  id: string;
  email: string;
  memberType: 'educator' | 'student';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedAt: string;
  expiresAt: string;
  autoAssignLicense: boolean;
  poolName?: string;
}

interface InvitationManagerProps {
  invitations: Invitation[];
  availableSeats: number;
  onSendInvitation: (email: string, memberType: 'educator' | 'student', autoAssign: boolean) => void;
  onBulkInvite: (emails: string[], memberType: 'educator' | 'student', autoAssign: boolean) => void;
  onResendInvitation: (invitationId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InvitationManager({
  invitations,
  availableSeats,
  onSendInvitation,
  onBulkInvite,
  onResendInvitation,
  onCancelInvitation,
  isLoading = false,
}: InvitationManagerProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState<'educator' | 'student'>('student');
  const [autoAssign, setAutoAssign] = useState(true);
  const [bulkEmails, setBulkEmails] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');

  const handleSendInvitation = useCallback(() => {
    if (email.trim()) {
      onSendInvitation(email.trim(), memberType, autoAssign);
      setEmail('');
      setShowInviteForm(false);
    }
  }, [email, memberType, autoAssign, onSendInvitation]);

  const handleBulkInvite = useCallback(() => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));
    if (emails.length > 0) {
      onBulkInvite(emails, memberType, autoAssign);
      setBulkEmails('');
      setShowBulkForm(false);
    }
  }, [bulkEmails, memberType, autoAssign, onBulkInvite]);

  const handleMenuAction = useCallback(
    (action: () => void) => {
      action();
      setOpenMenuId(null);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{pendingInvitations.length}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{acceptedInvitations.length}</div>
          <div className="text-sm text-gray-500">Accepted</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{availableSeats}</div>
          <div className="text-sm text-gray-500">Seats Available</div>
        </div>
      </div>

      {/* Invitation Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Invitations</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Invite members to join your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Bulk Invite
            </button>
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Invitation Form */}
        {showInviteForm && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Type
                </label>
                <select
                  value={memberType}
                  onChange={(e) => setMemberType(e.target.value as 'educator' | 'student')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoAssign"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoAssign" className="text-sm text-gray-700">
                  Auto-assign license
                </label>
              </div>
              <button
                onClick={handleSendInvitation}
                disabled={!email.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={() => setShowInviteForm(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bulk Invite Form */}
        {showBulkForm && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Addresses (one per line or comma-separated)
                </label>
                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder="member1@example.com&#10;member2@example.com&#10;member3@example.com"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as 'educator' | 'student')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="student">Students</option>
                    <option value="educator">Educators</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bulkAutoAssign"
                      checked={autoAssign}
                      onChange={(e) => setAutoAssign(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="bulkAutoAssign" className="text-sm text-gray-700">
                      Auto-assign licenses
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkForm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkInvite}
                    disabled={!bulkEmails.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send Invitations
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invitation List */}
        {invitations.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-1">No Invitations</h4>
            <p className="text-sm text-gray-500">
              Send invitations to add members to your organization.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      invitation.status === 'accepted'
                        ? 'bg-green-100'
                        : invitation.status === 'pending'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {invitation.status === 'accepted' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : invitation.status === 'pending' ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{invitation.email}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          invitation.memberType === 'educator'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {invitation.memberType === 'educator' ? 'Educator' : 'Student'}
                      </span>
                      <span>•</span>
                      <span>Invited {formatDate(invitation.invitedAt)}</span>
                      {invitation.autoAssignLicense && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600">Auto-assign</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : invitation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : invitation.status === 'expired'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </span>

                  {invitation.status === 'pending' && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === invitation.id ? null : invitation.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {openMenuId === invitation.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => handleMenuAction(() => onResendInvitation(invitation.id))}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Resend
                            </button>
                            <button
                              onClick={() => handleMenuAction(() => onCancelInvitation(invitation.id))}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(InvitationManager);
