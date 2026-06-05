import { useAuthStore } from '@/shared/model/authStore';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, UserCircle } from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import type { UserRole } from '@/features/auth/api';
import { redirectToRoleDashboard } from '@/features/auth/lib';
import { useAuthActions } from '@/shared/model/authStore';
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { trackLogin } from '@/shared/lib/analytics';

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  selectedRole: UserRole | null;
}

const ALL_ROLES: UserRole[] = [
  'learner',
  'recruiter',
  'educator',
  'school_admin',
  'college_admin',
  'university_admin',
];

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  learner: 'Learners',
  recruiter: 'Recruiter',
  educator: 'Educator',
  school_educator: 'School Educator',
  college_educator: 'College Educator',
  school_admin: 'School Administrator',
  college_admin: 'College Administrator',
  university_admin: 'University Administrator',
};

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthActions();

  const returnUrl =
    searchParams.get('returnUrl') || sessionStorage.getItem('invitation_return_url');
  const invitationEmail = searchParams.get('email') || sessionStorage.getItem('invitation_email');
  const invitationToken = sessionStorage.getItem('invitation_token');

  const [state, setState] = useState<LoginState>({
    email: invitationEmail || '',
    password: '',
    showPassword: false,
    loading: false,
    error: '',
    selectedRole: null,
  });

  // Guard: login_start fires only once per login attempt
  const hasStartedLoginRef = useRef(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value, error: '' }));
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRole = (e.target.value || null) as UserRole | null;
    
    // Fire login_start when user selects a role (captures true login intent)
    // Works reliably even with browser autofill/password managers
    if (!hasStartedLoginRef.current && newRole) {
      hasStartedLoginRef.current = true;
      trackLogin.start(newRole);
    }
    
    setState((prev) => ({
      ...prev,
      selectedRole: newRole,
      error: '',
    }));
  };

  const togglePasswordVisibility = () => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const mapAuthError = (err: unknown): string => {
    if (err instanceof AuthFetchError) {
      if (err.status === 401) return 'Invalid email or password';
      if (err.status === 403) return 'Your account is not active. Contact support.';
      if (err.status === 429) return 'Too many attempts. Please try again in a few minutes.';
      if (err.status >= 500) return 'The authentication service is unavailable. Please try again.';
      return err.message || 'Authentication failed';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('[UnifiedLogin] Checking invitation context');
    console.log('[UnifiedLogin] invitationToken:', invitationToken ? `${invitationToken.substring(0, 8)}...` : 'null');
    console.log('[UnifiedLogin] returnUrl:', returnUrl);
    console.log('[UnifiedLogin] invitationEmail:', invitationEmail);
    console.log('[UnifiedLogin] selectedRole:', state.selectedRole);

    if (!state.email || !state.password) {
      setState((prev) => ({ ...prev, error: 'Please enter both email and password' }));
      return;
    }

    if (state.password.length < 8) {
      setState((prev) => ({ ...prev, error: 'Password must be at least 8 characters' }));
      return;
    }

    if (!state.selectedRole) {
      setState((prev) => ({ ...prev, error: 'Please select a role' }));
      return;
    }

    // Track login_submit — all validation passed, API call about to start
    trackLogin.submit(state.selectedRole || undefined);

    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      // Login via SSO — the store reads roles from the JWT
      console.log('[UnifiedLogin] Attempting login...');
      await login(state.email, state.password);
      console.log('[UnifiedLogin] ✓ Login successful');

      const { useAuthStore } = await import('@/shared/model/authStore');

      // CRITICAL FIX: Check if user just completed invitation signup
      const invitationJustAccepted = sessionStorage.getItem('invitation_just_accepted');
      const postVerificationRedirect = sessionStorage.getItem('post_signup_verification_redirect');
      const invitationOrgId = sessionStorage.getItem('invitation_org_id');
      const invitationRole = sessionStorage.getItem('invitation_role');

      if (invitationJustAccepted === 'true') {
        console.log('[UnifiedLogin] ✓ User completed invitation signup, now logged in with fresh JWT');
        console.log('[UnifiedLogin] Expected org:', invitationOrgId);
        console.log('[UnifiedLogin] Expected role:', invitationRole);
        console.log('[UnifiedLogin] Target redirect:', postVerificationRedirect);

        // The fresh JWT should now include the membership/role
        const currentUser = useAuthStore.getState().user;
        console.log('[UnifiedLogin] Current user data:', {
          id: currentUser?.id,
          email: currentUser?.email,
          orgId: currentUser?.orgId,
          roles: currentUser?.roles,
          role: currentUser?.role
        });

        // Clear invitation context
        sessionStorage.removeItem('invitation_just_accepted');
        sessionStorage.removeItem('post_signup_verification_redirect');
        sessionStorage.removeItem('invitation_org_id');
        sessionStorage.removeItem('invitation_role');

        // Redirect to the target dashboard
        const redirectPath = postVerificationRedirect || '/recruitment/overview';
        console.log('[UnifiedLogin] ✓ Redirecting to:', redirectPath);
        console.log('=== POST-INVITATION LOGIN SUCCESS ===');
        navigate(redirectPath, { replace: true });
        return;
      }

      // LEGACY FLOW: Check for old-style invitation token (shouldn't happen with new flow)
      const freshInvitationToken = sessionStorage.getItem('invitation_token');

      if (freshInvitationToken) {
        console.log('[UnifiedLogin] LEGACY: Invitation token found, attempting auto-accept');
        try {
          const userId = useAuthStore.getState().user?.id;

          if (userId) {
            const invitationResponse = await fetch('/api/recruitment/invitations/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: freshInvitationToken,
                userId: userId,
              }),
            });

            if (invitationResponse.ok) {
              const invitationResult = await invitationResponse.json();
              console.log('[UnifiedLogin] ✓ LEGACY invitation accepted:', invitationResult);

              sessionStorage.removeItem('invitation_token');
              sessionStorage.removeItem('invitation_email');
              sessionStorage.removeItem('invitation_return_url');

              await useAuthStore.getState().refreshSession();

              const isCompanyAdmin = invitationResult.memberType?.includes('company_admin');
              const isRecruiter = invitationResult.memberType?.includes('recruiter');
              const dashboardPath = isCompanyAdmin
                ? '/recruitment/admin'
                : (isRecruiter ? '/recruitment/overview' : '/learner/dashboard');

              navigate(dashboardPath);
              return;
            }
          }
        } catch (invitationError) {
          console.error('[UnifiedLogin] ✗ LEGACY invitation auto-accept failed:', invitationError);
        }
      }

      // CRITICAL FIX: Log the actual user data to debug role issues
      const currentUser = useAuthStore.getState().user;
      console.log('[UnifiedLogin] Current user after login:', {
        id: currentUser?.id,
        email: currentUser?.email,
        role: currentUser?.role,
        roles: currentUser?.roles,
        orgId: currentUser?.orgId,
        membershipStatus: currentUser?.membershipStatus
      });

      // Verify the user actually has the selected role
      // (Reading directly from the store after login() completes)
      const currentRoles = currentUser?.roles ?? [];
      console.log('[UnifiedLogin] Checking role access:', {
        selectedRole: state.selectedRole,
        currentRoles,
        hasRolesArray: currentRoles.length > 0
      });

      // Check if user has the selected role or a variant of it
      // For 'educator', accept 'educator', 'school_educator', or 'college_educator'
      // For 'recruiter', accept 'recruiter' or 'owner' (org creators)
      let hasRole = currentRoles.includes(state.selectedRole);
      if (!hasRole && state.selectedRole === 'educator') {
        hasRole = currentRoles.some(role =>
          role === 'educator' || role === 'school_educator' || role === 'college_educator'
        );
      }
      if (!hasRole && state.selectedRole === 'recruiter') {
        hasRole = currentRoles.some(role =>
          role === 'recruiter' || role === 'owner' || role === 'company_admin' || role === 'viewer' || role === 'member'
        );
      }

      console.log('[UnifiedLogin] Role check result:', { hasRole });

      if (!hasRole) {
        // User doesn't have this role
        console.error('[UnifiedLogin] ❌ Role check failed!');
        console.error('[UnifiedLogin] This might be a JWT/role loading issue.');
        console.error('[UnifiedLogin] Possible causes:');
        console.error('[UnifiedLogin] 1. Membership exists in DB but JWT doesn\'t include roles');
        console.error('[UnifiedLogin] 2. SSO service not populating roles from memberships');
        console.error('[UnifiedLogin] 3. Role name mismatch (DB has \'recruiter\', JWT has something else)');

        // If they came from an invitation, show a more helpful error
        if (invitationToken) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: `Failed to assign ${ROLE_DISPLAY_NAMES[state.selectedRole!]} role. The invitation may have already been used or expired. Please contact support.`,
          }));
        } else {
          // TEMPORARY: Don't logout immediately, show error with more context
          setState((prev) => ({
            ...prev,
            loading: false,
            error: `You do not have access to the ${ROLE_DISPLAY_NAMES[state.selectedRole!]} role. Your account may need to be set up correctly. Current roles: ${currentRoles.length > 0 ? currentRoles.join(', ') : 'none'}`,
          }));
        }
        return;
      }

      // Update the primary role to match what the user selected
      // If they selected 'educator' but have a specific variant, use the variant
      // If they selected 'recruiter' and have 'owner', map to 'recruiter'
      let actualRole = state.selectedRole;
      if (state.selectedRole === 'educator') {
        const educatorRole = currentRoles.find(role =>
          role === 'educator' || role === 'school_educator' || role === 'college_educator'
        );
        if (educatorRole) {
          actualRole = educatorRole as UserRole;
        }
      }
      if (state.selectedRole === 'recruiter' && currentRoles.includes('owner')) {
        // User is an org owner, map to recruiter for app purposes
        actualRole = 'recruiter';
      }
      useAuthStore.setState({ role: actualRole });

      // Track login_success — login complete, role verified, store updated
      trackLogin.success(useAuthStore.getState().user?.id || '', actualRole);

      // Redirect to the intended destination
      if (returnUrl) {
        sessionStorage.removeItem('invitation_return_url');
        navigate(returnUrl);
      } else {
        await redirectToRoleDashboard(state.selectedRole, navigate);
      }
    } catch (error) {
      // Track login_failed — network/auth error path
      trackLogin.failed(mapAuthError(error), state.selectedRole || undefined);
      hasStartedLoginRef.current = false;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: mapAuthError(error),
      }));
    }
  };

  const handleForgotPassword = () => {
    trackLogin.forgotPasswordClick();
    navigate('/password-reset');
  };

  return (
    <div className="flex items-center lg:py-8 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE - Illustration */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/login/login.jpg" alt="Login background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 "></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl text-center font-bold leading-tight">
              Welcome Back
            </h2>
            <p className="mt-4 max-w-xl text-center text-[#edf2f9]">
              Sign in to access your dashboard and continue your journey
            </p>
          </div>

          <div className="relative z-10 flex justify-center items-center h-full" />
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-8 lg:py-8">
          <div
            className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a6aba] to-[#09277f]"
            aria-hidden
          />
          <div className="hidden lg:block absolute inset-0 bg-white" />

          <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white lg:text-gray-900">Sign In</h3>
              <p className="text-sm text-white/80 lg:text-gray-600 mt-2">
                Enter your credentials to continue
              </p>
            </div>

            <div className="rounded-2xl bg-transparent lg:bg-white/95 lg:shadow-xl lg:ring-1 lg:ring-black/5 p-5 sm:p-6 lg:p-8">
              {state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{state.error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white lg:text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={state.email}
                      onChange={handleInputChange}
                      disabled={state.loading}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors bg-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white lg:text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={state.showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      minLength={8}
                      value={state.password}
                      onChange={handleInputChange}
                      disabled={state.loading}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={state.loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={state.showPassword ? 'Hide password' : 'Show password'}
                    >
                      {state.showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-white lg:text-gray-700 mb-2"
                  >
                    Select Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={state.selectedRole || ''}
                      onChange={handleRoleChange}
                      disabled={state.loading}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors appearance-none bg-white"
                    >
                      <option value="">Choose your role...</option>
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_DISPLAY_NAMES[role]}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-white/70 lg:text-gray-500">
                    Select the role you want to log in as
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={state.loading}
                    className="text-sm font-medium text-white lg:text-blue-600 hover:text-white/80 lg:hover:text-blue-500 disabled:text-gray-400"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {state.loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white lg:text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-white lg:text-blue-600 hover:text-white/80 lg:hover:text-blue-500"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
