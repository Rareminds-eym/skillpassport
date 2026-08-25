import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getRouteForRole, redirectToRoleDashboard, resolveRouteRole } from '@/features/auth/lib';
import { useAuthActions, useAuthStore } from '@/shared/model/authStore';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  disabled: 'Google sign-in is currently unavailable.',
  provider_error: 'Google sign-in was cancelled or failed. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  expired_state: 'Your sign-in session expired. Please try again.',
  missing_code: 'We could not complete Google sign-in. Please try again.',
  token_exchange_failed: 'We could not complete Google sign-in. Please try again.',
  userinfo_failed: 'We could not complete Google sign-in. Please try again.',
  email_unverified: "Your Google account's email is not verified. Verify it with Google first.",
  identity_rejected: 'Your account is not active. Contact support.',
  identity_error: 'A sign-in service error occurred. Please try again.',
};

const PARK_FAILSAFE_MS = 10_000;

// Module-scoped so React StrictMode's simulated unmount/remount JOINS the
// in-flight bootstrap instead of starting a second one.
let bootstrapPromise: Promise<void> | null = null;

/**
 * Landing page for the Google OAuth redirect flow.
 *
 * The backend callback endpoint has already exchanged the code and set the
 * refresh cookie. This page bootstraps the session exactly once
 * (single-flight across StrictMode remounts), routes by resolved role, and
 * carries a failsafe so /auth/callback can never become a parking lot.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initialize } = useAuthActions();

  const oauthError = searchParams.get('oauth_error');

  useEffect(() => {
    if (oauthError) return;

    // Failsafe: any bug above must not leave users parked on this page.
    const parkFailsafe = window.setTimeout(() => {
      if (window.location.pathname === '/auth/callback') {
        window.location.replace('/');
      }
    }, PARK_FAILSAFE_MS);

    bootstrapPromise = (async () => {
      await initialize();
      const { isAuthenticated, user } = useAuthStore.getState();
      if (!isAuthenticated) {
        navigate('/login?oauth_error=identity_error', { replace: true });
        return;
      }

      const postLoginRedirect = sessionStorage.getItem('post_login_redirect');
      sessionStorage.removeItem('post_login_redirect');
      if (postLoginRedirect) {
        navigate(postLoginRedirect, { replace: true });
        return;
      }

      const routeRole = resolveRouteRole(user?.roles ?? []);
      if (routeRole === 'recruiter' || routeRole === 'owner') {
        // Recruiter routing needs org context (admin vs overview) — SPA path.
        await redirectToRoleDashboard(routeRole, navigate);
        return;
      }
      // Everyone else: hard navigation resets any in-memory render cycle.
      window.location.replace(getRouteForRole(routeRole));
    })().finally(() => {
      // Reset so a later OAuth login in this tab bootstraps fresh instead of
      // joining the settled promise and doing nothing.
      bootstrapPromise = null;
    });

    void bootstrapPromise;

    return () => {
      window.clearTimeout(parkFailsafe);
    };
  }, [oauthError, initialize, navigate]);

  if (oauthError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-8 text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-in failed</h1>
          <p className="text-sm text-gray-600 mb-6">
            {OAUTH_ERROR_MESSAGES[oauthError] ?? OAUTH_ERROR_MESSAGES.identity_error}
          </p>
          <Link
            to="/login"
            className="inline-flex justify-center w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
