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
  EyeOff,
  Clock,
  RefreshCw
} from 'lucide-react';
import { sendPasswordResetOTP, verifyOTPAndResetPassword } from '../../services/unifiedAuthService';

interface PasswordResetState {
  step: 'email' | 'otp' | 'success';
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  timeLeft: number;
  canResend: boolean;
}

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  
  const [state, setState] = useState<PasswordResetState>({
    step: 'email',
    email: emailFromUrl,
    otp: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: '',
    showPassword: false,
    showConfirmPassword: false,
    timeLeft: 0,
    canResend: true
  });

  // Timer for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.step === 'otp' && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          return {
            ...prev,
            timeLeft: newTimeLeft,
            canResend: newTimeLeft === 0
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.step, state.timeLeft]);

  const handleInputChange = (field: keyof PasswordResetState) => (e: ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      [field]: e.target.value,
      error: ''
    }));
  };

  const handleSendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.email) {
      setState(prev => ({ ...prev, error: 'Please enter your email address' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await sendPasswordResetOTP(state.email);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to send reset code'
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        step: 'otp',
        timeLeft: 600, // 10 minutes
        canResend: false
      }));

    } catch (error) {
      console.error('Send OTP error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
      }));
    }
  };

  const handleVerifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.otp) {
      setState(prev => ({ ...prev, error: 'Please enter the verification code' }));
      return;
    }

    if (!/^\d{6}$/.test(state.otp)) {
      setState(prev => ({ ...prev, error: 'Verification code must be 6 digits' }));
      return;
    }

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
      const result = await verifyOTPAndResetPassword(state.email, state.otp, state.newPassword);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Invalid or expired verification code'
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        step: 'success'
      }));

    } catch (error) {
      console.error('Verify OTP error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
      }));
    }
  };

  const handleResendOTP = async () => {
    if (!state.canResend) return;

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await sendPasswordResetOTP(state.email);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to resend code'
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        timeLeft: 600, // 10 minutes
        canResend: false,
        otp: '' // Clear previous OTP
      }));

    } catch (error) {
      console.error('Resend OTP error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to resend code. Please try again'
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToEmail = () => {
    setState(prev => ({
      ...prev,
      step: 'email',
      otp: '',
      newPassword: '',
      confirmPassword: '',
      error: '',
      timeLeft: 0,
      canResend: true
    }));
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
            {state.step === 'email' && 'Reset Password'}
            {state.step === 'otp' && 'Enter Verification Code'}
            {state.step === 'success' && 'Password Reset Successful'}
          </h1>
          <p className="text-gray-600">
            {state.step === 'email' && 'Enter your email to receive a verification code'}
            {state.step === 'otp' && 'We sent a 6-digit code to your email'}
            {state.step === 'success' && 'Your password has been successfully reset'}
          </p>
        </div>

        {/* Password Reset Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}

          {/* Step 1: Email Input */}
          {state.step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
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

              <button
                type="submit"
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
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

          {/* Step 2: OTP Verification and Password Reset */}
          {state.step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* Email Display */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Code sent to: <strong>{state.email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={state.otp}
                  onChange={handleInputChange('otp')}
                  disabled={state.loading}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              {/* Timer and Resend */}
              <div className="flex items-center justify-between text-sm">
                {state.timeLeft > 0 ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Code expires in {formatTime(state.timeLeft)}</span>
                  </div>
                ) : (
                  <span className="text-red-600">Code expired</span>
                )}
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!state.canResend || state.loading}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Code</span>
                </button>
              </div>

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
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
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
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={state.loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Email</span>
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {state.step === 'success' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Password reset successful!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                </div>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                <span>Continue to Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {state.step === 'email' && "Remember your password? "}
            {state.step === 'otp' && "Didn't receive the code? Check your spam folder or "}
            {state.step === 'success' && "Need help? "}
            <button
              onClick={state.step === 'success' ? () => {} : handleBackToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {state.step === 'email' && "Sign in"}
              {state.step === 'otp' && "contact support"}
              {state.step === 'success' && "Contact support"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;