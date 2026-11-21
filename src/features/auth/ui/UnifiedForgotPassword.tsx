import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft, Info } from 'lucide-react';
import { ssoClient, SsoWorkflowError } from '@/shared/api/ssoClient';
import { isValidEmail } from '@/shared/lib/validation';
import { AuthClientError } from '@rareminds-eym/auth-client';

interface ForgotPasswordState {
  email: string;
  loading: boolean;
  error: string;
  success: boolean;
}

const UnifiedForgotPassword = () => {
  const navigate = useNavigate();
  
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    loading: false,
    error: '',
    success: false
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      email: e.target.value,
      error: ''
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = state.email.trim();
    if (!email) {
      setState(prev => ({ ...prev, error: 'Please enter your email address' }));
      return;
    }

    if (!isValidEmail(email)) {
      setState(prev => ({ ...prev, error: 'Please enter a valid email address.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      await ssoClient.forgotPassword({ email, redirect_url: window.location.origin });

      // Always show success (prevents email enumeration)
      setState(prev => ({
        ...prev,
        loading: false,
        success: true
      }));

    } catch (error) {
      if ((error instanceof AuthClientError || error instanceof SsoWorkflowError) && error.httpStatus === 429) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Too many requests. Please try again in a few minutes.'
        }));
      } else if (error instanceof SsoWorkflowError && error.code === 'not_found') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: "We couldn't find an account matching this email address. sign up."
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'We couldn’t process your request. Please try again later.'
        }));
      }
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {state.error.includes('sign up') ? (
                  <>{state.error.slice(0, state.error.lastIndexOf('sign up'))}<Link to="/signup" className="text-blue-600 underline">sign up</Link>{state.error.slice(state.error.lastIndexOf('sign up') + 'sign up'.length)}</>
                ) : state.error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {state.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">Check your email</p>
                <p className="text-sm text-green-700 mt-1">
                  If an account exists for this email, you will receive a password reset link. Please check your inbox and spam folder.
                </p>
              </div>
            </div>
          )}

          {!state.success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Info Message */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">How it works</p>
                  <p className="text-sm text-blue-700 mt-1">
                    We'll send you a secure link to reset your password. Click the link in your email to create a new password.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              {/* Back to Login Link */}
              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Login</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                <span>Back to Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Remember your password? {' '}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedForgotPassword;
