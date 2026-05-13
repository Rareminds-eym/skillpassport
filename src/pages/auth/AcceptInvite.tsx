import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock, Users } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { AuthFetchError } from '@rareminds-eym/auth-client';

type InviteState = 'form' | 'loading' | 'success' | 'error';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<InviteState>(token ? 'form' : 'error');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(token ? '' : 'No invitation token provided.');
  const [loading, setLoading] = useState(false);

  const handleAccept = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    // Password is optional for existing users, required for new users
    if (password && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await ssoClient.acceptInvite({
        token,
        password: password || undefined,
      });

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
      if (err instanceof AuthFetchError) {
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
          <p className="text-gray-600">Join the organization and start collaborating</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {state === 'form' && (
            <form onSubmit={handleAccept} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

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
                    minLength={8}
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                    placeholder="Set a password (8+ characters)"
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
            </form>
          )}

          {state === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You're in!</h2>
              <p className="text-gray-600 mb-6">You've successfully joined the organization.</p>
              <button
                onClick={() => navigate('/')}
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
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
