import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { updatePassword } from '../../services/unifiedAuthService';

interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  error: string;
  success: boolean;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  
  const [state, setState] = useState<ResetPasswordState>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    error: '',
    success: false
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value,
      error: ''
    }));
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setState(prev => ({
      ...prev,
      [field === 'password' ? 'showPassword' : 'showConfirmPassword']: 
        !prev[field === 'password' ? 'showPassword' : 'showConfirmPassword']
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate inputs
    if (!state.password || !state.confirmPassword) {
      setState(prev => ({
        ...prev,
        error: 'Please enter and confirm your new password'
      }));
      return;
    }

    if (state.password.length < 6) {
      setState(prev => ({
        ...prev,
        error: 'Password must be at least 6 characters long'
      }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({
        ...prev,
        error: 'Passwords do not match'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await updatePassword(state.password);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to update password'
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: true
      }));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Password reset error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}

          {/* Success Message */}
          {state.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">Password updated successfully!</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          {!state.success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={state.showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.password}
                    onChange={handleInputChange}
                    disabled={state.loading}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
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

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={state.showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.confirmPassword}
                    onChange={handleInputChange}
                    disabled={state.loading}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    disabled={state.loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={state.showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {state.showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
