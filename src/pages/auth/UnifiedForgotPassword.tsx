import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../../services/unifiedAuthService';

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
    success: false,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      email: e.target.value,
      error: '',
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    if (!state.email) {
      setState((prev) => ({
        ...prev,
        error: 'Please enter your email address',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await resetPassword(state.email);

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to send reset email',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        success: true,
      }));
    } catch (error) {
      console.error('Forgot password error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again',
      }));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            {state.success
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}

          {/* Success Message */}
          {state.success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Email sent successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    We've sent a password reset link to <strong>{state.email}</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                </div>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Login</span>
              </button>
            </div>
          ) : (
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
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
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>If you don't receive an email, check your spam folder or contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedForgotPassword;
