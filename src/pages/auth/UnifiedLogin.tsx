import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
}

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);

  // Get return URL from query params or session storage (for invitation flow)
  const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('invitation_return_url');

  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    showPassword: false,
    loading: false,
    error: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value, error: '' }));
  };

  const togglePasswordVisibility = () => {
    setState(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.email || !state.password) {
      setState(prev => ({ ...prev, error: 'Please enter both email and password' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await login(state.email, state.password);

      if (result.success) {
        const role = result.role;

        // Handle return URL (invitation flow)
        if (returnUrl) {
          sessionStorage.removeItem('invitation_return_url');
          navigate(returnUrl);
          return;
        }

        // Navigate based on role from SSO
        if (role === 'student')           navigate('/student/dashboard');
        else if (role === 'recruiter')    navigate('/recruiter/dashboard');
        else if (role === 'educator')     navigate('/educator/dashboard');
        else if (role?.includes('admin')) navigate('/admin/dashboard');
        else                              navigate('/dashboard');
      } else {
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Login failed' }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again',
      }));
    }
  };

  const handleForgotPassword = () => {
    navigate('/password-reset');
  };

  return (
    <div className="flex items-center lg:py-8 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE - Illustration */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/login/login.jpg"
              alt="Login background"
              className="w-full h-full object-cover"
            />
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
          {/* Gradient bg for mobile/tablet */}
          <div
            className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a6aba] to-[#09277f]"
            aria-hidden
          />

          {/* White bg for lg */}
          <div className="hidden lg:block absolute inset-0 bg-white" />

          {/* Form Container */}
          <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white lg:text-gray-900">
                Sign In
              </h3>
              <p className="text-sm text-white/80 lg:text-gray-600 mt-2">
                Enter your credentials to continue
              </p>
            </div>

            <div className="rounded-2xl bg-transparent lg:bg-white/95 lg:shadow-xl lg:ring-1 lg:ring-black/5 p-5 sm:p-6 lg:p-8">
              {/* Error Message */}
              {state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{state.error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
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
                  <label htmlFor="password" className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
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

                {/* Forgot Password Link */}
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

                {/* Submit Button */}
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

              {/* Additional Links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-white lg:text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-medium text-white lg:text-blue-600 hover:text-white/80 lg:hover:text-blue-500">
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
