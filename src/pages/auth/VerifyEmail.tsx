import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { useIsAuthenticated } from '@/shared/model/authStore';

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

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        await ssoClient.verifyEmail({ token });
        setState('success');
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
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await ssoClient.requestVerification();
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

        {state === 'success' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">Your email has been successfully verified.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              Check your inbox for a verification link. Click the link to verify your email address.
            </p>
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
      </div>
    </div>
  );
};

export default VerifyEmail;
