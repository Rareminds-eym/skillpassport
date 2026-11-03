/**
 * InvitationManager Component
 * 
 * Manages member invitations for organizations.
 * Allows sending, viewing, resending, and cancelling invitations.
 */

import {
  memberInvitationService,
  OrganizationInvitation,
} from '@/entities/organization';
import type { EmailStatus, SsoPendingInvite } from '@/entities/organization/api/memberInvitationService';
import { SsoWorkflowError } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import {
  AlertCircle,
  Check,
  Clock,
  Mail,
  MailPlus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const logger = getLogger('invitation-manager');

const UNIVERSITY_EDUCATOR_MESSAGE = 'Educator invitations are not supported for university organizations.';
const EDUCATOR_NOTE =
  'Educator invitations are sent by email through the central sign-in service. They have no subscription or personal message.';

/**
 * Maps an SSO rejection code to a user-facing message. Raw SSO text is never shown.
 * Returns null when the call was cancelled (no message).
 */
function educatorInviteErrorMessage(err: unknown): string | null {
  if (err instanceof Error && err.name === 'EducatorInviteUnsupportedError') return UNIVERSITY_EDUCATOR_MESSAGE;
  if (!(err instanceof SsoWorkflowError)) return 'Could not send the invitation.';
  switch (err.code) {
    case 'not_authorized':
      return 'Only organization administrators can invite educators, and this organization must be your active organization. Switch to it or ask an administrator.';
    case 'conflict':
      return 'An invitation is already pending for this email. Use Resend in the Pending invitations list.';
    case 'invalid_input':
      return 'Enter a valid email address.';
    case 'not_authenticated':
      return 'Your session has ended. Sign in again.';
    case 'rate_limited':
      return 'Too many invitations sent. Try again later.';
    case 'timeout':
    case 'network_failure':
    case 'upstream_unavailable':
      return 'Could not reach the sign-in service. Try again.';
    case 'cancelled':
      return null;
    default:
      return 'Could not send the invitation.';
  }
}

/** Maps a resend failure to a user-facing message. Raw SSO text is never shown; null means stay silent. */
function resendErrorMessage(err: unknown): string | null {
  if (!(err instanceof SsoWorkflowError)) return 'Could not resend the invitation.';
  switch (err.code) {
    case 'rate_limited':
      return 'Too many invitations sent. Try again later.';
    case 'not_authorized':
      return 'Only organization administrators can resend invitations, and this organization must be your active organization.';
    case 'conflict':
      return 'This invitation was already accepted.';
    case 'not_found':
      return 'This invitation no longer exists.';
    case 'not_authenticated':
      return 'Your session has ended. Sign in again.';
    case 'timeout':
    case 'network_failure':
    case 'upstream_unavailable':
      return 'Could not reach the sign-in service. Try again.';
    case 'cancelled':
      return null;
    default:
      return 'Could not resend the invitation.';
  }
}

/** Maps a pending-invitations list failure to a message shown inside the card. */
function listErrorMessage(err: unknown): string {
  if (err instanceof SsoWorkflowError && err.code === 'not_authorized') {
    return 'Only organization administrators can view pending invitations.';
  }
  return 'Could not load pending invitations.';
}

const EMAIL_NOTICE_TEXT = {
  created: {
    failed: 'Invite created, but the email could not be delivered. Use Resend.',
    unconfirmed: 'Invitation created. Delivery could not be confirmed. Use Resend if the invitee did not receive it.',
  },
  resent: {
    failed: 'The invitation was renewed, but the email could not be delivered. The previous link no longer works. Use Resend to try again.',
    unconfirmed: 'Invitation renewed. Delivery could not be confirmed. Use Resend if the invitee did not receive it.',
  },
} as const;

type EmailNotice = { kind: 'created' | 'resent'; delivery: 'failed' | 'unconfirmed' };

/** Fixed locale and UTC zone so the output does not depend on the viewer's machine. */
function formatInviteDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function inviteRoleLabel(roles: readonly string[]): string {
  if (roles.length === 0) return 'Member';
  return roles
    .map((role) => {
      if (role === 'college_educator' || role === 'school_educator') return 'Educator';
      const spaced = role.replace(/_/g, ' ');
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    })
    .join(', ');
}

const SSO_INVITES_CAP = 100;

const EMPTY_INVITE_FORM = {
  email: '',
  memberType: 'learner' as 'educator' | 'learner',
  autoAssignSubscription: false,
  licensePoolId: '',
  invitationMessage: '',
};

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'learner';
  availableSeats: number;
}

interface InvitationManagerProps {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  licensePools: LicensePool[];
  isLoading?: boolean;
}

