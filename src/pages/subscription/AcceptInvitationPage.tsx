/**
 * Accept Invitation Page
 * 
 * Handles organization invitation acceptance flow:
 * 1. Validates the invitation token from URL
 * 2. Shows invitation details
 * 3. If logged in: accepts invitation and redirects to dashboard
 * 4. If not logged in: redirects to login with return URL
 */

import { memberInvitationService, OrganizationInvitation } from '@/entities/organization';
import { apiGet } from '@/shared/api/apiClient';
import { AlertCircle, Building2, Check, Clock, LogIn, RefreshCw, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';

const logger = getLogger('invitation-acceptance');

type PageState = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'already_accepted' | 'error' | 'not_logged_in';

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndLoadInvitation();
  }, [token]);

  const checkAuthAndLoadInvitation = async () => {
    if (!token) {
      setPageState('invalid');
      setError('No invitation token provided');
      return;
    }

    try {
      // Load invitation details FIRST to check if it's recruitment
      const inv = await memberInvitationService.getInvitationByToken(token);

      if (!inv) {
        setPageState('invalid');
        setError('This invitation link is invalid or has already been used');
        return;
      }

      setInvitation(inv);

      // Check if user is logged in
      const { data: { user: currentUser } } = { data: { user: useAuthStore.getState().user } };
      setUser(currentUser);

      // CRITICAL FIX: For recruitment invitations, redirect to signup immediately IF NOT LOGGED IN
      const isRecruitmentInvitation = inv.memberType?.includes('company_admin') ||
        inv.memberType?.includes('recruiter') ||
        inv.memberType?.includes('viewer');

      if (!currentUser && isRecruitmentInvitation) {
        console.log('[AcceptInvitationPage] Recruitment invitation detected for guest, redirecting to signup');
        console.log('[AcceptInvitationPage] Token:', token);
        console.log('[AcceptInvitationPage] Email:', inv.email);

        // Store invitation data
        sessionStorage.setItem('invitation_token', token);
        sessionStorage.setItem('invitation_email', inv.email);
        sessionStorage.setItem('invitation_return_url', window.location.href);

        // Redirect to signup with token
        const signupUrl = `/signup?invitation_token=${token}&email=${encodeURIComponent(inv.email)}`;
        console.log('[AcceptInvitationPage] Redirecting to:', signupUrl);
        navigate(signupUrl, { replace: true });
        return;
      }

      // Check invitation status
      if (inv.status === 'accepted') {
        setPageState('already_accepted');
        return;
      }

      if (inv.status === 'cancelled') {
        setPageState('invalid');
        setError('This invitation has been cancelled');
        return;
      }

      if (inv.status === 'expired' || new Date(inv.expiresAt) < new Date()) {
        setPageState('expired');
        return;
      }

      // Get organization name
      const orgName = await getOrganizationName(inv.organizationId, inv.organizationType);
      setOrganizationName(orgName);

      if (!currentUser) {
        // Check if user account exists for this email
        const accountExists = await checkIfUserExists(inv.email);
        setUserExists(accountExists);
        setPageState('not_logged_in');
      } else {
        setPageState('valid');
      }
    } catch (err) {
      logger.error('Failed to load invitation', err instanceof Error ? err : new Error(String(err)));
      setPageState('error');
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    }
  };

  const getOrganizationName = async (orgId: string, _orgType: string): Promise<string> => {
    try {
      const resp: any = await apiGet(`/organization/handler?action=getOrganizationName&orgId=${orgId}`);
      return resp.data || 'Organization';
    } catch {
      return 'Organization';
    }
  };

  const checkIfUserExists = async (email: string): Promise<boolean> => {
    // TODO(SSO-Migration): Implement user existence check via SSO API if needed.
    // For now, default to false so the user is prompted to sign up,
    // but they can click "Log in" if they already have an account.
    return false;
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    // Verify that the logged-in user's email matches the invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error('This invitation was sent to a different email address. Please log in with the correct account.');
      setError(`This invitation was sent to ${invitation.email}. You are logged in as ${user.email}.`);
      return;
    }

    setIsAccepting(true);
    try {
      // Check if this is a recruitment invitation
      const isRecruitmentInvitation = invitation.memberType.includes('company_admin') ||
        invitation.memberType.includes('recruiter') ||
        invitation.memberType.includes('viewer');

      let result;
      if (isRecruitmentInvitation) {
        // Use recruitment-specific endpoint that creates SSO-Worker memberships
        const response = await fetch('/api/recruitment/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token!,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to accept invitation');
        }

        result = await response.json();
      } else {
        // Use standard school/college invitation flow
        result = await memberInvitationService.acceptInvitation(token!, user.id);
      }

      setPageState('accepted');
      toast.success(`Welcome to ${result.organizationName}!`);

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        const dashboardPath = getDashboardPath(invitation.memberType);
        navigate(dashboardPath);
      }, 2000);
    } catch (err) {
      logger.error('Failed to accept invitation', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    console.log('=== INVITATION LOGIN REDIRECT ===');
    console.log('[AcceptInvitationPage] Redirecting to login with invitation');
    console.log('[AcceptInvitationPage] Token:', token);
    console.log('[AcceptInvitationPage] Email:', invitation?.email);

    // Store the current URL to redirect back after login
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('invitation_return_url', returnUrl);

    // Store invitation token and email for auto-acceptance after login
    if (token) {
      console.log('[AcceptInvitationPage] Storing invitation token in sessionStorage');
      sessionStorage.setItem('invitation_token', token);
      sessionStorage.setItem('invitation_email', invitation?.email || '');

      // Verify storage
      const storedToken = sessionStorage.getItem('invitation_token');
      const storedEmail = sessionStorage.getItem('invitation_email');
      console.log('[AcceptInvitationPage] ✓ Token stored:', storedToken ? `${storedToken.substring(0, 8)}...` : 'FAILED');
      console.log('[AcceptInvitationPage] ✓ Email stored:', storedEmail);
    } else {
      console.error('[AcceptInvitationPage] ✗ No token available to store!');
    }

    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}&email=${encodeURIComponent(invitation?.email || '')}`);
  };

  const handleSignupRedirect = () => {
    console.log('=== INVITATION SIGNUP REDIRECT ===');
    console.log('[AcceptInvitationPage] Redirecting to signup with invitation');
    console.log('[AcceptInvitationPage] Token:', token);
    console.log('[AcceptInvitationPage] Email:', invitation?.email);

    // Clear persisted auth state to prevent old user data from interfering
    console.log('[AcceptInvitationPage] Clearing persisted auth state');
    localStorage.removeItem('skillpassport-auth-v1');

    // Store invitation token in sessionStorage for auto-acceptance after signup
    if (token) {
      console.log('[AcceptInvitationPage] Storing invitation token in sessionStorage');
      sessionStorage.setItem('invitation_token', token);
      sessionStorage.setItem('invitation_email', invitation?.email || '');

      // Verify storage
      const storedToken = sessionStorage.getItem('invitation_token');
      const storedEmail = sessionStorage.getItem('invitation_email');
      console.log('[AcceptInvitationPage] ✓ Token stored:', storedToken ? `${storedToken.substring(0, 8)}...` : 'FAILED');
      console.log('[AcceptInvitationPage] ✓ Email stored:', storedEmail);
    } else {
      console.error('[AcceptInvitationPage] ✗ No token available to store!');
    }

    // Redirect to simplified invitation signup page
    const signupUrl = `/invitation/signup?token=${token}&email=${encodeURIComponent(invitation?.email || '')}`;
    console.log('[AcceptInvitationPage] Navigating to:', signupUrl);
    navigate(signupUrl);
  };

  const getDashboardPath = (memberType: string): string => {
    if (memberType.includes('learner')) {
      return '/learner/dashboard';
    }
    if (memberType.includes('educator')) {
      return '/educator/dashboard';
    }
    if (memberType.includes('recruiter') || memberType.includes('company_admin')) {
      // Company admins should go to admin dashboard, regular recruiters to overview
      return memberType.includes('company_admin') ? '/recruitment/admin' : '/recruitment/overview';
    }
    // Fallback to learner dashboard instead of non-existent /dashboard
    return '/learner/dashboard';
  };

  const getMemberTypeDisplay = (memberType: string): string => {
    if (memberType.includes('learner')) return 'Learner';
    if (memberType.includes('educator')) return 'Educator';
    return memberType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Invitation</h2>
          <p className="text-gray-500">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/Error states
  if (pageState === 'invalid' || pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-500 mb-6">{error || 'This invitation link is not valid.'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Expired state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h2>
          <p className="text-gray-500 mb-2">This invitation has expired.</p>
          {invitation && (
            <p className="text-sm text-gray-400 mb-6">
              Expired on {formatDate(invitation.expiresAt)}
            </p>
          )}
          <p className="text-gray-500 mb-6">
            Please contact the organization administrator to request a new invitation.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Already accepted state
  if (pageState === 'already_accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Accepted</h2>
          <p className="text-gray-500 mb-6">This invitation has already been accepted.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Successfully accepted state
  if (pageState === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-500 mb-2">
            You've successfully joined <strong>{organizationName}</strong>
          </p>
          <p className="text-sm text-gray-400 mb-6">Redirecting to your dashboard...</p>
          <RefreshCw className="w-6 h-6 text-green-600 mx-auto animate-spin" />
        </div>
      </div>
    );
  }

  // Not logged in state
  if (pageState === 'not_logged_in') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
            <p className="text-blue-100">Join {organizationName} on Skill Passport</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {invitation && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{getMemberTypeDisplay(invitation.memberType)}</div>
                    <div className="text-sm text-gray-500">{invitation.email}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Expires {formatDate(invitation.expiresAt)}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    {userExists ? 'Login Required' : 'Account Required'}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {userExists
                      ? 'Please log in with your account to accept this invitation.'
                      : 'Please create an account with the invited email to accept this invitation.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {userExists ? (
              <button
                onClick={handleLoginRedirect}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <LogIn className="w-5 h-5" />
                Login to Accept
              </button>
            ) : (
              <button
                onClick={handleSignupRedirect}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Create Account & Accept
              </button>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {userExists ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={handleSignupRedirect}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={handleLoginRedirect}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid invitation - ready to accept
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-blue-100">Join {organizationName} on Skill Passport</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {invitation && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium text-gray-900">{organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-indigo-600">{getMemberTypeDisplay(invitation.memberType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{invitation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-gray-700">{formatDate(invitation.expiresAt)}</span>
                </div>
              </div>
            </div>
          )}

          {invitation?.autoAssignSubscription && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Subscription Included</p>
                  <p className="text-sm text-green-700 mt-1">
                    A subscription license will be automatically assigned to you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email mismatch warning */}
          {user && invitation && user.email?.toLowerCase() !== invitation.email.toLowerCase() && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Email Mismatch</p>
                  <p className="text-sm text-red-700 mt-1">
                    This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{user.email}</strong>.
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Please log out and sign in with the correct account.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              disabled={isAccepting}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptInvitation}
              disabled={isAccepting || (user && invitation && user.email?.toLowerCase() !== invitation.email.toLowerCase())}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
