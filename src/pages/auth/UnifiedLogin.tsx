import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, UserCircle } from 'lucide-react';
import { signIn, UserRole } from '../../services/unifiedAuthService';
import { getUserRole } from '../../services/roleLookupService';
import { redirectToRoleDashboard } from '../../utils/roleBasedRouter';
import { useAuth } from '../../context/AuthContext';

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
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
    selectedRole: null
  });

  const allRoles: UserRole[] = [
    'student',
    'recruiter',
    'educator',
    'school_admin',
    'college_admin',
    'university_admin'
  ];

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value,
      error: ''
    }));
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      selectedRole: e.target.value as UserRole,
      error: ''
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

    // Validate role selection
    if (!state.selectedRole) {
      setState(prev => ({
        ...prev,
        error: 'Please select a role'
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

      // Step 2: Determine user roles
      const roleLookup = await getUserRole(authResult.user.id, authResult.user.email);

      console.log('🔍 Role lookup result:', roleLookup);

      // Handle error - no roles found
      if (roleLookup.error || (!roleLookup.role && (!roleLookup.roles || roleLookup.roles.length === 0))) {
        console.error('❌ Role lookup error:', roleLookup.error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: roleLookup.error || 'Account not properly configured. Contact support'
        }));
        return;
      }

      // Step 3: Check if user has the selected role
      let userHasSelectedRole = false;
      let userDataForRole = null;

      if (roleLookup.roles && roleLookup.roles.length > 0 && roleLookup.allUserData) {
        // Multiple roles
        const roleIndex = roleLookup.roles.indexOf(state.selectedRole);
        if (roleIndex !== -1) {
          userHasSelectedRole = true;
          userDataForRole = roleLookup.allUserData[roleIndex];
        }
      } else if (roleLookup.role === state.selectedRole && roleLookup.userData) {
        // Single role matches
        userHasSelectedRole = true;
        userDataForRole = roleLookup.userData;
      }

      if (!userHasSelectedRole || !state.selectedRole) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Not authorized. You do not have access to the ${state.selectedRole ? getRoleDisplayName(state.selectedRole) : 'selected'} role.`
        }));
        return;
      }

      // Step 4: Store user data in auth context
      const userData = {
        ...userDataForRole,
        role: state.selectedRole,
        user_id: authResult.user.id
      };

      login(userData);

      // Step 5: Redirect to role-specific dashboard
      redirectToRoleDashboard(state.selectedRole, navigate);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
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

          {/* Login Form */}
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

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={state.selectedRole || ''}
                  onChange={handleRoleChange}
                  disabled={state.loading}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors appearance-none bg-white"
                >
                  <option value="">Choose your role...</option>
                  {allRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select the role you want to log in as
              </p>
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

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
