import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, GraduationCap, Info, Lock, Mail, Phone, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { signUpWithRole } from '../../services/authService';
import { completeStudentRegistration, getAllColleges, getAllSchools } from '../../services/studentService';
import { getModalContent, parseStudentType } from '../../utils/getEntityContent';

// Cache for email checks to avoid repeated queries
const emailCheckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function SignupModal({ isOpen, onClose, selectedPlan, studentType, onSignupSuccess, onSwitchToLogin }) {
  // Debug: Log props when component renders (uncomment for debugging)
  // console.log('🎯 SignupModal Props:', { isOpen, studentType, selectedPlan });
  
  // Get entity-specific modal content
  const { signupTitle, description } = getModalContent(studentType || 'student');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    collegeId: '', // For college students
    schoolId: '' // For school students
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const navigate = useNavigate();

  // Load colleges if student type is college
  useEffect(() => {
    const loadColleges = async () => {
      // Parse studentType to get entity (handles both "college" and "college-student")
      const { entity } = parseStudentType(studentType);
      
      if (entity === 'college' && isOpen) {
        console.log('🔍 Loading colleges for student type:', studentType, '→ entity:', entity);
        setLoadingColleges(true);
        const result = await getAllColleges();
        console.log('📊 College fetch result:', result);
        if (result.success) {
          console.log('✅ Colleges loaded:', result.data?.length || 0, 'colleges');
          setColleges(result.data || []);
        } else {
          console.error('❌ Failed to load colleges:', result.error);
        }
        setLoadingColleges(false);
      }
    };

    loadColleges();
  }, [studentType, isOpen]);

  // Load schools if student type is school
  useEffect(() => {
    const loadSchools = async () => {
      // Parse studentType to get entity (handles both "school" and "school-student")
      const { entity } = parseStudentType(studentType);
      
      if (entity === 'school' && isOpen) {
        console.log('🔍 Loading schools for student type:', studentType, '→ entity:', entity);
        setLoadingSchools(true);
        const result = await getAllSchools();
        console.log('📊 School fetch result:', result);
        if (result.success) {
          console.log('✅ Schools loaded:', result.data?.length || 0, 'schools');
          setSchools(result.data || []);
        } else {
          console.error('❌ Failed to load schools:', result.error);
        }
        setLoadingSchools(false);
      }
    };

    loadSchools();
  }, [studentType, isOpen]);

  // Check if email already exists in the database
  useEffect(() => {
    const checkEmailExists = async () => {
      const email = formData.email.trim().toLowerCase();
      
      // Only check if email is valid format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailExists(false);
        setExistingUserInfo(null);
        return;
      }

      // Check cache first
      const cached = emailCheckCache.get(email);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setEmailExists(cached.exists);
        setExistingUserInfo(cached.info);
        return;
      }

      setCheckingEmail(true);
      
      try {
        // Optimized query - only fetch email field for faster lookup
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('email')
          .eq('email', email)
          .maybeSingle();

        const exists = !!studentData;
        const info = exists ? {
          email: email,
          name: 'User', // Don't fetch name on initial check for speed
          hasAuthAccount: true
        } : null;

        // Cache the result
        emailCheckCache.set(email, {
          exists,
          info,
          timestamp: Date.now()
        });

        setEmailExists(exists);
        setExistingUserInfo(info);

        // If email exists, fetch full details in background for better UX
        if (exists) {
          supabase
            .from('students')
            .select('email, name')
            .eq('email', email)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                const fullInfo = {
                  email: email,
                  name: data?.name || 'User',
                  hasAuthAccount: true
                };
                setExistingUserInfo(fullInfo);
                // Update cache with full info
                emailCheckCache.set(email, {
                  exists: true,
                  info: fullInfo,
                  timestamp: Date.now()
                });
              }
            });
        }
      } catch (error) {
        console.error('Error checking email:', error);
        // Email doesn't exist or error occurred
        setEmailExists(false);
        setExistingUserInfo(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    // Longer debounce for better performance (1 second)
    const timeoutId = setTimeout(() => {
      checkEmailExists();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailExists) {
      newErrors.email = 'This email is already registered. Please sign in instead.';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create auth user
      const authResult = await signUpWithRole(
        formData.email,
        formData.password,
        {
          role: 'student', // Set role as student in raw_user_meta_data
          name: formData.fullName,
          phone: formData.phone,
          studentType: studentType // school, university, or college
        }
      );

      if (!authResult.success) {
        // Use message for user-friendly text, fallback to error if it's a string message, then default
        const errorMessage = authResult.message || 
          (typeof authResult.error === 'string' && !authResult.error.includes('_') ? authResult.error : null) || 
          'Registration failed. Please try again.';
        setErrors({ submit: errorMessage });
        setLoading(false);
        return;
      }

      const userId = authResult.user.id;

      // Step 2: Create user and student records in database
      const registrationResult = await completeStudentRegistration(userId, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        studentType: studentType, // 'school', 'college', or 'university'
        schoolId: formData.schoolId || null, // Selected school for school students
        collegeId: formData.collegeId || null // Selected college for college students
      });

      if (!registrationResult.success) {
        console.error('❌ Failed to create student records:', registrationResult.error);
        // Auth user was created but database records failed
        // We should still proceed but log the error
        setErrors({ 
          submit: 'Account created but profile setup incomplete. Please contact support if you experience issues.' 
        });
      }

      // Store user data temporarily for payment flow
      // IMPORTANT: Only store after successful database record creation
      const userData = {
        id: userId,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        studentType: studentType,
        schoolId: formData.schoolId || null,
        collegeId: formData.collegeId || null,
        isNewUser: true,
        studentRecord: registrationResult.data?.student || null,
        // Flag to indicate this is a pending user awaiting payment
        isPendingPayment: true,
        createdAt: new Date().toISOString(),
      };

      // Only store pendingUser if database records were created successfully
      if (registrationResult.success) {
        localStorage.setItem('pendingUser', JSON.stringify(userData));
      } else {
        // If database records failed, don't store - user needs to retry signup
        console.warn('⚠️ Not storing pendingUser - database records incomplete');
      }
      
      // Call success callback to proceed to payment
      if (onSignupSuccess) {
        onSignupSuccess(userData);
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin(); // Switch to login modal
    } else {
      // Fallback: Navigate to appropriate login page
      onClose();
      if (studentType === 'school') {
        navigate('/signin/school');
      } else if (studentType === 'university') {
        navigate('/signin/university');
      } else {
        navigate('/signin/student');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">{signupTitle}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
                {selectedPlan && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                    </p>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {checkingEmail && (
                    <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      Checking email...
                    </div>
                  )}
                  {emailExists && existingUserInfo && !checkingEmail && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-800 font-medium">
                            This email is already registered!
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            An account exists for <span className="font-semibold">{existingUserInfo.name}</span>.
                          </p>
                          <button
                            type="button"
                            onClick={handleLoginRedirect}
                            className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline"
                          >
                            Click here to login instead →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* College Selection (only for college students) */}
                {parseStudentType(studentType).entity === 'college' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Your College <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                      <select
                        name="collegeId"
                        value={formData.collegeId}
                        onChange={handleInputChange}
                        disabled={loadingColleges}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="">Choose your college</option>
                        {colleges.length > 0 ? (
                          colleges.map((college) => (
                            <option key={college.id} value={college.id}>
                              {college.name}{college.city ? ` - ${college.city}` : ''}{college.state ? `, ${college.state}` : ''}
                            </option>
                          ))
                        ) : (
                          !loadingColleges && <option value="" disabled>No colleges available</option>
                        )}
                      </select>
                    </div>
                    {loadingColleges && (
                      <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Loading colleges...
                      </div>
                    )}
                    {!loadingColleges && colleges.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No colleges found. You can add this later in your profile.
                      </p>
                    )}
                    {!loadingColleges && colleges.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Linking your college helps us personalize your experience
                      </p>
                    )}
                  </div>
                )}

                {/* School Selection (only for school students) */}
                {parseStudentType(studentType).entity === 'school' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Your School <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                      <select
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleInputChange}
                        disabled={loadingSchools}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="">Choose your school</option>
                        {schools.length > 0 ? (
                          schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}{school.city ? ` - ${school.city}` : ''}{school.state ? `, ${school.state}` : ''}
                            </option>
                          ))
                        ) : (
                          !loadingSchools && <option value="" disabled>No schools available</option>
                        )}
                      </select>
                    </div>
                    {loadingSchools && (
                      <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Loading schools...
                      </div>
                    )}
                    {!loadingSchools && schools.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No schools found. You can add this later in your profile.
                      </p>
                    )}
                    {!loadingSchools && schools.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Linking your school helps us personalize your experience
                      </p>
                    )}
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min. 8 characters"
                      className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || emailExists || checkingEmail}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : emailExists ? 'Email Already Registered' : 'Sign Up & Continue'}
                </button>

                {/* Login Link */}
                <div className="text-center pt-2 pb-2">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={handleLoginRedirect}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </form>
              
              {/* Bottom padding for scrollability */}
              <div className="h-4"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
