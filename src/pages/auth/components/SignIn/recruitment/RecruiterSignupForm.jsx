import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../../lib/supabaseClient';

const RecruiterSignupForm = ({ onSuccess, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    workspaceId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const blobRefs = {
    workspaceId: useRef(null),
    fullName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null)
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };

    switch (name) {
      case 'workspaceId':
        if (!value) {
          newErrors.workspaceId = 'Workspace ID is required';
          newSuccess.workspaceId = false;
        } else if (value.length < 6) {
          newErrors.workspaceId = 'Workspace ID must be at least 6 characters';
          newSuccess.workspaceId = false;
        } else {
          newErrors.workspaceId = '';
          newSuccess.workspaceId = true;
        }
        break;

      case 'fullName':
        if (!value) {
          newErrors.fullName = 'Full name is required';
          newSuccess.fullName = false;
        } else if (value.length < 2) {
          newErrors.fullName = 'Full name must be at least 2 characters';
          newSuccess.fullName = false;
        } else {
          newErrors.fullName = '';
          newSuccess.fullName = true;
        }
        break;

      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
          newSuccess.email = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
          newSuccess.email = false;
        } else {
          newErrors.email = '';
          newSuccess.email = true;
        }
        break;

      case 'phone':
        if (!value) {
          newErrors.phone = 'Phone number is required';
          newSuccess.phone = false;
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
          newSuccess.phone = false;
        } else {
          newErrors.phone = '';
          newSuccess.phone = true;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
          newSuccess.password = false;
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
          newSuccess.password = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
          newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
          newSuccess.password = false;
        } else {
          newErrors.password = '';
          newSuccess.password = true;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
          newSuccess.confirmPassword = false;
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
          newSuccess.confirmPassword = false;
        } else {
          newErrors.confirmPassword = '';
          newSuccess.confirmPassword = true;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setSuccess(newSuccess);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    validateField(name, processedValue);
    animateBlob(name);
  };

  const animateBlob = (fieldName) => {
    const blob = blobRefs[fieldName]?.current;
    if (blob) {
      blob.style.transform = 'scale(1.1)';
      blob.style.transition = 'transform 0.3s ease';
      
      setTimeout(() => {
        if (blob) {
          blob.style.transform = 'scale(1)';
        }
      }, 300);
    }
  };

  const validateForm = () => {
    const fields = ['workspaceId', 'fullName', 'email', 'phone', 'password', 'confirmPassword'];
    let isValid = true;

    fields.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field] || !formData[field]) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Verify workspace exists (you'll need to implement this based on your workspace table)
      // For now, we'll skip this check
      
      // 2. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'recruiter'
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 3. Create recruiter record
      const { error: recruiterError } = await supabase
        .from('recruiters')
        .insert({
          user_id: authData.user.id,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          verificationstatus: 'pending',
          isactive: true,
          approval_status: 'pending',
          account_status: 'active'
        });

      if (recruiterError) {
        throw new Error(recruiterError.message);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        alert('Account created successfully! Please check your email to verify your account.');
        navigate('/login/recruiter');
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      alert(`Signup failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="relative group">
          <img 
            src="/RMLogo.webp" 
            alt="Logo" 
            className="w-20 h-20 transition-all duration-1000 group-hover:scale-110 group-hover:brightness-125 filter drop-shadow-lg group-hover:drop-shadow-[0_0_30px_rgba(255,255,0,0.7)]"
          />
          <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-1000 group-hover:animate-pulse"></div>
        </div>
      </div>
      
      <h1 className="text-2xl font-semibold text-center mb-2 text-blue-600 uppercase">
        Join Workspace
      </h1>
      <p className="text-center text-gray-600 mb-8">Enter your workspace ID to join your company</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workspace ID */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              name="workspaceId"
              value={formData.workspaceId}
              onChange={handleChange}
              onFocus={() => animateBlob('workspaceId')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.workspaceId 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.workspaceId 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Workspace ID *"
            />
            <div
              ref={blobRefs.workspaceId}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.workspaceId && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.workspaceId}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Enter the Workspace ID provided by your admin
          </p>
        </div>

        {/* Full Name */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onFocus={() => animateBlob('fullName')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.fullName 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.fullName 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Full Name *"
            />
            <div
              ref={blobRefs.fullName}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => animateBlob('email')}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : success.email 
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-blue-200 focus:border-blue-100'
                }`}
                placeholder="Email *"
              />
              <div
                ref={blobRefs.email}
                className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
              ></div>
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => animateBlob('phone')}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                  errors.phone 
                    ? 'border-red-500 focus:border-red-500' 
                    : success.phone 
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-blue-200 focus:border-blue-100'
                }`}
                placeholder="Phone *"
              />
              <div
                ref={blobRefs.phone}
                className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
              ></div>
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="relative">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => animateBlob('password')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.password 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Password *"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div
              ref={blobRefs.password}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => animateBlob('confirmPassword')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.confirmPassword 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.confirmPassword 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Confirm Password *"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div
              ref={blobRefs.confirmPassword}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Creating Account...
            </div>
          ) : (
            'Join Workspace'
          )}
        </button>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Login here
              </button>
            ) : (
              <Link to="/login/recruiter" className="text-blue-600 hover:text-blue-700 font-medium">
                Login here
              </Link>
            )}
          </p>
        </div>
      </form>
    </div>
  );
};

export default RecruiterSignupForm;
