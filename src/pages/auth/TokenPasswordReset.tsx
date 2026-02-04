import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mail,
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Eye, 
  EyeOff
} from 'lucide-react';

interface TokenPasswordResetState {
  step: 'loading' | 'email-input' | 'reset' | 'success' | 'error';
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

const TokenPasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [state, setState] = useState<TokenPasswordResetState>({
    step: 'loading',
    token: tokenFromUrl,
    email: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: '',
    showPassword: false,
    showConfirmPassword: false
  });

  // Validate token on component mount
  useEffect(() => {
    if (!tokenFromUrl) {
      // No token provided - show email input form instead of error
      setState(prev => ({
        ...prev,
        step: 'email-input'
      }));
      return;
    }

    // Validate token format (32 character hex string)
    if (!/^[a-f0-9]{32}$/.test(tokenFromUrl)) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: 'Invalid reset token format'
      }));
      return;
    }

    // Token looks valid, proceed to reset form
    setState(prev => ({
      ...prev,
      step: 'reset'
    }));
  }, [tokenFromUrl]);

  const handleInputChange = (field: keyof TokenPasswordResetState) => (e: ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      [field]: e.target.value,
      error: ''
    }));
  };

  const handleSendResetLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.email) {
      setState(prev => ({ ...prev, error: 'Please enter your email address' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('🔐 Sending password reset request for:', state.email);
      
      // Use user-api to send reset link
      const userApiUrl = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001';
      console.log('📡 User API URL:', userApiUrl);
      
      const response = await fetch(`${userApiUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          email: state.email
        })
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📡 Response data:', result);

      if (!response.ok || !result.success) {
        console.error('❌ Failed to send reset link:', result.error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to send reset link'
        }));
        return;
      }

      console.log('✅ Reset link sent successfully');
      setState(prev => ({
        ...prev,
        loading: false,
        step: 'success',
        email: state.email
      }));

    } catch (error) {
      console.error('❌ Send reset link error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
      }));
    }
  };

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.newPassword) {
      setState(prev => ({ ...prev, error: 'Please enter a new password' }));
      return;
    }

    if (state.newPassword.length < 6) {
      setState(prev => ({ ...prev, error: 'Password must be at least 6 characters long' }));
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('🔐 Resetting password with token');
      console.log('Token:', state.token);
      
      // Use user-api to reset password with token
      const userApiUrl = import.meta.env.VITE_USER_API_URL || 'http://localhost:3001';
      console.log('📡 User API URL:', userApiUrl);
      
      const response = await fetch(`${userApiUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset-with-token',
          otp: state.token, // Using 'otp' field for token for API compatibility
          newPassword: state.newPassword
        })
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📡 Response data:', result);

      if (!response.ok || !result.success) {
        console.error('❌ Failed to reset password:', result.error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to reset password'
        }));
        return;
      }

      console.log('✅ Password reset successfully');
      setState(prev => ({
        ...prev,
        loading: false,
        step: 'success',
        email: result.email || ''
      }));

    } catch (error) {
      console.error('❌ Password reset error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {state.step === 'loading' && 'Validating Reset Link'}
            {state.step === 'email-input' && 'Reset Your Password'}
            {state.step === 'reset' && 'Create New Password'}
            {state.step === 'success' && 'Check Your Email'}
            {state.step === 'error' && 'Invalid Reset Link'}
          </h1>
          <p className="text-gray-600">
            {state.step === 'loading' && 'Please wait while we validate your reset link...'}
            {state.step === 'email-input' && 'Enter your email to receive a password reset link'}
            {state.step === 'reset' && 'Enter your new password below'}
            {state.step === 'success' && 'We\'ve sent you a password reset link'}
            {state.step === 'error' && 'This reset link is invalid or has expired'}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Loading State */}
          {state.step === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Validating your reset link...</p>
            </div>
          )}

          {/* Error State */}
          {state.step === 'error' && (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Invalid Reset Link</p>
                  <p className="text-sm text-red-700 mt-1">{state.error}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  This reset link may have expired or been used already. 
                  Please request a new password reset.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </div>
          )}

          {/* Email Input Form (when no token provided) */}
          {state.step === 'email-input' && (
            <form onSubmit={handleSendResetLink} className="space-y-6">
              {/* Error Message */}
              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{state.error}</p>
                </div>
              )}

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
                    onChange={handleInputChange('email')}
                    disabled={state.loading}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Info Message */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  We'll send you a secure link to reset your password. Click the link in your email to create a new password.
                </p>
              </div>

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

          {/* Password Reset Form */}
          {state.step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              {/* Error Message */}
              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{state.error}</p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={state.showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.newPassword}
                    onChange={handleInputChange('newPassword')}
                    disabled={state.loading}
                    className="block w-full pr-10 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {state.showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={state.showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    disabled={state.loading}
                    className="block w-full pr-10 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {state.showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* Success State */}
          {state.step === 'success' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  {state.token ? (
                    // Password reset success
                    <>
                      <p className="text-sm text-green-800 font-medium">Password updated successfully!</p>
                      <p className="text-sm text-green-700 mt-1">
                        Your password has been changed. You can now log in with your new password.
                      </p>
                    </>
                  ) : (
                    // Email sent success
                    <>
                      <p className="text-sm text-green-800 font-medium">Reset link sent!</p>
                      <p className="text-sm text-green-700 mt-1">
                        Please check your email (including spam folder) for a password reset link.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                <span>{state.token ? 'Continue to Login' : 'Back to Login'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {state.step === 'email-input' ? 'Remember your password? ' : 'Need help? '}
            <button
              onClick={state.step === 'email-input' ? handleBackToLogin : () => {}}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {state.step === 'email-input' ? 'Sign in' : 'Contact support'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenPasswordReset;