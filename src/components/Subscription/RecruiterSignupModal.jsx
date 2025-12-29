import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Briefcase, CheckCircle, Eye, EyeOff, Info, Lock, Mail, Phone, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { sendOtp, verifyOtp as verifyOtpApi } from '../../services/otpService';
import { getModalContent } from '../../utils/getEntityContent';
import DatePicker from './shared/DatePicker';
import { capitalizeFirstLetter } from './shared/signupValidation';

// Cache for email checks
const emailCheckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function RecruiterSignupModal({ isOpen, onClose, selectedPlan, studentType, onSignupSuccess, onSwitchToLogin }) {
  // Get entity-specific modal content
  const { signupTitle, description } = getModalContent(studentType || 'recruitment-recruiter');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyId: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  // Load companies when modal opens
  useEffect(() => {
    const loadCompanies = async () => {
      if (isOpen) {
        setLoadingCompanies(true);
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('id, name')
            .order('name');

          if (error) {
            console.error('Error loading companies:', error);
          } else {
            setCompanies(data || []);
          }
        } catch (error) {
          console.error('Error loading companies:', error);
        } finally {
          setLoadingCompanies(false);
        }
      }
    };

    loadCompanies();
  }, [isOpen]);

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
        // Check recruiters table
        const { data: recruiterData, error: recruiterError } = await supabase
          .from('recruiters')
          .select('email, name')
          .eq('email', email)
          .maybeSingle();

        const exists = !!recruiterData;
        const info = exists ? {
          email: email,
          name: recruiterData.name || 'User',
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
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailExists(false);
        setExistingUserInfo(null);
      } finally {
        setCheckingEmail(false);
      }
    };

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

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    // Company validation
    if (!formData.companyId) {
      newErrors.companyId = 'Please select a company';
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
    
    // Format phone number (remove non-digits)
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid 10-digit phone number' }));
      return;
    }
    
    setSendingOtp(true);
    try {
      const result = await sendOtp(formData.phone);
      if (result.success) {
        setOtpSent(true);
        setErrors(prev => ({ ...prev, phone: '' }));
      } else {
        setErrors(prev => ({ ...prev, phone: result.error || 'Failed to send OTP' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, phone: 'Failed to send OTP. Please try again.' }));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await verifyOtpApi(formData.phone, otp);
      if (result.success) {
        setOtpVerified(true);
        setErrors(prev => ({ ...prev, otp: '' }));
      } else {
        setErrors(prev => ({ ...prev, otp: result.error || 'Invalid OTP' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, otp: 'Failed to verify OTP. Please try again.' }));
    } finally {
      setVerifyingOtp(false);
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_role: 'recruiter'
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      const userId = authData.user.id;

      // Step 2: Create user record in users table
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = capitalizeFirstLetter(nameParts[0] || '');
      const lastName = capitalizeFirstLetter(nameParts.slice(1).join(' ') || '');
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: formData.email,
          firstName: firstName,
          lastName: lastName,
          role: 'recruiter',
          isActive: true,
          dob: formData.dateOfBirth || null
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        // Continue anyway as auth user was created
      }

      // Step 3: Create recruiter record (first_name/last_name stored in users table only)
      const fullName = `${firstName} ${lastName}`.trim();
      const { error: recruiterError } = await supabase
        .from('recruiters')
        .insert({
          user_id: userId,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          company_id: formData.companyId,
          verificationstatus: 'pending',
          isactive: true,
          approval_status: 'pending',
          account_status: 'active'
        });

      if (recruiterError) {
        console.error('Error creating recruiter record:', recruiterError);
        throw new Error('Failed to create recruiter profile');
      }

      // Store user data temporarily for payment flow
      const userData = {
        id: userId,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        user_role: 'recruiter',
        companyId: formData.companyId,
        isNewUser: true
      };

      // Store in localStorage temporarily
      localStorage.setItem('pendingUser', JSON.stringify(userData));
      
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
      onSwitchToLogin();
    } else {
      onClose();
      navigate('/login/recruiter');
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
                      placeholder="your.email@company.com"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {checkingEmail && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      Checking email...
                    </p>
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

                {/* Phone with OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        disabled={otpVerified}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.phone ? 'border-red-500' : otpVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                        } ${otpVerified ? 'cursor-not-allowed' : ''}`}
                      />
                      {otpVerified && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {!otpVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || formData.phone.length !== 10}
                        className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                  {otpVerified && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Phone number verified
                    </p>
                  )}
                </div>

                {/* OTP Input */}
                {otpSent && !otpVerified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter OTP *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otp}
                        onChange={handleOtpChange}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center tracking-widest font-mono text-lg ${
                          errors.otp ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otp.length !== 6}
                        className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.otp}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      OTP sent to +91 {formData.phone}. Valid for 5 minutes.
                    </p>
                  </div>
                )}

                {/* Date of Birth */}
                <DatePicker
                  name="dateOfBirth"
                  label="Date of Birth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  error={errors.dateOfBirth}
                  placeholder="Select your date of birth"
                  maxDate={new Date().toISOString().split('T')[0]}
                />

                {/* Company Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Your Company *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    <select
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleInputChange}
                      disabled={loadingCompanies}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.companyId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="">Choose your company</option>
                      {companies.length > 0 ? (
                        companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))
                      ) : (
                        !loadingCompanies && <option value="" disabled>No companies available</option>
                      )}
                    </select>
                  </div>
                  {loadingCompanies && (
                    <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      Loading companies...
                    </p>
                  )}
                  {errors.companyId && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.companyId}
                    </p>
                  )}
                  {!loadingCompanies && companies.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      No companies found. Please contact support.
                    </p>
                  )}
                  {!loadingCompanies && companies.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      💡 Select the company you'll be recruiting for
                    </p>
                  )}
                </div>

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
                  disabled={loading || emailExists || checkingEmail || !otpVerified}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : emailExists ? 'Email Already Registered' : 'Sign Up & Continue'}
                </button>
                {!otpVerified && (
                  <p className="mt-2 text-xs text-amber-600 text-center">
                    Please verify your phone number with OTP to continue
                  </p>
                )}

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
