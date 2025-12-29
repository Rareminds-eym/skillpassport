import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Building2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { checkEmail, getColleges, getSchools, getUniversities, signupCollegeEducator, signupEducator, signupUniversityEducator } from '../../services/userApiService';
import SignupFormFields from './shared/SignupFormFields';
import { capitalizeFirstLetter, formatOtp, formatPhoneNumber, getInitialFormData, validateSignupFields } from './shared/signupValidation';

// Cache for email checks
const emailCheckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const parseEntityType = (studentType) => {
  if (!studentType || typeof studentType !== 'string') return 'school';
  const normalized = studentType.toLowerCase().trim();
  if (normalized.includes('university')) return 'university';
  if (normalized.includes('college')) return 'college';
  return 'school';
};

const isHigherEducation = (entityType) => entityType === 'college' || entityType === 'university';

const getEntityLabel = (entityType) => {
  switch (entityType) {
    case 'university': return 'University';
    case 'college': return 'College';
    default: return 'School';
  }
};

export default function EducatorSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin, studentType }) {
  const entityType = parseEntityType(studentType);
  
  const [formData, setFormData] = useState({
    ...getInitialFormData(),
    firstName: '',
    lastName: '',
    institutionId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingEducatorInfo, setExistingEducatorInfo] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
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
        firstName: '',
        lastName: '',
        institutionId: ''
      });
      setErrors({});
      setOtpSent(false);
      setOtpVerified(false);
    }
  }, [isOpen]);

  // Fetch institutions based on entity type
  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!isOpen) return;
      setLoadingInstitutions(true);
      try {
        let result;
        if (entityType === 'university') {
          result = await getUniversities();
        } else if (entityType === 'college') {
          result = await getColleges();
        } else {
          result = await getSchools();
        }
        if (result.success && result.data) {
          setInstitutions(result.data);
        } else {
          setInstitutions([]);
        }
      } catch (error) {
        console.error(`Failed to fetch ${entityType}s:`, error);
        setInstitutions([]);
      }
      setLoadingInstitutions(false);
    };
    fetchInstitutions();
  }, [isOpen, entityType]);

  // Check if email exists
  useEffect(() => {
    const checkEmailExists = async () => {
      const email = formData.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailExists(false);
        setExistingEducatorInfo(null);
        return;
      }

      const cached = emailCheckCache.get(email);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setEmailExists(cached.exists);
        setExistingEducatorInfo(cached.info);
        return;
      }

      setCheckingEmail(true);
      try {
        const result = await checkEmail(email);
        const exists = result.exists;
        const info = exists ? { email, name: 'User', hasAuthAccount: true } : null;
        emailCheckCache.set(email, { exists, info, timestamp: Date.now() });
        setEmailExists(exists);
        setExistingEducatorInfo(info);
      } catch (error) {
        setEmailExists(false);
        setExistingEducatorInfo(null);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpSent(true);
    } catch (error) {
      setErrors(prev => ({ ...prev, phone: 'Failed to send OTP.' }));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) return;
    setVerifyingOtp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpVerified(true);
      setFormData(prev => ({ ...prev, otpVerified: true }));
    } catch (error) {
      setErrors(prev => ({ ...prev, otp: 'Invalid OTP.' }));
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

    // Additional validation for institution (required for higher education)
    if (isHigherEducation(entityType) && !formData.institutionId) {
      validationErrors.institutionId = `Please select a ${entityType}`;
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedInstitutionId = formData.institutionId?.trim() || null;
      const firstName = capitalizeFirstLetter(formData.firstName);
      const lastName = capitalizeFirstLetter(formData.lastName);

      let result;
      const signupData = {
        email: formData.email.toLowerCase(),
        password: formData.password,
        firstName: firstName,
        lastName: lastName,
        phone: formData.phone || undefined,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        preferredLanguage: formData.preferredLanguage,
        referralCode: formData.referralCode || undefined
      };

      if (entityType === 'university') {
        result = await signupUniversityEducator({ ...signupData, universityId: selectedInstitutionId });
      } else if (entityType === 'college') {
        result = await signupCollegeEducator({ ...signupData, collegeId: selectedInstitutionId });
      } else {
        result = await signupEducator({ ...signupData, schoolId: selectedInstitutionId });
      }

      if (!result.success) {
        setErrors({ submit: result.error || 'Registration failed.' });
        setLoading(false);
        return;
      }

      // Auto-login
      await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase(),
        password: formData.password
      });

      const userData = {
        id: result.data.userId,
        name: result.data.name || `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        email: result.data.email || formData.email,
        phone: formData.phone,
        user_role: result.data.role,
        schoolId: entityType === 'school' ? selectedInstitutionId : null,
        collegeId: entityType === 'college' ? selectedInstitutionId : null,
        universityId: entityType === 'university' ? selectedInstitutionId : null,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        isNewUser: true
      };

      localStorage.setItem('pendingUser', JSON.stringify(userData));

      if (onSignupSuccess) {
        onSignupSuccess(userData);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      onClose();
      navigate('/signin/educator');
    }
  };

  if (!isOpen) return null;

  // Institution selection component
  const institutionComponent = (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isHigherEducation(entityType) ? `Select Your ${getEntityLabel(entityType)} *` : 'Select Your School'}
        {!isHigherEducation(entityType) && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
      </label>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <select
          name="institutionId"
          value={formData.institutionId}
          onChange={handleInputChange}
          disabled={loadingInstitutions}
          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.institutionId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">
            {loadingInstitutions ? `Loading ${entityType}s...` : `Select your ${entityType}`}
          </option>
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>
              {inst.name} - {inst.city}, {inst.state}
            </option>
          ))}
        </select>
      </div>
      {errors.institutionId && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors.institutionId}
        </p>
      )}
    </div>
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
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <X className="w-6 h-6" />
              </button>

              <div className="p-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create {getEntityLabel(entityType)} Educator Account
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sign up to purchase the {selectedPlan?.name} plan
                </p>
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
                  existingUserInfo={existingEducatorInfo}
                  onLoginRedirect={handleLoginRedirect}
                  showInstitutionField={true}
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
                  disabled={loading || emailExists}
                  className="w-full mt-6 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

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
