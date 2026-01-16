/**
 * Accept Invitation Page
 * 
 * Handles organization invitation acceptance flow:
 * 1. Validates the invitation token from URL
 * 2. Shows invitation details
 * 3. If logged in: accepts invitation and redirects to dashboard
 * 4. If not logged in: redirects to login with return URL
 */

import { memberInvitationService, OrganizationInvitation } from '@/services/organization/memberInvitationService';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Building2, Check, Clock, LogIn, RefreshCw, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

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
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Load invitation details
      const inv = await memberInvitationService.getInvitationByToken(token);
      
      if (!inv) {
        setPageState('invalid');
        setError('This invitation link is invalid or has already been used');
        return;
      }

      setInvitation(inv);

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
        setPageState('not_logged_in');
      } else {
        setPageState('valid');
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setPageState('error');
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    }
  };

  const getOrganizationName = async (orgId: string, _orgType: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      return data?.name || 'Organization';
    } catch {
      return 'Organization';
    }
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
      const result = await memberInvitationService.acceptInvitation(token!, user.id);
      
      setPageState('accepted');
      toast.success(`Welcome to ${result.organizationName}!`);

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        const dashboardPath = getDashboardPath(invitation.memberType);
        navigate(dashboardPath);
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('invitation_return_url', returnUrl);
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const getDashboardPath = (memberType: string): string => {
    if (memberType.includes('student')) {
      return '/student/dashboard';
    }
    if (memberType.includes('educator')) {
      return '/educator/dashboard';
    }
    return '/dashboard';
  };

  const getMemberTypeDisplay = (memberType: string): string => {
    if (memberType.includes('student')) return 'Student';
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
                  <p className="text-sm text-amber-800 font-medium">Login Required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please log in or create an account to accept this invitation.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLoginRedirect}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <LogIn className="w-5 h-5" />
              Login to Accept
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    const returnUrl = window.location.pathname + window.location.search;
                    sessionStorage.setItem('invitation_return_url', returnUrl);
                    navigate(`/signup?returnUrl=${encodeURIComponent(returnUrl)}`);
                  }}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </button>
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
