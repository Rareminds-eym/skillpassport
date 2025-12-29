import { AlertCircle, BookOpen, Building, Calendar, ChevronDown, GraduationCap, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { signUpWithRole } from '../../services/authService';
import { getActiveUniversities, getCollegesByUniversity } from '../../services/universityService';
import SignupFormFields from './shared/SignupFormFields';
import { capitalizeFirstLetter, formatOtp, formatPhoneNumber, getInitialFormData, validateSignupFields } from './shared/signupValidation';

export default function UniversityStudentSignupModal({ isOpen, onClose, selectedPlan, studentType, onSignupSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    ...getInitialFormData(),
    universityId: '',
    universityCollegeId: '',
    dateOfBirth: '',
    gender: '',
    enrollmentNumber: '',
    courseName: '',
    expectedGraduationDate: ''
  });

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const totalSteps = 3;
  const stepTitles = ['Institution', 'Personal & Location', 'Academic & Account'];


  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setFormData({
        ...getInitialFormData(),
        universityId: '',
        universityCollegeId: '',
        dateOfBirth: '',
        gender: '',
        enrollmentNumber: '',
        courseName: '',
        expectedGraduationDate: ''
      });
      setOtpSent(false);
      setOtpVerified(false);
      loadUniversities();
    }
  }, [isOpen]);

  // Load colleges when university changes
  useEffect(() => {
    if (formData.universityId) {
      loadColleges(formData.universityId);
    } else {
      setColleges([]);
      setFormData(prev => ({ ...prev, universityCollegeId: '' }));
    }
  }, [formData.universityId]);

  // Check email existence
  useEffect(() => {
    const checkEmail = async () => {
      const email = formData.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailExists(false);
        return;
      }
      setCheckingEmail(true);
      try {
        const { data } = await supabase.from('students').select('email').eq('email', email).maybeSingle();
        setEmailExists(!!data);
      } catch {
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    };
    const timeout = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeout);
  }, [formData.email]);

  const loadUniversities = async () => {
    setLoadingUniversities(true);
    const result = await getActiveUniversities();
    if (result.success) setUniversities(result.data);
    setLoadingUniversities(false);
  };

  const loadColleges = async (universityId) => {
    setLoadingColleges(true);
    const result = await getCollegesByUniversity(universityId);
    if (result.success) setColleges(result.data);
    setLoadingColleges(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;
    if (name === 'phone') processedValue = formatPhoneNumber(value);
    if (name === 'otp') processedValue = formatOtp(value);
    if (name === 'enrollmentNumber') processedValue = value.toUpperCase().slice(0, 30);
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) return;
    setSendingOtp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpSent(true);
    } catch {
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
    } catch {
      setErrors(prev => ({ ...prev, otp: 'Invalid OTP.' }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.universityId) newErrors.universityId = 'Please select your university';
    if (!formData.universityCollegeId) newErrors.universityCollegeId = 'Please select your college';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const validationErrors = validateSignupFields(formData, {
      requirePhone: true,
      requireOtp: false,
      requireLocation: true,
      emailExists
    });
    // Remove password validation for step 2
    delete validationErrors.password;
    delete validationErrors.confirmPassword;
    delete validationErrors.agreeToTerms;
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Privacy Policy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setErrors({});
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setErrors({});
    setStep(prev => Math.max(prev - 1, 1));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setErrors({});

    try {
      const firstName = capitalizeFirstLetter(formData.firstName);
      const lastName = capitalizeFirstLetter(formData.lastName);
      const fullName = `${firstName} ${lastName}`.trim();
      
      const authResult = await signUpWithRole(formData.email, formData.password, {
        role: 'student',
        name: fullName,
        phone: formData.phone,
        studentType: 'university'
      });

      if (!authResult.success) {
        setErrors({ submit: authResult.message || 'Registration failed' });
        setLoading(false);
        return;
      }

      const userId = authResult.user.id;

      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email: formData.email,
        firstName: firstName,
        lastName: lastName,
        role: 'college_student',
        isActive: true
      });

      if (userError) console.error('Error creating user record:', userError);

      // Note: first_name/last_name stored in users table only
      const { error: studentError } = await supabase.from('students').insert({
        user_id: userId,
        email: formData.email,
        name: fullName,
        contact_number: formData.phone || null,
        universityId: formData.universityId,
        university_college_id: formData.universityCollegeId,
        student_type: 'university',
        enrollmentNumber: formData.enrollmentNumber || null,
        course_name: formData.courseName || null,
        expectedGraduationDate: formData.expectedGraduationDate || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        preferred_language: formData.preferredLanguage,
        referral_code: formData.referralCode || null,
        approval_status: 'pending'
      });

      if (studentError) {
        console.error('Error creating student record:', studentError);
        setErrors({ submit: 'Account created but profile setup incomplete.' });
      }

      const userData = {
        id: userId,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        studentType: 'university',
        country: formData.country,
        state: formData.state,
        city: formData.city,
        isNewUser: true
      };

      localStorage.setItem('pendingUser', JSON.stringify(userData));
      if (onSignupSuccess) onSignupSuccess(userData);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                University Student Registration
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            {selectedPlan && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm font-medium text-purple-900">
                  {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                </p>
              </div>
            )}

            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-4 w-full h-0.5 bg-gray-200 -z-10"></div>
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex flex-col items-center bg-white px-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {s}
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-600 hidden sm:block">
                      {stepTitles[s - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Institution Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <Building className="w-5 h-5" />
                    <span className="font-semibold">Select Your Institution</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="universityId"
                        value={formData.universityId}
                        onChange={handleChange}
                        disabled={loadingUniversities}
                        className={`pl-10 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none bg-white ${
                          errors.universityId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">{loadingUniversities ? 'Loading...' : 'Select your university'}</option>
                        {universities.map(uni => (
                          <option key={uni.id} value={uni.id}>{uni.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.universityId && <p className="mt-1 text-xs text-red-600">{errors.universityId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="universityCollegeId"
                        value={formData.universityCollegeId}
                        onChange={handleChange}
                        disabled={!formData.universityId || loadingColleges}
                        className={`pl-10 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none bg-white disabled:bg-gray-50 ${
                          errors.universityCollegeId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {!formData.universityId ? 'Select university first' : loadingColleges ? 'Loading...' : 'Select your college'}
                        </option>
                        {colleges.map(college => (
                          <option key={college.id} value={college.id}>{college.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.universityCollegeId && <p className="mt-1 text-xs text-red-600">{errors.universityCollegeId}</p>}
                  </div>
                </div>
              )}


              {/* Step 2: Personal & Location Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <SignupFormFields
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    checkingEmail={checkingEmail}
                    emailExists={emailExists}
                    onLoginRedirect={onSwitchToLogin}
                    otpSent={otpSent}
                    otpVerified={otpVerified}
                    onSendOtp={handleSendOtp}
                    onVerifyOtp={handleVerifyOtp}
                    sendingOtp={sendingOtp}
                    verifyingOtp={verifyingOtp}
                  />
                </div>
              )}

              {/* Step 3: Academic & Account */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">Academic & Account Setup</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment/Roll Number</label>
                    <input
                      type="text"
                      name="enrollmentNumber"
                      value={formData.enrollmentNumber}
                      onChange={handleChange}
                      placeholder="e.g., 2024UG001"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program Name</label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleChange}
                      placeholder="e.g., B.Tech Computer Science"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="expectedGraduationDate"
                        value={formData.expectedGraduationDate}
                        onChange={handleChange}
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <button type="button" onClick={handleBack} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    Back
                  </button>
                ) : <div></div>}

                {step < totalSteps ? (
                  <button type="button" onClick={handleNext} disabled={loading} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
                    Next Step
                  </button>
                ) : (
                  <button type="submit" disabled={loading || emailExists} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : 'Create Account'}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center border-t pt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={onSwitchToLogin} className="text-purple-600 hover:text-purple-700 font-medium">
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
