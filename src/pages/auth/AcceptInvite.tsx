import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock, Users } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { PASSWORD_MIN } from '@/shared/constants';

type InviteState = 'validating' | 'form' | 'loading' | 'success' | 'error';

interface ValidationData {
  valid: boolean;
  inviteeEmail: string;
  organizationId: string;
  organizationName: string;
  organizationType?: string;
  role: string;
  expiresAt: string;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<InviteState>(token ? 'validating' : 'error');
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(token ? '' : 'No invitation token provided.');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  // Validate token on page load
  useEffect(() => {
    if (!token) {
      setState('error');
      setError('No invitation token provided.');
      return;
    }

    const validateTokenAndCheckSession = async () => {
      try {
        // STEP 1: Check if user is already logged in
        const currentUser = useAuthStore.getState().user;
        console.log('[AcceptInvite] Current user:', currentUser?.email || 'none');

        // STEP 2: Validate invitation token
        const response = await fetch('/api/recruitment/invitations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setState('error');
          setError(errorData.error || 'Invalid invitation token');
          return;
        }

        const data: ValidationData = await response.json();
        setValidationData(data);

        // STEP 3: Handle session conflicts
        if (currentUser && data.inviteeEmail) {
          const currentEmail = currentUser.email?.toLowerCase();
          const inviteEmail = data.inviteeEmail.toLowerCase();

          if (currentEmail === inviteEmail) {
            // User is logged in with correct email - auto-accept
            console.log('[AcceptInvite] User logged in with correct email, auto-accepting...');
            await handleAutoAccept(data);
            return;
          } else {
            // User is logged in with different email - show conflict
            console.log('[AcceptInvite] User logged in with different email');
            setState('error');
            setError(
              `You're signed in as ${currentEmail}. This invitation was sent to ${inviteEmail}.`
            );
            return;
          }
        }

        // STEP 4: No session conflict, show form
        setState('form');
      } catch (err) {
        console.error('Token validation error:', err);
        setState('error');
        setError('Failed to validate invitation token');
      }
    };

    validateTokenAndCheckSession();
  }, [token]);

