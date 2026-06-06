import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { useIsAuthenticated, useAuthStore } from '@/shared/model/authStore';

type VerifyState = 'verifying' | 'success' | 'error' | 'no-token';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isAuthenticated = useIsAuthenticated();

  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no-token');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [emailFailed] = useState(() => sessionStorage.getItem('email_sent_failed') === 'true');

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        await ssoClient.verifyEmail({ token });

        // Refresh session to get updated user data with is_email_verified = true
        await useAuthStore.getState().refreshSession();

        // Wait for session to fully propagate to auth store
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Log user data after refresh for debugging
        const refreshedUser = useAuthStore.getState().user;
        console.log('[VerifyEmail] User data after refresh:', {
          role: refreshedUser?.role,
          roles: refreshedUser?.roles,
          orgId: refreshedUser?.orgId,
          isEmailVerified: refreshedUser?.isEmailVerified,
          isAuthenticated: useAuthStore.getState().isAuthenticated,
        });

        // Set success state
        setState('success');

        // Auto-redirect after a short delay to show success message
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          const userRole = currentUser?.role || useAuthStore.getState().role;
          const userRoles = currentUser?.roles || [];

          console.log('[VerifyEmail] Auto-redirecting after verification', {
            userRole,
            orgId: currentUser?.orgId,
            roles: userRoles,
            isAuthenticated: useAuthStore.getState().isAuthenticated
          });

          // CRITICAL FIX: Check if user just accepted an invitation during signup
          // If so, redirect to login to get fresh JWT with membership roles
          const invitationJustAccepted = sessionStorage.getItem('invitation_just_accepted');
          const postVerificationRedirect = sessionStorage.getItem('post_signup_verification_redirect');
          const invitationOrgId = sessionStorage.getItem('invitation_org_id');
          const invitationRole = sessionStorage.getItem('invitation_role');

          if (invitationJustAccepted === 'true') {
            console.log('[VerifyEmail] User just accepted invitation during signup', {
              orgId: invitationOrgId,
              role: invitationRole,
              targetRedirect: postVerificationRedirect
            });
            console.log('[VerifyEmail] Redirecting to login to obtain fresh JWT with membership');

            // Keep the context for post-login redirect
            // Don't clear invitation_just_accepted yet - login will use it
            navigate('/login', { replace: true });
            return;
          }

          // Check if user has any recruitment vertical roles
          const isRecruitmentUser =
            userRole === 'recruiter' ||
            userRoles.includes('recruiter') ||
            userRoles.includes('company_admin') ||
            userRoles.includes('viewer') ||
            userRoles.includes('owner');

          // Legacy flow: Check if there's an invitation token still in sessionStorage
          // (This shouldn't happen anymore with the new flow, but keep for safety)
          const invitationToken = sessionStorage.getItem('invitation_token');
          const invitationReturnUrl = sessionStorage.getItem('invitation_return_url');

          if (invitationToken || invitationReturnUrl) {
            // User came from recruitment invitation (legacy path)
            console.log('[VerifyEmail] LEGACY: Redirecting to login for invitation auto-acceptance', {
              userRole,
              roles: userRoles,
              hasInvitationToken: !!invitationToken
            });
            navigate('/login', { replace: true });
          } else if (isRecruitmentUser) {
            // Recruitment user without invitation context
            // Company admins (owner role in SSO) who just signed up should see subscription plans first
            // Invited recruiters should go directly to their respective dashboards
            const isCompanyAdmin = userRoles.includes('owner') || userRoles.includes('company_admin');

            if (isCompanyAdmin) {
              // New company signup - show subscription plans
              console.log('[VerifyEmail] Redirecting company admin to recruitment subscription plans', {
                userRole,
                roles: userRoles,
                orgId: currentUser?.orgId,
              });
              navigate('/recruitment/subscription/plans', { replace: true });
            } else {
              // Invited recruiter - go to overview dashboard
              console.log('[VerifyEmail] Redirecting invited recruiter to overview dashboard', {
                userRole,
                roles: userRoles,
                orgId: currentUser?.orgId,
              });
              navigate('/recruitment/overview', { replace: true });
            }
          } else {
            // Regular learner user - go to subscription plans
            console.log('[VerifyEmail] Redirecting to regular subscription plans', {
              userRole,
              roles: userRoles
            });
            navigate('/subscription/plans', { replace: true });
          }
        }, 1500); // Show success message for 1.5 seconds before redirecting

      } catch (err) {
        if (err instanceof AuthFetchError) {
          if (err.status === 400) setError('This verification link has expired or already been used.');
          else setError(err.message || 'Verification failed');
        } else {
          setError('An unexpected error occurred.');
        }
        setState('error');
      }
    })();
  }, [token, navigate]);

  const handleResend = async () => {
    setResending(true);
    sessionStorage.removeItem('email_sent_failed');
    try {
      await ssoClient.requestVerification({ redirect_url: window.location.origin });
      setResent(true);
    } catch (err) {
      if (err instanceof AuthFetchError && err.status === 429) {
        setError('Too many requests. Please try again later.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md text-center">
        {state === 'verifying' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Verifying your email...</h2>
            <p className="text-gray-600 mt-2">Please wait a moment.</p>
          </div>
        )}

        {state === 'success' && (() => {
          const currentUser = useAuthStore.getState().user;
          const userRoles = currentUser?.roles || [];
          const isCompanyAdmin = userRoles.includes('owner') || userRoles.includes('company_admin');
          const isRecruitmentUser = currentUser?.role === 'recruiter' || userRoles.includes('recruiter') || userRoles.includes('owner');

          return (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Email Verified!</h2>
              <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">
                  {isRecruitmentUser && isCompanyAdmin
                    ? 'Redirecting to subscription plans...'
                    : isRecruitmentUser
                      ? 'Redirecting to dashboard...'
                      : 'Redirecting to subscription plans...'}
                </span>
              </div>
            </div>
          );
        })()}

        {state === 'error' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            {emailFailed && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">
                  <strong>Delivery failed:</strong> The verification email could not be sent during signup.
                  Click below to try again.
                </p>
              </div>
            )}
            {isAuthenticated && !resent && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors mb-3"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
            {resent && (
              <p className="text-green-700 text-sm mb-3">A new verification email has been sent.</p>
            )}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}

        {state === 'no-token' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📧 Email Verification Required</h2>
            <p className="text-gray-600 mb-4">
              {isAuthenticated ? (
                <>
                  We've sent a verification email to <strong>{useAuthStore.getState().user?.email}</strong>.
                  Please check your inbox and click the verification link.
                </>
              ) : (
                'Check your inbox for a verification link. Click the link to verify your email address.'
              )}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Access Restricted:</strong> You must verify your email before accessing any features.
              </p>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Didn't receive the email? Check your spam folder or request a new one below.
            </p>
            {emailFailed && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">
                  <strong>Delivery failed:</strong> The verification email could not be sent during signup.
                  Click below to try again.
                </p>
              </div>
            )}
            {isAuthenticated && !resent && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors mb-3"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
            {resent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-green-700 text-sm">✅ A new verification email has been sent. Please check your inbox.</p>
              </div>
            )}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
