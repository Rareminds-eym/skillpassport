import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import { loginStudent } from '../../../../../services/studentAuthService';

const SignInUniversity = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    // Validate all fields
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    if (!emailValid || !passwordValid || Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate with Supabase Auth
      const result = await loginStudent(formData.email, formData.password);

      if (!result.success) {
        setGeneralError(result.error || 'Login failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Store student data in context
      const studentData = result.student;
      login({
        id: studentData.id,
        user_id: studentData.user_id,
        name: studentData.name || studentData.profile?.name || '',
        email: studentData.email,
        role: 'student',
        school_id: studentData.school_id,
        university_college_id: studentData.university_college_id,
        school: studentData.schools,
        university_college: studentData.university_colleges,
        approval_status: studentData.approval_status,
      });

      // Navigate to student dashboard
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <img
              src="/RMLogo.webp"
              alt="Logo"
              className="w-20 h-20 transition-all duration-500 group-hover:scale-110"
            />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2 text-indigo-600">
          University Student Sign In
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Sign in with your registered email and password
        </p>

        {/* General Error */}
        {generalError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-lg">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 pl-10 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-indigo-500'
                }`}
                placeholder="Enter your email"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 pl-10 pr-10 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-indigo-500'
                }`}
                placeholder="Enter your password"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Forgot Password */}
          <div className="text-center">
            <Link
              to="/resetpassword"
              className="text-indigo-600 hover:text-indigo-700 text-sm transition-colors duration-300"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Register Link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup/university"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInUniversity;