  // Handle auto-accept for logged-in users
  const handleAutoAccept = async (data: ValidationData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/recruitment/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          auto_accept: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      setState('success');
      // Auto-redirect after short delay
      setTimeout(() => {
        navigate('/recruitment/overview');
      }, 1500);
    } catch (err) {
      console.error('Auto-accept error:', err);
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await ssoClient.logout();
      // Reload page to show form
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleRequestResend = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/invites/request-resend?token=${token}`, {
        method: 'POST',
      });

      if (response.ok) {
        setError('A request for a new invitation has been sent to the organization admin.');
      } else {
        setError('Failed to request a new invitation. Please contact the organization admin directly.');
      }
    } catch (err) {
      setError('Failed to request a new invitation. Please contact the organization admin directly.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    setPasswordStrength({ score, label: labels[score], color: colors[score] });
  }, [password]);

  const isRecruitmentInvite = validationData?.organizationType === 'company';

  const handleAccept = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    // For recruitment invites, enforce stricter validation
    if (isRecruitmentInvite) {
      if (!password || password.length < PASSWORD_MIN) {
        setError(`Password must be at least ${PASSWORD_MIN} characters`);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!termsAccepted) {
        setError('You must accept the terms and conditions');
        return;
      }
    } else {
      // For other org types, password is optional (existing users)
      if (password && password.length < PASSWORD_MIN) {
        setError(`Password must be at least ${PASSWORD_MIN} characters`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // For recruitment invites, call our custom API endpoint
      if (isRecruitmentInvite) {
        const response = await fetch('/api/recruitment/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to accept invitation');
        }

        const result = await response.json();

        // Now log in the user to create session
        await ssoClient.login({
          email: validationData!.inviteeEmail,
          password,
        });
      } else {
        // For other org types, use standard SSO client
        await ssoClient.acceptInvite({
          token,
          password: password || undefined,
        });
      }

      // Update auth store with the new session
      const me = await ssoClient.getMe();
      useAuthStore.setState({
        user: {
          id: me.sub,
          email: me.email,
          role: me.roles[0] ?? undefined,
          orgId: me.org_id,
          roles: me.roles,
          products: me.products,
          membershipStatus: me.membership_status,
          isEmailVerified: me.is_email_verified,
          isDemoMode: false,
        },
        isAuthenticated: true,
        role: me.roles[0] ?? null,
      });

      setState('success');
    } catch (err) {
      let errorMessage = 'Failed to accept invitation.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err instanceof AuthFetchError) {
        if (err.status === 400) errorMessage = 'This invitation has expired or already been used.';
        else if (err.status === 404) errorMessage = 'Invitation not found.';
        else if (err.status === 409) errorMessage = 'You are already a member of this organization.';
        else errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      setState('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Validating state */}
        {state === 'validating' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Validating invitation...</p>
          </div>
        )}

        {/* Logo and header - only show for recruitment invites */}
        {state !== 'validating' && isRecruitmentInvite && validationData && (
          <div className="text-center mb-6">
            <img
              src="/RareMinds ISO Logo-01.png"
              alt="SkillPassport"
              className="h-16 mx-auto mb-4"
            />
          </div>
        )}

        {/* Standard header for non-recruitment invites */}
        {state !== 'validating' && !isRecruitmentInvite && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
            <p className="text-gray-600">Join the organization and start collaborating</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Context banner for recruitment invites */}
          {state === 'form' && isRecruitmentInvite && validationData && (
            <div className="mb-6 p-4 bg-[#278FD3] bg-opacity-10 border border-[#278FD3] border-opacity-30 rounded-lg">
              <p className="text-sm text-gray-800 text-center">
                <strong>You've been invited to join {validationData.organizationName} as {validationData.role === 'company_admin' ? 'Recruiter Admin' : validationData.role}</strong>
              </p>
              <p className="text-xs text-gray-600 text-center mt-2">
                Invitation sent to: <strong>{validationData.inviteeEmail}</strong>
              </p>
            </div>
          )}

          {state === 'form' && (
            <form onSubmit={handleAccept} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Recruitment-specific form fields */}
              {isRecruitmentInvite ? (
                <>
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        disabled={loading}
                        required
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#278FD3] focus:border-[#278FD3] disabled:bg-gray-50 transition-colors"
                        placeholder={`At least ${PASSWORD_MIN} characters`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 min-w-[80px]">{passwordStrength.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        disabled={loading}
                        required
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#278FD3] focus:border-[#278FD3] disabled:bg-gray-50 transition-colors"
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                      disabled={loading}
                      required
                      className="mt-1 h-4 w-4 text-[#278FD3] focus:ring-[#278FD3] border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I accept the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#278FD3] hover:underline">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-[#278FD3] hover:bg-[#1f7ab8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <span>Accept invitation and continue</span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Standard form for other organization types */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>New user?</strong> Set a password below to create your account.
                      <br />
                      <strong>Existing user?</strong> Leave the password field empty to join with your current account.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password (required for new users)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        disabled={loading}
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                        placeholder="Set a password (10+ characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <span>Accept Invitation</span>
                    )}
                  </button>
                </>
              )}
            </form>
          )}

          {state === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You're in!</h2>
              <p className="text-gray-600 mb-6">
                {validationData?.organizationName
                  ? `You've successfully joined ${validationData.organizationName}.`
                  : "You've successfully joined the organization."}
              </p>
              <button
                onClick={() => navigate(isRecruitmentInvite ? '/recruitment/overview' : '/')}
                className="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                {/* Show sign out button if it's a session conflict */}
                {error.includes('signed in as') && (
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-[#278FD3] text-white hover:bg-[#1f7ab8] transition-colors disabled:opacity-60"
                  >
                    Sign out and continue
                  </button>
                )}
                {token && !error.includes('signed in as') && (
                  <button
                    onClick={handleRequestResend}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg border border-[#278FD3] text-[#278FD3] hover:bg-[#278FD3] hover:bg-opacity-10 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Requesting...' : 'Request new invitation'}
                  </button>
                )}
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
