import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Lock, Mail, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetOtp, signIn, verifyOtpAndResetPassword } from '../../services/authService';
import { getModalContent } from '../../utils/getEntityContent';

export default function LoginModal({ isOpen, onClose, selectedPlan, studentType, onLoginSuccess, onSwitchToSignup }) {
  // Get entity-specific modal content
  const { loginTitle, description } = getModalContent(studentType || 'student');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' or 'forgot-password'
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [resetStatus, setResetStatus] = useState({ success: false, message: '' });
  const navigate = useNavigate();

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

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await sendPasswordResetOtp(formData.email);

    setLoading(false);

    if (result.success) {
      setResetStep(2);
      setResetStatus({
        success: true,
        message: 'OTP sent to your email.'
      });
    } else {
      setErrors({ submit: result.error || 'Failed to send OTP.' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.otp.trim()) newErrors.otp = 'OTP is required';
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await verifyOtpAndResetPassword(formData.email, formData.otp, formData.newPassword);

    setLoading(false);

    if (result.success) {
      setResetStatus({
        success: true,
        message: 'Password reset successfully! You are now logged in.'
      });
      // Optionally auto-login or redirect
      setTimeout(() => {
        onClose();
        // You might want to trigger onLoginSuccess here if the session is established
        // But for now, let's just close and let them login with new password or assume session is active
        // Ideally verifyOtpAndResetPassword returns session, we can use that.
        // For this implementation, we'll ask them to login again or just close.
        // Let's switch back to login view with success message
        setView('login');
        setResetStep(1);
        setFormData(prev => ({ ...prev, password: '' }));
      }, 2000);
    } else {
      setErrors({ submit: result.error || 'Failed to reset password.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call authentication service to sign in
      const result = await signIn(formData.email, formData.password);

      if (!result.success) {
        setErrors({ submit: result.error || 'Login failed. Please check your credentials.' });
        setLoading(false);
        return;
      }


      // Store user data for subscription flow
      const userData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name || result.user.email.split('@')[0],
        role: result.role
      };

      // Call the success callback
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    onClose();
    navigate('/signup');
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md overflow-hidden relative pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 p-8 text-white text-center relative rounded-t-3xl">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold mb-1">
                  {view === 'login' ? 'Login Here' : 'Reset Password'}
                </h2>
              </div>

              <div className="p-8 shadow-xl rounded-2xl">
                {/* Selected Plan Info */}
                {view === 'login' && selectedPlan && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-blue-800 font-medium text-center">
                      {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                    </p>
                  </div>
                )}

                {view === 'forgot-password' ? (
                  <form onSubmit={resetStep === 1 ? handleSendOtp : handleResetPassword} className="space-y-5">
                    {resetStatus.success && resetStep === 2 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          {resetStatus.message}
                        </p>
                      </div>
                    )}

                    {resetStep === 1 ? (
                      // Step 1: Email
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'
                              } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                            placeholder="Enter your email"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>
                        )}
                      </div>
                    ) : (
                      // Step 2: OTP & New Password
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            OTP Code *
                          </label>
                          <div className="relative">
                            <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="otp"
                              value={formData.otp}
                              onChange={handleInputChange}
                              className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.otp ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'
                                } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                              placeholder="Enter 6-digit OTP"
                            />
                          </div>
                          {errors.otp && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.otp}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            New Password *
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className={`w-full pl-11 pr-12 py-3 rounded-xl border ${errors.newPassword ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'
                                } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.newPassword && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.newPassword}</p>
                          )}
                        </div>
                      </>
                    )}

                    {errors.submit && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.submit}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      {loading
                        ? 'Processing...'
                        : resetStep === 1 ? 'Send OTP' : 'Reset Password'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (resetStep === 2) {
                            setResetStep(1);
                            setResetStatus({ success: false, message: '' });
                            setErrors({});
                          } else {
                            setView('login');
                            setErrors({});
                          }
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                      >
                        {resetStep === 2 ? 'Back to Email' : 'Back to Login'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3.5 rounded-xl bg-gray-100 border-0 ${errors.email ? 'ring-2 ring-red-300' : 'focus:ring-2 focus:ring-gray-300'
                            } transition-all outline-none placeholder-gray-500`}
                          placeholder="Email"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3.5 pr-12 rounded-xl bg-gray-100 border-0 ${errors.password ? 'ring-2 ring-red-300' : 'focus:ring-2 focus:ring-gray-300'
                            } transition-all outline-none placeholder-gray-500`}
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>
                      )}
                      <div className="flex justify-center mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setView('forgot-password');
                            setErrors({});
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Request a <span className="underline">New Password</span>
                        </button>
                      </div>
                    </div>

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
                      disabled={loading}
                      className="w-full bg-black text-white py-3.5 rounded-full font-semibold text-base hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-6"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing in...
                        </span>
                      ) : 'Create account'}
                    </button>

                    {/* Signup Link */}
                    <div className="text-center pt-4 pb-1">
                      <p className="text-sm text-gray-700">
                        New here?{' '}
                        <button
                          type="button"
                          onClick={handleSignupRedirect}
                          className="text-gray-900 font-semibold underline hover:text-gray-700 transition-all"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