function InvitationManager({
  organizationId,
  organizationType,
  licensePools,
  isLoading: externalLoading = false,
}: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'expired' | 'cancelled'>('all');

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
  const [isSending, setIsSending] = useState(false);

  // Pending SSO invitations (independent of the legacy list so one failure never hides the other)
  const [ssoInvites, setSsoInvites] = useState<readonly SsoPendingInvite[]>([]);
  const [ssoTruncated, setSsoTruncated] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(true);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<EmailNotice | null>(null);
  const ssoRequestId = useRef(0);

  // Cancel confirmation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<OrganizationInvitation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    cancelled: 0,
    acceptanceRate: 0,
  });

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [invitationsData, statsData] = await Promise.all([
        memberInvitationService.getAllInvitations(organizationId, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 100,
        }),
        memberInvitationService.getInvitationStats(organizationId),
      ]);

      setInvitations(invitationsData);
      setStats(statsData);
    } catch (err) {
      logger.error('Failed to fetch invitations', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, statusFilter]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const fetchSsoInvites = useCallback(async () => {
    if (!organizationId) return;
    const requestId = ++ssoRequestId.current;
    setSsoLoading(true);
    setSsoError(null);
    try {
      const result = await memberInvitationService.listSsoInvites(organizationId);
      if (requestId !== ssoRequestId.current) return;
      setSsoInvites(result.invites);
      setSsoTruncated(result.truncated);
    } catch (err) {
      if (requestId !== ssoRequestId.current) return;
      logger.error('Failed to fetch pending SSO invitations', err instanceof Error ? err : new Error(String(err)));
      if (!(err instanceof SsoWorkflowError && err.code === 'cancelled')) setSsoError(listErrorMessage(err));
    } finally {
      if (requestId === ssoRequestId.current) setSsoLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    setSsoInvites([]);
    setSsoTruncated(false);
    fetchSsoInvites();
  }, [fetchSsoInvites]);

  const handleSendInvitation = useCallback(async () => {
    if (!inviteForm.email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (inviteForm.memberType === 'educator') {
      if (organizationType === 'university') {
        toast.error(UNIVERSITY_EDUCATOR_MESSAGE);
        return;
      }
      setIsSending(true);
      try {
        const created = await memberInvitationService.inviteEducator({
          organizationId,
          organizationType,
          email: inviteForm.email,
        });
        const emailStatus: EmailStatus | undefined = created?.emailStatus;
        if (emailStatus === 'sent') {
          setEmailNotice(null);
          toast.success(`Invitation sent to ${inviteForm.email.trim().toLowerCase()}`);
        } else {
          // 'failed' or absent: never claim the email was sent.
          setEmailNotice({ kind: 'created', delivery: emailStatus === 'failed' ? 'failed' : 'unconfirmed' });
        }
        setIsInviteModalOpen(false);
        setInviteForm(EMPTY_INVITE_FORM);
        await fetchSsoInvites();
      } catch (err) {
        logger.error('Failed to send educator invitation', err instanceof Error ? err : new Error(String(err)));
        const message = educatorInviteErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setIsSending(false);
      }
      return;
    }

    setIsSending(true);

    try {
      await memberInvitationService.inviteMember({
        organizationId,
        organizationType,
        email: inviteForm.email,
        memberType: inviteForm.memberType,
        autoAssignSubscription: inviteForm.autoAssignSubscription,
        licensePoolId: inviteForm.autoAssignSubscription ? inviteForm.licensePoolId : undefined,
        invitationMessage: inviteForm.invitationMessage || undefined,
      });

      toast.success(`Invitation sent to ${inviteForm.email}`);
      setIsInviteModalOpen(false);
      setInviteForm(EMPTY_INVITE_FORM);

      await fetchInvitations();
    } catch (err) {
      logger.error('Failed to send invitation', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  }, [inviteForm, organizationId, organizationType, fetchInvitations, fetchSsoInvites]);

  const handleResendInvitation = useCallback(async (invitationId: string) => {
    try {
      await memberInvitationService.resendInvitation(invitationId);
      toast.success('Invitation resent');
      await fetchInvitations();
    } catch (err) {
      logger.error('Failed to resend invitation', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  }, [fetchInvitations]);

  const handleResendSsoInvite = useCallback(async (invite: SsoPendingInvite) => {
    setResendingId(invite.inviteId);
    try {
      const resent = await memberInvitationService.resendSsoInvite(invite.inviteId);
      const emailStatus: EmailStatus | undefined = resent?.emailStatus;
      if (emailStatus === 'sent') {
        setEmailNotice(null);
        toast.success(`Invitation resent to ${invite.email}. The previous link no longer works.`);
      } else {
        setEmailNotice({ kind: 'resent', delivery: emailStatus === 'failed' ? 'failed' : 'unconfirmed' });
      }
      await fetchSsoInvites();
    } catch (err) {
      logger.error('Failed to resend SSO invitation', err instanceof Error ? err : new Error(String(err)));
      const message = resendErrorMessage(err);
      if (message) toast.error(message);
      // The invite may have been accepted or removed meanwhile; show current state.
      if (err instanceof SsoWorkflowError && (err.code === 'conflict' || err.code === 'not_found')) {
        await fetchSsoInvites();
      }
    } finally {
      setResendingId(null);
    }
  }, [fetchSsoInvites]);

  const openCancelModal = useCallback((invitation: OrganizationInvitation) => {
    setInvitationToCancel(invitation);
    setCancelModalOpen(true);
  }, []);

  const handleCancelInvitation = useCallback(async () => {
    if (!invitationToCancel) return;

    setIsCancelling(true);
    try {
      await memberInvitationService.cancelInvitation(invitationToCancel.id);
      toast.success('Invitation cancelled');
      setCancelModalOpen(false);
      setInvitationToCancel(null);
      await fetchInvitations();
    } catch (err) {
      logger.error('Failed to cancel invitation', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setIsCancelling(false);
    }
  }, [invitationToCancel, fetchInvitations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Convert full role name to display name (learner -> Learner)
  const getMemberTypeDisplay = (memberType: string) => {
    if (memberType.includes('learner')) return 'Learner';
    if (memberType.includes('educator')) return 'Educator';
    return memberType;
  };

  // Check if member type is educator for icon display
  const isEducator = (memberType: string) => memberType.includes('educator');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"><Check className="w-3 h-3" /> Accepted</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"><X className="w-3 h-3" /> Expired</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"><X className="w-3 h-3" /> Cancelled</span>;
      default:
        return null;
    }
  };

  // Filter invitations by search query
  const filteredInvitations = invitations.filter(inv =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available pools for the selected member type
  const availablePools = licensePools.filter(
    pool => pool.memberType === inviteForm.memberType && pool.availableSeats > 0
  );

  if (isLoading || externalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-semibold text-red-800 mb-2">Error Loading Invitations</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchInvitations}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Sent</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Accepted</div>
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Acceptance Rate</div>
          <div className="text-2xl font-bold text-blue-600">{stats.acceptanceRate}%</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {emailNotice && (
        <div
          role={emailNotice.delivery === 'failed' ? 'alert' : 'status'}
          data-testid={emailNotice.delivery === 'failed' ? 'email-failed-notice' : 'email-unconfirmed-notice'}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${emailNotice.delivery === 'failed'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
        >
          <span>{EMAIL_NOTICE_TEXT[emailNotice.kind][emailNotice.delivery]}</span>
          <button
            type="button"
            onClick={() => setEmailNotice(null)}
            aria-label="Dismiss notice"
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending invitations sent through the central sign-in service */}
      <div className="bg-white rounded-xl border border-gray-200" data-testid="sso-invites">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pending invitations</h3>
        </div>
        {ssoLoading && ssoInvites.length === 0 && !ssoError ? (
          <p className="p-4 text-sm text-gray-500">Loading pending invitations...</p>
        ) : ssoError ? (
          <div className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">{ssoError}</p>
            <button
              type="button"
              onClick={fetchSsoInvites}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : ssoInvites.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No pending invitations.</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {ssoInvites.map((invite) => {
                const isResending = resendingId === invite.inviteId;
                const sent = formatInviteDate(invite.createdAt);
                const expires = formatInviteDate(invite.expiresAt);
                return (
                  <li key={invite.inviteId} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{invite.email}</div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                        <span>{inviteRoleLabel(invite.roles)}</span>
                        {sent && (<><span>•</span><span>Sent {sent}</span></>)}
                        {expires && (<><span>•</span><span>Expires {expires}</span></>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(invite.status)}
                      <button
                        type="button"
                        onClick={() => handleResendSsoInvite(invite)}
                        disabled={isResending}
                        aria-label={`Resend invitation to ${invite.email}`}
                        className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                      >
                        {isResending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Resend
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {ssoTruncated && (
              <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
                Showing the {SSO_INVITES_CAP} most recent pending invitations.
              </p>
            )}
          </>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-700">Earlier invitations</h3>

      {/* Invitations List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filteredInvitations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredInvitations.map(invitation => (
              <div key={invitation.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEducator(invitation.memberType) ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                    {isEducator(invitation.memberType) ? (
                      <Users className="w-5 h-5 text-blue-600" />
                    ) : (
                      <UserPlus className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{invitation.email}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{getMemberTypeDisplay(invitation.memberType)}</span>
                      {isEducator(invitation.memberType) && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                          aria-label="Legacy educator invitation"
                        >
                          Legacy
                        </span>
                      )}
                      <span>•</span>
                      <span>Sent {formatDate(invitation.createdAt)}</span>
                      {invitation.autoAssignSubscription && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">Auto-assign enabled</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(invitation.status)}

                  {invitation.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      {/* Legacy educator invitations are retired server-side; Resend could only fail. */}
                      {!isEducator(invitation.memberType) && (
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Resend Invitation"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openCancelModal(invitation)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No Invitations</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No invitations match your filters'
                : 'Start by inviting members to your organization'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Send First Invitation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MailPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Invite Member</h2>
                  <p className="text-sm text-blue-100">Send an invitation to join</p>
                </div>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="member@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Member Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Member Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteForm(prev => ({ ...prev, memberType: 'learner', licensePoolId: '' }))}
                    className={`p-3 rounded-xl border-2 transition-all ${inviteForm.memberType === 'learner'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <UserPlus className={`w-5 h-5 mx-auto mb-1 ${inviteForm.memberType === 'learner' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    <span className={`text-sm font-medium ${inviteForm.memberType === 'learner' ? 'text-blue-700' : 'text-gray-600'
                      }`}>Learner</span>
                  </button>
                  <button
                    type="button"
                    disabled={organizationType === 'university'}
                    aria-describedby={organizationType === 'university' ? 'educator-university-note' : undefined}
                    onClick={() => setInviteForm(prev => ({ ...prev, memberType: 'educator', autoAssignSubscription: false, licensePoolId: '', invitationMessage: '' }))}
                    className={`p-3 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${inviteForm.memberType === 'educator'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Users className={`w-5 h-5 mx-auto mb-1 ${inviteForm.memberType === 'educator' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    <span className={`text-sm font-medium ${inviteForm.memberType === 'educator' ? 'text-blue-700' : 'text-gray-600'
                      }`}>Educator</span>
                  </button>
                </div>
              </div>

              {organizationType === 'university' && (
                <p id="educator-university-note" className="text-sm text-amber-700">
                  {UNIVERSITY_EDUCATOR_MESSAGE}
                </p>
              )}

              {inviteForm.memberType === 'educator' && (
                <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-4">{EDUCATOR_NOTE}</p>
              )}

              {/* Auto-assign Subscription (learners only; SSO educator invites carry no license pool) */}
              {inviteForm.memberType === 'learner' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteForm.autoAssignSubscription}
                    onChange={(e) => setInviteForm(prev => ({
                      ...prev,
                      autoAssignSubscription: e.target.checked,
                      licensePoolId: e.target.checked ? prev.licensePoolId : ''
                    }))}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Auto-assign subscription
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automatically assign a license when they accept
                    </p>
                  </div>
                </label>

                {inviteForm.autoAssignSubscription && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      License Pool
                    </label>
                    {availablePools.length > 0 ? (
                      <select
                        value={inviteForm.licensePoolId}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, licensePoolId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="">Select a pool...</option>
                        {availablePools.map(pool => (
                          <option key={pool.id} value={pool.id}>
                            {pool.poolName} ({pool.availableSeats} seats available)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-amber-600">
                        No pools with available seats for {inviteForm.memberType}s
                      </p>
                    )}
                  </div>
                )}
              </div>

              )}

              {/* Custom Message (learners only) */}
              {inviteForm.memberType === 'learner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteForm.invitationMessage}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, invitationMessage: e.target.value }))}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={isSending || !inviteForm.email.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && invitationToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isCancelling && setCancelModalOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Cancel Invitation</h2>
                </div>
              </div>
              <button
                onClick={() => !isCancelling && setCancelModalOpen(false)}
                disabled={isCancelling}
                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel the invitation sent to:
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="font-medium text-gray-900">{invitationToCancel.email}</div>
                <div className="text-sm text-gray-500">
                  {getMemberTypeDisplay(invitationToCancel.memberType)} • Sent {formatDate(invitationToCancel.createdAt)}
                </div>
              </div>
              <p className="text-sm text-gray-500">
                This action cannot be undone. The recipient will no longer be able to accept this invitation.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Keep Invitation
              </button>
              <button
                onClick={handleCancelInvitation}
                disabled={isCancelling}
                className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Cancel Invitation
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

export default memo(InvitationManager);
