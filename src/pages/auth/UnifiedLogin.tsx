import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { signIn } from '../../services/unifiedAuthService';
import { getUserRole } from '../../services/roleLookupService';
import { redirectToRoleDashboard } from '../../utils/roleBasedRouter';
import { useAuth } from '../../context/AuthContext';

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  showRoleSelection: boolean;
  availableRoles: Array<{ role: UserRole; userData: any }>;
  selectedRole: UserRole | null;
}

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    showPassword: false,
    loading: false,
    error: '',
    showRoleSelection: false,
    availableRoles: [],
    selectedRole: null
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value,
      error: '' // Clear error on input change
    }));
  };

  const togglePasswordVisibility = () => {
    setState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate inputs
    if (!state.email || !state.password) {
      setState(prev => ({
        ...prev,
        error: 'Please enter both email and password'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      // Step 1: Authenticate user
      const authResult = await signIn(state.email, state.password);

      if (!authResult.success || !authResult.user) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: authResult.error || 'Authentication failed'
        }));
        return;
      }

      // Step 2: Determine user role
      const roleLookup = await getUserRole(authResult.user.id, authResult.user.email);

      // Debug logging
      console.log('🔍 Role lookup result:', {
        role: roleLookup.role,
        roles: roleLookup.roles,
        hasMultipleRoles: roleLookup.roles && roleLookup.roles.length > 1,
        userData: roleLookup.userData,
        allUserData: roleLookup.allUserData
      });

      // Handle error
      if (roleLookup.error) {
        console.error('❌ Role lookup error:', roleLookup.error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: roleLookup.error || 'Account not properly configured. Contact support'
        }));
        return;
      }

      // Handle multiple roles - show role selection
      if (roleLookup.roles && roleLookup.roles.length > 1 && roleLookup.allUserData) {
        console.log('✅ Multiple roles detected, showing selection screen');
        const rolesWithData = roleLookup.roles.map((role, index) => ({
          role,
          userData: roleLookup.allUserData![index]
        }));

        setState(prev => ({
          ...prev,
          loading: false,
          showRoleSelection: true,
          availableRoles: rolesWithData
        }));
        return;
      }

      // Handle single role
      if (!roleLookup.role || !roleLookup.userData) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Account not properly configured. Contact support'
        }));
        return;
      }

      // Step 3: Store user data in auth context
      const userData = {
        ...roleLookup.userData,
        role: roleLookup.role,
        user_id: authResult.user.id
      };

      login(userData);

      // Step 4: Redirect to role-specific dashboard
      redirectToRoleDashboard(roleLookup.role, navigate);

    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again'
      }));
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleRoleSelection = (role: UserRole, userData: any) => {
    setState(prev => ({ ...prev, loading: true }));

    // Store user data in auth context
    const completeUserData = {
      ...userData,
      role: role
    };

    login(completeUserData);

    // Redirect to role-specific dashboard
    redirectToRoleDashboard(role, navigate);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      student: 'Student',
      recruiter: 'Recruiter',
      educator: 'Educator',
      school_admin: 'School Administrator',
      college_admin: 'College Administrator',
      university_admin: 'University Administrator'
    };
    return roleNames[role];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {state.showRoleSelection ? 'Select Your Role' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {state.showRoleSelection 
              ? 'You have multiple roles. Please select one to continue'
              : 'Sign in to access your dashboard'
            }
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}

          {/* Role Selection */}
          {state.showRoleSelection ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Your account has access to multiple roles. Please select the role you want to use:
              </p>
              {state.availableRoles.map(({ role, userData }) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role, userData)}
                  disabled={state.loading}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{getRoleDisplayName(role)}</h3>
                      {userData.name && (
                        <p className="text-sm text-gray-600 mt-1">{userData.name}</p>
                      )}
                      {userData.school_id && (
                        <p className="text-xs text-gray-500 mt-1">School ID: {userData.school_id}</p>
                      )}
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Login Form */
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

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
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
                className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
              >
                Forgot password?
              </button>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
            </form>
          )}

          {/* Additional Links */}
          {!state.showRoleSelection && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div> */}
      </div>
    </div>
  );
};

export default UnifiedLogin;
