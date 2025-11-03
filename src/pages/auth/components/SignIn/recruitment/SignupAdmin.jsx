import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SignupAdmin = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Details
    companyName: '',
    companyDomain: '',
    companySize: '',
    industryType: '',
    companyLogo: null,
    companyRegistrationNo: '',
    companyAddress: '',
    officialEmailDomain: '',
    recruitmentFocus: [],
    
    // Admin Account Details
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    designation: '',
    customDesignation: '',
    
    // Security
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const blobRefs = {
    // Company Details
    companyName: useRef(null),
    companyDomain: useRef(null),
    companySize: useRef(null),
    industryType: useRef(null),
    companyRegistrationNo: useRef(null),
    companyAddress: useRef(null),
    officialEmailDomain: useRef(null),
    
    // Admin Details
    fullName: useRef(null),
    workEmail: useRef(null),
    phoneNumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    designation: useRef(null),
    customDesignation: useRef(null)
  };

  const companySizes = [
    '1-10',
    '11-50', 
    '51-200',
    '201-500',
    '500+'
  ];

  const industryTypes = [
    'IT & Software',
    'Education',
    'Manufacturing',
    'Healthcare',
    'Finance',
    'Retail',
    'Construction',
    'Hospitality',
    'Transportation',
    'Other'
  ];

  const designationOptions = [
    'HR Manager',
    'Recruitment Manager',
    'Talent Acquisition Specialist',
    'HR Director',
    'Recruitment Coordinator',
    'Team Lead',
    'Department Head',
    'Other'
  ];

  const recruitmentFocusOptions = [
    'Internship',
    'Apprenticeship',
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance'
  ];

  // Debug logging function
  const debugLog = (message, data = null) => {
    console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };

    debugLog(`Validating field: ${name}`, { value });

    switch (name) {
      // Company Details Validations
      case 'companyName':
        if (!value) {
          newErrors.companyName = 'Company name is required';
          newSuccess.companyName = false;
        } else if (value.length < 2) {
          newErrors.companyName = 'Company name must be at least 2 characters';
          newSuccess.companyName = false;
        } else {
          newErrors.companyName = '';
          newSuccess.companyName = true;
        }
        break;

      case 'companyDomain':
        if (!value) {
          newErrors.companyDomain = 'Company domain is required';
          newSuccess.companyDomain = false;
        } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(value)) {
          newErrors.companyDomain = 'Please enter a valid domain (e.g., rareminds.in)';
          newSuccess.companyDomain = false;
        } else {
          newErrors.companyDomain = '';
          newSuccess.companyDomain = true;
        }
        break;

      case 'companySize':
        if (!value) {
          newErrors.companySize = 'Company size is required';
          newSuccess.companySize = false;
        } else {
          newErrors.companySize = '';
          newSuccess.companySize = true;
        }
        break;

      case 'industryType':
        if (!value) {
          newErrors.industryType = 'Industry type is required';
          newSuccess.industryType = false;
        } else {
          newErrors.industryType = '';
          newSuccess.industryType = true;
        }
        break;

      case 'companyLogo':
        if (!value) {
          newErrors.companyLogo = 'Company logo is required';
          newSuccess.companyLogo = false;
        } else {
          newErrors.companyLogo = '';
          newSuccess.companyLogo = true;
        }
        break;

      case 'companyRegistrationNo':
        if (!value) {
          newErrors.companyRegistrationNo = 'Company registration number/GSTIN is required';
          newSuccess.companyRegistrationNo = false;
        } else if (value.length < 3) {
          newErrors.companyRegistrationNo = 'Please enter a valid registration number';
          newSuccess.companyRegistrationNo = false;
        } else {
          newErrors.companyRegistrationNo = '';
          newSuccess.companyRegistrationNo = true;
        }
        break;

      case 'companyAddress':
        if (!value) {
          newErrors.companyAddress = 'Company address is required';
          newSuccess.companyAddress = false;
        } else if (value.length < 10) {
          newErrors.companyAddress = 'Please enter a complete address';
          newSuccess.companyAddress = false;
        } else {
          newErrors.companyAddress = '';
          newSuccess.companyAddress = true;
        }
        break;

      case 'officialEmailDomain':
        if (value && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          newErrors.officialEmailDomain = 'Please enter a valid email domain';
          newSuccess.officialEmailDomain = false;
        } else {
          newErrors.officialEmailDomain = '';
          newSuccess.officialEmailDomain = true;
        }
        break;

      // Admin Details Validations
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

      case 'workEmail':
        if (!value) {
          newErrors.workEmail = 'Work email is required';
          newSuccess.workEmail = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.workEmail = 'Please enter a valid email address';
          newSuccess.workEmail = false;
        } else {
          newErrors.workEmail = '';
          newSuccess.workEmail = true;
        }
        break;

      case 'phoneNumber':
        if (!value) {
          newErrors.phoneNumber = 'Phone number is required';
          newSuccess.phoneNumber = false;
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
          newSuccess.phoneNumber = false;
        } else {
          newErrors.phoneNumber = '';
          newSuccess.phoneNumber = true;
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

      case 'designation':
        if (!value) {
          newErrors.designation = 'Designation is required';
          newSuccess.designation = false;
        } else if (value === 'Other' && !formData.customDesignation) {
          newErrors.designation = 'Please specify your designation';
          newSuccess.designation = false;
        } else if (value !== 'Other' && value.length < 2) {
          newErrors.designation = 'Designation must be at least 2 characters';
          newSuccess.designation = false;
        } else {
          newErrors.designation = '';
          newSuccess.designation = true;
        }
        break;

      case 'customDesignation':
        if (formData.designation === 'Other' && !value) {
          newErrors.designation = 'Please specify your designation';
          newSuccess.designation = false;
        } else if (formData.designation === 'Other' && value.length < 2) {
          newErrors.designation = 'Designation must be at least 2 characters';
          newSuccess.designation = false;
        } else {
          newErrors.designation = '';
          newSuccess.designation = true;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setSuccess(newSuccess);
    debugLog(`Validation result for ${name}`, { error: newErrors[name], success: newSuccess[name] });
  };
  const handleChange = (e) => {
  const { name, value, type, files, checked } = e.target;
  
  debugLog(`Field changed: ${name}`, { value, type, checked });

  if (type === 'checkbox') {
    // Handle recruitment focus checkboxes
    if (name === 'recruitmentFocus') {
      setFormData(prev => ({
        ...prev,
        recruitmentFocus: checked 
          ? [...prev.recruitmentFocus, value]
          : prev.recruitmentFocus.filter(item => item !== value)
      }));
    }
    // Handle terms and conditions checkbox
    else if (name === 'agreeToTerms') {
      const newValue = checked;
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
      
      // Show captcha when terms are checked
      if (newValue) {
        debugLog('Terms and conditions checked, showing captcha');
        setShowCaptcha(true);
      } else {
        setShowCaptcha(false);
        setRecaptchaVerified(false);
      }
    }
  } else if (type === 'file') {
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
    validateField(name, files[0]);
  } else {
    // Handle phone number formatting specifically
    let processedValue = value;
    if (name === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    validateField(name, processedValue);
    animateBlob(name);
  }
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const togglePasswordVisibility = () => {
    debugLog('Toggling password visibility', { currentState: showPassword });
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    debugLog('Toggling confirm password visibility', { currentState: showConfirmPassword });
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = (step) => {
    debugLog(`Validating step ${step}`);

    const stepFields = {
      1: ['companyName', 'companyDomain', 'companySize', 'industryType', 'companyLogo', 'companyRegistrationNo', 'companyAddress'],
      2: ['fullName', 'workEmail', 'phoneNumber', 'password', 'confirmPassword', 'designation']
    };

    const fieldsToValidate = stepFields[step] || [];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field] || !formData[field]) {
        isValid = false;
      }
    });

    // Additional validation for recruitment focus
    if (step === 1 && formData.recruitmentFocus.length === 0) {
      isValid = false;
    }

    // Additional validation for custom designation
    if (step === 2 && formData.designation === 'Other' && !formData.customDesignation) {
      isValid = false;
    }

    debugLog(`Step ${step} validation result`, { isValid, errors });
    return isValid;
  };

  const nextStep = () => {
    debugLog('Moving to next step', { currentStep, nextStep: currentStep + 1 });
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      debugLog('Step validation failed', { currentStep });
    }
  };

  const prevStep = () => {
    debugLog('Moving to previous step', { currentStep, prevStep: currentStep - 1 });
    setCurrentStep(prev => prev - 1);
  };

  const openTermsModal = () => {
    debugLog('Opening terms modal');
    setShowTermsModal(true);
    setTermsViewed(true);
  };

  const closeTermsModal = () => {
    debugLog('Closing terms modal');
    setShowTermsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    debugLog('Form submission started', {
      stepValid: validateStep(2),
      agreeToTerms: formData.agreeToTerms,
      recaptchaVerified,
      showCaptcha
    });

    if (!validateStep(2) || !formData.agreeToTerms || !recaptchaVerified) {
      if (!formData.agreeToTerms) {
        debugLog('Submission failed: Terms not agreed');
        alert('Please agree to the Terms and Conditions');
      }
      if (!recaptchaVerified) {
        debugLog('Submission failed: Captcha not verified');
        alert('Please complete the reCAPTCHA verification');
      }
      return;
    }

    setIsSubmitting(true);
    debugLog('Form submission in progress');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Workspace created:', formData);
      debugLog('Workspace created successfully', formData);
      alert('Workspace created successfully!');
      // Reset form
      setFormData({
        companyName: '',
        companyDomain: '',
        companySize: '',
        industryType: '',
        companyLogo: null,
        companyRegistrationNo: '',
        companyAddress: '',
        officialEmailDomain: '',
        recruitmentFocus: [],
        fullName: '',
        workEmail: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        designation: '',
        customDesignation: '',
        agreeToTerms: false
      });
      setCurrentStep(1);
      setRecaptchaVerified(false);
      setTermsViewed(false);
      setShowCaptcha(false);
    } catch (error) {
      debugLog('Workspace creation failed', { error });
      alert('Workspace creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      debugLog('Form submission completed');
    }
  };

  const handleRecaptchaChange = (value) => {
    debugLog('reCAPTCHA verification', { verified: !!value });
    setRecaptchaVerified(!!value);
  };

  // Format phone number to only allow digits
  const formatPhoneNumber = (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  // Load reCAPTCHA script when captcha should be shown
  useEffect(() => {
    if (showCaptcha) {
      debugLog('Loading reCAPTCHA script');
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [showCaptcha]);

  // Step Indicator Component
  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
          }`}>
            1
          </div>
          <span className="text-sm mt-1">Company</span>
        </div>
        
        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        
        {/* Step 2 */}
        <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
          }`}>
            2
          </div>
          <span className="text-sm mt-1">Admin</span>
        </div>
        
        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        
        {/* Step 3 */}
        <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            currentStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
          }`}>
            3
          </div>
          <span className="text-sm mt-1">Security</span>
        </div>
      </div>
    </div>
  );

  // Terms and Conditions Modal
  const TermsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Terms and Conditions</h2>
            <button
              onClick={closeTermsModal}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
            
            <section>
              <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
              <p>By accessing and using this recruitment platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. Use License</h3>
              <p>Permission is granted to temporarily use this platform for recruitment purposes. This is the grant of a license, not a transfer of title.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Account Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Data Privacy</h3>
              <p>We collect and process personal data in accordance with our Privacy Policy. By using our services, you consent to such processing.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">5. Candidate Data</h3>
              <p>You agree to handle candidate data responsibly and in compliance with applicable data protection laws.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">6. Prohibited Uses</h3>
              <p>You may not use our platform for any illegal or unauthorized purpose nor may you violate any laws in your jurisdiction.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">7. Termination</h3>
              <p>We may terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">8. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. We will provide notice of significant changes.</p>
            </section>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> These are sample terms and conditions. Please consult with legal counsel to create appropriate terms for your specific use case.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={closeTermsModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Bulb Logo */}
      <div className="flex justify-center mb-4">
        <div className="relative group">
          <img 
            src="/RMLogo.webp" 
            alt="Bulb Logo" 
            className="w-20 h-20 transition-all duration-1000 group-hover:scale-110 group-hover:brightness-125 filter drop-shadow-lg group-hover:drop-shadow-[0_0_30px_rgba(255,255,0,0.7)]"
          />
          <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-1000 group-hover:animate-pulse"></div>
        </div>
      </div>
      
      <h1 className="text-2xl font-semibold text-center mb-2 text-blue-600 uppercase">
        Create Workspace
      </h1>
      <p className="text-center text-gray-600 mb-8">Setup your recruitment workspace in minutes</p>

      {/* Step Indicator */}
      <StepIndicator />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Company Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2">
              🔹 Company Details
            </h2>

            {/* Company Name */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  onFocus={() => animateBlob('companyName')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.companyName 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.companyName 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Company Name *"
                />
                <div
                  ref={blobRefs.companyName}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Company Domain */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  name="companyDomain"
                  value={formData.companyDomain}
                  onChange={handleChange}
                  onFocus={() => animateBlob('companyDomain')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.companyDomain 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.companyDomain 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Company Domain (e.g., rareminds.in) *"
                />
                <div
                  ref={blobRefs.companyDomain}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.companyDomain && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.companyDomain}
                </p>
              )}
            </div>

            {/* Company Size & Industry Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="relative">
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    onFocus={() => animateBlob('companySize')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.companySize 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.companySize 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                  >
                    <option value="">Company Size *</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                  <div
                    ref={blobRefs.companySize}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.companySize && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.companySize}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="relative">
                  <select
                    name="industryType"
                    value={formData.industryType}
                    onChange={handleChange}
                    onFocus={() => animateBlob('industryType')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.industryType 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.industryType 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                  >
                    <option value="">Industry Type *</option>
                    {industryTypes.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  <div
                    ref={blobRefs.industryType}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.industryType && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.industryType}
                  </p>
                )}
              </div>
            </div>

            {/* Company Logo - Now Mandatory */}
            <div className="relative">
              <div className="relative">
                <input
                  type="file"
                  name="companyLogo"
                  onChange={handleChange}
                  accept="image/*"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.companyLogo 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-blue-200 focus:border-blue-100'
                  }`}
                />
                <div className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"></div>
              </div>
              {errors.companyLogo && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.companyLogo}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">* Upload your company logo (Required)</p>
            </div>

            {/* Company Registration No / GSTIN */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  name="companyRegistrationNo"
                  value={formData.companyRegistrationNo}
                  onChange={handleChange}
                  onFocus={() => animateBlob('companyRegistrationNo')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.companyRegistrationNo 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.companyRegistrationNo 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Company Registration No / GSTIN *"
                />
                <div
                  ref={blobRefs.companyRegistrationNo}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.companyRegistrationNo && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.companyRegistrationNo}
                </p>
              )}
            </div>

            {/* Company Address - Now Mandatory */}
            <div className="relative">
              <div className="relative">
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  onFocus={() => animateBlob('companyAddress')}
                  rows="3"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.companyAddress 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.companyAddress 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Company Address *"
                />
                <div
                  ref={blobRefs.companyAddress}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.companyAddress && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.companyAddress}
                </p>
              )}
            </div>

            {/* Recruitment Focus Area */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recruitment Focus Areas *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {recruitmentFocusOptions.map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="recruitmentFocus"
                      value={option}
                      checked={formData.recruitmentFocus.includes(option)}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              {formData.recruitmentFocus.length === 0 && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  Please select at least one recruitment focus area
                </p>
              )}
            </div>

            {/* Official Email Domain */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  name="officialEmailDomain"
                  value={formData.officialEmailDomain}
                  onChange={handleChange}
                  onFocus={() => animateBlob('officialEmailDomain')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.officialEmailDomain 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.officialEmailDomain 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Official Email Domain (Optional - e.g., company.com)"
                />
                <div
                  ref={blobRefs.officialEmailDomain}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.officialEmailDomain && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.officialEmailDomain}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">Optional: Restrict recruiter signups to this domain</p>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={nextStep}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
            >
              Continue to Admin Details
            </button>
          </div>
        )}

        {/* Step 2: Admin Account Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2">
              🔹 Admin Account Details
            </h2>

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

            {/* Designation Dropdown with Other Option */}
            <div className="relative">
              <div className="relative">
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  onFocus={() => animateBlob('designation')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.designation 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.designation 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                >
                  <option value="">Select Designation *</option>
                  {designationOptions.map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
                <div
                  ref={blobRefs.designation}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.designation}
                </p>
              )}
            </div>

            {/* Custom Designation Input (shown only when "Other" is selected) */}
            {formData.designation === 'Other' && (
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    name="customDesignation"
                    value={formData.customDesignation}
                    onChange={handleChange}
                    onFocus={() => animateBlob('customDesignation')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.designation 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.designation 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                    placeholder="Please specify your designation *"
                  />
                  <div
                    ref={blobRefs.customDesignation}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.designation && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.designation}
                  </p>
                )}
              </div>
            )}

            {/* Work Email */}
            <div className="relative">
              <div className="relative">
                <input
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  onFocus={() => animateBlob('workEmail')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.workEmail 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.workEmail 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Work Email *"
                />
                <div
                  ref={blobRefs.workEmail}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.workEmail && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.workEmail}
                </p>
              )}
            </div>

            {/* Phone Number with 10-digit validation */}
           
              <div className="relative">
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange} // Use the main handleChange function
                    onFocus={() => animateBlob('phoneNumber')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.phoneNumber 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.phoneNumber 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                    placeholder="Phone Number (10 digits) *"
                    maxLength="10"
                  />
                  <div
                    ref={blobRefs.phoneNumber}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-2 gap-4">
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
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
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
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
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
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
              >
                Continue to Security
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security & Verification */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2">
              🔹 Security & Verification
            </h2>

            {/* reCAPTCHA - Only shown when terms are checked */}
            {showCaptcha && (
              <div className="flex justify-center">
                <div
                  className="g-recaptcha"
                  data-sitekey="6Ldg8vwrAAAAALHVgjWqLKWEYMgPepeVvuOzesji"
                  data-callback={handleRecaptchaChange}
                ></div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={!termsViewed}
                className={`mt-1 w-4 h-4 rounded focus:ring-blue-500 ${
                  !termsViewed 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                    : 'text-blue-600 bg-gray-100 border-gray-300'
                }`}
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={openTermsModal}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Terms and Conditions
                </button>
                {!termsViewed && (
                  <span className="text-red-500 text-sm block mt-1">
                    * Please read the Terms and Conditions first
                  </span>
                )}
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !recaptchaVerified || !formData.agreeToTerms}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Creating Workspace...
                  </div>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Terms and Conditions Modal */}
      {showTermsModal && <TermsModal />}
    </div>
  );
};

export default SignupAdmin;