import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, GraduationCap, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { sendOtp, verifyOtp as verifyOtpApi } from '../../services/otpService';
import { getAllColleges, getAllSchools } from '../../services/studentService';
import { unifiedSignup } from '../../services/userApiService';
import { getModalContent, parseStudentType } from '../../utils/getEntityContent';
import SignupFormFields from './shared/SignupFormFields';
import { capitalizeFirstLetter, formatOtp, formatPhoneNumber, getInitialFormData, validateSignupFields } from './shared/signupValidation';

// Cache for email checks to avoid repeated queries
const emailCheckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function SignupModal({ isOpen, onClose, selectedPlan, studentType, onSignupSuccess, onSwitchToLogin }) {
  const { signupTitle, description } = getModalContent(studentType || 'student');

  const [formData, setFormData] = useState({
    ...getInitialFormData(),
    collegeId: '',
    schoolId: ''
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const navigate = useNavigate();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...getInitialFormData(),
        collegeId: '',
        schoolId: ''
      });
      setErrors({});
      setOtpSent(false);
      setOtpVerified(false);
    }
  }, [isOpen]);

  // Load colleges if student type is college
  useEffect(() => {
    const loadColleges = async () => {
      const { entity } = parseStudentType(studentType);
      if (entity === 'college' && isOpen) {
        setLoadingColleges(true);
        const result = await getAllColleges();
        if (result.success) {
          setColleges(result.data || []);
        }
        setLoadingColleges(false);
      }
    };
    loadColleges();
  }, [studentType, isOpen]);

  // Load schools if student type is school
  useEffect(() => {
    const loadSchools = async () => {
      const { entity } = parseStudentType(studentType);
      if (entity === 'school' && isOpen) {
        setLoadingSchools(true);
        const result = await getAllSchools();
        if (result.success) {
          setSchools(result.data || []);
        }
        setLoadingSchools(false);
      }
    };
    loadSchools();
  }, [studentType, isOpen]);

  // Check if email already exists
  useEffect(() => {
    const checkEmailExists = async () => {
      const email = formData.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailExists(false);
        setExistingUserInfo(null);
        return;
      }

      const cached = emailCheckCache.get(email);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setEmailExists(cached.exists);
        setExistingUserInfo(cached.info);
        return;
      }

      setCheckingEmail(true);
      try {
        const { data: studentData } = await supabase
          .from('students')
          .select('email')
          .eq('email', email)
          .maybeSingle();

        const exists = !!studentData;
        const info = exists ? { email, name: 'User', hasAuthAccount: true } : null;

        emailCheckCache.set(email, { exists, info, timestamp: Date.now() });
        setEmailExists(exists);
        setExistingUserInfo(info);
      } catch (error) {
        setEmailExists(false);
        setExistingUserInfo(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    } else if (name === 'otp') {
      processedValue = formatOtp(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) return;
    
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
    if (!formData.otp || formData.otp.length !== 6) return;

    setVerifyingOtp(true);
    try {
      const result = await verifyOtpApi(formData.phone, formData.otp);
      if (result.success) {
        setOtpVerified(true);
        setFormData(prev => ({ ...prev, otpVerified: true }));
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

  const validateForm = () => {
    const validationErrors = validateSignupFields(formData, {
      requirePhone: true,
      requireOtp: false,
      requireLocation: true,
      emailExists
    });
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const firstName = capitalizeFirstLetter(formData.firstName);
      const lastName = capitalizeFirstLetter(formData.lastName);
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Determine role based on student type
      const { entity } = parseStudentType(studentType);
      const role = entity === 'college' ? 'college_student' : 'school_student';
      
      // Use Worker API for signup with proper rollback
      const result = await unifiedSignup({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role,
        phone: formData.phone || null,
        dateOfBirth: formData.dateOfBirth || null,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        preferredLanguage: formData.preferredLanguage,
        referralCode: formData.referralCode || null,
      });

      if (!result.success) {
        setErrors({ submit: result.error || 'Registration failed. Please try again.' });
        setLoading(false);
        return;
      }

      const userId = result.data.userId;

      // Update student record with additional fields (school/college ID)
      if (formData.schoolId || formData.collegeId) {
        const updateData = {};
        if (formData.schoolId) updateData.school_id = formData.schoolId;
        if (formData.collegeId) updateData.college_id = formData.collegeId;
        
        await supabase
          .from('students')
          .update(updateData)
          .eq('user_id', userId);
      }

      const userData = {
        id: userId,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        studentType: studentType,
        schoolId: formData.schoolId || null,
        collegeId: formData.collegeId || null,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        isNewUser: true,
        isPendingPayment: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('pendingUser', JSON.stringify(userData));

      if (onSignupSuccess) {
        onSignupSuccess(userData);
      }
    } catch (error) {
      console.error('Registration error:', error);
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
      navigate('/signin/student');
    }
  };

  if (!isOpen) return null;

  const { entity } = parseStudentType(studentType);

  const institutionComponent = (
    <>
      {entity === 'college' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Your College <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="collegeId"
              value={formData.collegeId}
              onChange={handleInputChange}
              disabled={loadingColleges}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">Choose your college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}{college.city ? ` - ${college.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {entity === 'school' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Your School <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="schoolId"
              value={formData.schoolId}
              onChange={handleInputChange}
              disabled={loadingSchools}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">Choose your school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}{school.city ? ` - ${school.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <X className="w-6 h-6" />
              </button>
              <div className="p-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">{signupTitle}</h2>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
                {selectedPlan && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                    </p>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <SignupFormFields
                  formData={formData}
                  errors={errors}
                  onChange={handleInputChange}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  checkingEmail={checkingEmail}
                  emailExists={emailExists}
                  existingUserInfo={existingUserInfo}
                  onLoginRedirect={handleLoginRedirect}
                  showInstitutionField={entity === 'college' || entity === 'school'}
                  institutionComponent={institutionComponent}
                  otpSent={otpSent}
                  otpVerified={otpVerified}
                  onSendOtp={handleSendOtp}
                  onVerifyOtp={handleVerifyOtp}
                  sendingOtp={sendingOtp}
                  verifyingOtp={verifyingOtp}
                />
                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || emailExists || !otpVerified}
                  className="w-full mt-6 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                {!otpVerified && (
                  <p className="mt-2 text-xs text-amber-600 text-center">
                    Please verify your phone number with OTP to continue
                  </p>
                )}
                <div className="mt-4 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={handleLoginRedirect} className="text-blue-600 font-medium">
                    Sign in here
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
