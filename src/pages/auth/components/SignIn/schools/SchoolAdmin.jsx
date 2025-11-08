import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { State, City } from 'country-state-city';

const SchoolAdmin = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // School Details
    schoolName: '',
    schoolType: '',
    schoolCode: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    state: '',
    city: '',
    pincode: '',
    logo: null,
    websiteUrl: '',
    areasOfInterest: [],
    otherAreaOfInterest: '',
    
    // Admin Account Details
    fullName: '',
    designation: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    
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
  const [cities, setCities] = useState([]);

  const blobRefs = {
    // School Details
    schoolName: useRef(null),
    schoolType: useRef(null),
    schoolCode: useRef(null),
    schoolEmail: useRef(null),
    schoolPhone: useRef(null),
    schoolAddress: useRef(null),
    state: useRef(null),
    city: useRef(null),
    pincode: useRef(null),
    websiteUrl: useRef(null),
    
    // Admin Details
    fullName: useRef(null),
    designation: useRef(null),
    email: useRef(null),
    phoneNumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null)
  };

  const schoolTypes = [
    'Central School',
    'State School',
    'Deemed to be School',
    'Private School',
    'Institute of National Importance',
    'Open School',
    'Autonomous School/College',
  ];

  const areaOfInterestOptions = [
    'Science',
    'Pedagogy',
    'Engineering',
    'Medicine',
    'Arts',
    'Commerce',
    'Law',
    'Management',
    'Technology',
    'Research',
    'Vocational Studies',
    'Distance Education',
    'Other'
  ];

  const designationOptions = [
    'Principal',
    'Dean',
    'Academic Head',
    'Director',
    'Registrar',
    'Administrator',
    'Head of Department',
    'Other'
  ];

  // Generate school code based on name and type
  const generateSchoolCode = () => {
    const namePart = formData.schoolName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase();
    
    const typePart = formData.schoolType
      .substring(0, 3)
      .toUpperCase();
    
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${namePart}${typePart}${randomPart}`;
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };

    switch (name) {
      // School Details Validations
      case 'schoolName':
        if (!value) {
          newErrors.schoolName = 'School name is required';
          newSuccess.schoolName = false;
        } else if (value.length < 2) {
          newErrors.schoolName = 'School name must be at least 2 characters';
          newSuccess.schoolName = false;
        } else {
          newErrors.schoolName = '';
          newSuccess.schoolName = true;
        }
        break;

      case 'schoolType':
        if (!value) {
          newErrors.schoolType = 'School type is required';
          newSuccess.schoolType = false;
        } else {
          newErrors.schoolType = '';
          newSuccess.schoolType = true;
        }
        break;

      case 'schoolEmail':
        if (!value) {
          newErrors.schoolEmail = 'School email is required';
          newSuccess.schoolEmail = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.schoolEmail = 'Please enter a valid schoolal email address';
          newSuccess.schoolEmail = false;
        } else {
          newErrors.schoolEmail = '';
          newSuccess.schoolEmail = true;
        }
        break;

      case 'schoolPhone':
        if (!value) {
          newErrors.schoolPhone = 'School phone number is required';
          newSuccess.schoolPhone = false;
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.schoolPhone = 'Please enter a valid 10-digit phone number';
          newSuccess.schoolPhone = false;
        } else {
          newErrors.schoolPhone = '';
          newSuccess.schoolPhone = true;
        }
        break;

      case 'schoolAddress':
        if (!value) {
          newErrors.schoolAddress = 'School address is required';
          newSuccess.schoolAddress = false;
        } else if (value.length < 10) {
          newErrors.schoolAddress = 'Please enter a complete address (minimum 10 characters)';
          newSuccess.schoolAddress = false;
        } else {
          newErrors.schoolAddress = '';
          newSuccess.schoolAddress = true;
        }
        break;

      case 'websiteUrl':
        if (!value) {
          newErrors.websiteUrl = 'Website URL is required';
          newSuccess.websiteUrl = false;
        } else if (!/^https?:\/\/.+\..+/.test(value)) {
          newErrors.websiteUrl = 'Please enter a valid website URL';
          newSuccess.websiteUrl = false;
        } else {
          newErrors.websiteUrl = '';
          newSuccess.websiteUrl = true;
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

      case 'designation':
        if (!value) {
          newErrors.designation = 'Designation is required';
          newSuccess.designation = false;
        } else if (value.length < 2) {
          newErrors.designation = 'Designation must be at least 2 characters';
          newSuccess.designation = false;
        } else {
          newErrors.designation = '';
          newSuccess.designation = true;
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

      default:
        break;
    }

    setErrors(newErrors);
    setSuccess(newSuccess);
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle areas of interest checkboxes
      if (name === 'areasOfInterest') {
        setFormData(prev => ({
          ...prev,
          areasOfInterest: checked 
            ? [...prev.areasOfInterest, value]
            : prev.areasOfInterest.filter(item => item !== value)
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
      if (name === 'phoneNumber' || name === 'schoolPhone') {
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = (step) => {
    const stepFields = {
      1: ['schoolName', 'schoolType', 'schoolEmail', 'schoolPhone', 'schoolAddress', 'websiteUrl'],
      2: ['fullName', 'designation', 'email', 'phoneNumber', 'password', 'confirmPassword']
    };

    const fieldsToValidate = stepFields[step] || [];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field] || !formData[field]) {
        isValid = false;
      }
    });

    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const openTermsModal = () => {
    setShowTermsModal(true);
    setTermsViewed(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Auto-generate school code before submission if not provided
    const finalFormData = {
      ...formData,
      schoolCode: formData.schoolCode || generateSchoolCode()
    };

    if (!validateStep(2) || !formData.agreeToTerms || !recaptchaVerified) {
      if (!formData.agreeToTerms) {
        alert('Please agree to the Terms and Conditions');
      }
      if (!recaptchaVerified) {
        alert('Please complete the reCAPTCHA verification');
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('School admin account created:', finalFormData);
      alert('School admin account created successfully!');
      // Reset form
      setFormData({
        schoolName: '',
        schoolType: '',
        schoolCode: '',
        schoolEmail: '',
        schoolPhone: '',
        schoolAddress: '',
        state: '',
        city: '',
        pincode: '',
        logo: null,
        websiteUrl: '',
        areasOfInterest: [],
        otherAreaOfInterest: '',
        fullName: '',
        designation: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        agreeToTerms: false
      });
      setCurrentStep(1);
      setRecaptchaVerified(false);
      setTermsViewed(false);
      setShowCaptcha(false);
    } catch (error) {
      alert('Account creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaChange = (value) => {
    setRecaptchaVerified(!!value);
  };

  // Format phone number to only allow digits
  const formatPhoneNumber = (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  // Load reCAPTCHA script when captcha should be shown
  useEffect(() => {
    if (showCaptcha) {
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

  // Set up reCAPTCHA callbacks
  useEffect(() => {
    window.handleRecaptchaChange = (value) => {
      setRecaptchaVerified(!!value);
    };

    window.handleRecaptchaExpired = () => {
      setRecaptchaVerified(false);
    };
  }, []);

  // Handle state change to load cities
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: selectedState,
      city: '',
      pincode: ''
    }));

    // Find ISO code for the selected state and load cities
    const stateObj = State.getStatesOfCountry("IN").find(
      (s) => s.name === selectedState
    );

    if (stateObj) {
      const cityList = City.getCitiesOfState("IN", stateObj.isoCode);
      setCities(cityList);
    }

    validateField('state', selectedState);
    animateBlob('state');
  };

  // Handle city change to fetch pincode
  const handleCityChange = async (e) => {
    const cityName = e.target.value;
    setFormData(prev => ({
      ...prev,
      city: cityName,
      pincode: ''
    }));

    // Auto-fetch pincode
    if (cityName) {
      try {
        const res = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
        const data = await res.json();
        if (data[0]?.Status === "Success") {
          const pin = data[0].PostOffice?.[0]?.Pincode;
          setFormData(prev => ({
            ...prev,
            pincode: pin || ""
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode:", error);
      }
    }

    validateField('city', cityName);
    animateBlob('city');
  };

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
          <span className="text-sm mt-1">School</span>
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
              <p>By accessing and using this educational school platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. School Responsibilities</h3>
              <p>As an school administrator, you are responsible for maintaining the accuracy of schoolal information and ensuring proper use of the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Account Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your admin account and password and for restricting access to authorized personnel only.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Data Privacy</h3>
              <p>We collect and process schoolal and student data in accordance with our Privacy Policy and educational data protection regulations.</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">5. Schoolal Data</h3>
              <p>You agree to handle student and schoolal data responsibly and in compliance with applicable educational data protection laws.</p>
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
                <strong>Note:</strong> These are sample terms and conditions for educational schools. Please consult with legal counsel to create appropriate terms for your specific use case.
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
        School Admin Signup
      </h1>
      <p className="text-center text-gray-600 mb-8">Setup your school admin account</p>

      {/* Step Indicator */}
      <StepIndicator />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: School Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2">
              🔹 School Details
            </h2>

            {/* School Name */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  onFocus={() => animateBlob('schoolName')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.schoolName 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.schoolName 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="School Name *"
                />
                <div
                  ref={blobRefs.schoolName}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.schoolName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.schoolName}
                </p>
              )}
            </div>

            {/* School Type & Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="relative">
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleChange}
                    onFocus={() => animateBlob('schoolType')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.schoolType 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.schoolType 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                  >
                    <option value="">School Type *</option>
                    {schoolTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div
                    ref={blobRefs.schoolType}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.schoolType && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.schoolType}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    name="schoolCode"
                    value={formData.schoolCode}
                    onChange={handleChange}
                    onFocus={() => animateBlob('schoolCode')}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-100 transition-all duration-300"
                    placeholder="School Code / ID (Optional)"
                  />
                  <div
                    ref={blobRefs.schoolCode}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                <p className="text-gray-500 text-sm mt-1">Leave blank for auto-generation</p>
              </div>
            </div>

            {/* School Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="relative">
                  <input
                    type="email"
                    name="schoolEmail"
                    value={formData.schoolEmail}
                    onChange={handleChange}
                    onFocus={() => animateBlob('schoolEmail')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.schoolEmail 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.schoolEmail 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                    placeholder="School Email *"
                  />
                  <div
                    ref={blobRefs.schoolEmail}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.schoolEmail && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.schoolEmail}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    type="tel"
                    name="schoolPhone"
                    value={formData.schoolPhone}
                    onChange={handleChange}
                    onFocus={() => animateBlob('schoolPhone')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.schoolPhone 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.schoolPhone 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                    placeholder="School Phone *"
                    maxLength="10"
                  />
                  <div
                    ref={blobRefs.schoolPhone}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.schoolPhone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.schoolPhone}
                  </p>
                )}
              </div>
            </div>

            {/* School Address */}
            <div className="relative">
              <div className="relative">
                <textarea
                  name="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  onFocus={() => animateBlob('schoolAddress')}
                  rows="3"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.schoolAddress 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.schoolAddress 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="School Address *"
                />
                <div
                  ref={blobRefs.schoolAddress}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.schoolAddress && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.schoolAddress}
                </p>
              )}
            </div>

            {/* State, City, and Pincode */}
            <div className="grid grid-cols-3 gap-4">
              {/* State */}
              <div className="relative">
                <div className="relative">
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    onFocus={() => animateBlob('state')}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.state 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.state 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    }`}
                  >
                    <option value="">State *</option>
                    {State.getStatesOfCountry("IN").map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div
                    ref={blobRefs.state}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.state}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="relative">
                <div className="relative">
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleCityChange}
                    onFocus={() => animateBlob('city')}
                    disabled={!formData.state}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.city 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.city 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    } ${!formData.state ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">City *</option>
                    {cities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div
                    ref={blobRefs.city}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Pincode */}
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    onFocus={() => animateBlob('pincode')}
                    readOnly
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      errors.pincode 
                        ? 'border-red-500 focus:border-red-500' 
                        : success.pincode 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-blue-200 focus:border-blue-100'
                    } bg-gray-50`}
                    placeholder="Pincode"
                  />
                  <div
                    ref={blobRefs.pincode}
                    className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                  ></div>
                </div>
                {errors.pincode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="relative">
              <div className="relative">
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  accept="image/*"
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-100 transition-all duration-300"
                />
                <div className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"></div>
              </div>
              <p className="text-gray-500 text-sm mt-1">Upload school logo (Optional)</p>
            </div>

            {/* Website URL */}
            <div className="relative">
              <div className="relative">
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  onFocus={() => animateBlob('websiteUrl')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                    errors.websiteUrl 
                      ? 'border-red-500 focus:border-red-500' 
                      : success.websiteUrl 
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-blue-200 focus:border-blue-100'
                  }`}
                  placeholder="Website URL *"
                />
                <div
                  ref={blobRefs.websiteUrl}
                  className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
                ></div>
              </div>
              {errors.websiteUrl && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.websiteUrl}
                </p>
              )}
            </div>

            {/* Areas of Interest */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Interest
              </label>
              <div className="grid grid-cols-3 gap-2">
                {areaOfInterestOptions.map(area => (
                  <label key={area} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="areasOfInterest"
                      value={area}
                      checked={formData.areasOfInterest.includes(area)}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
              
              {/* Other Area of Interest Textbox */}
              {formData.areasOfInterest.includes('Other') && (
                <div className="mt-3">
                  <input
                    type="text"
                    name="otherAreaOfInterest"
                    value={formData.otherAreaOfInterest}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please specify other area of interest"
                  />
                </div>
              )}
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

            {/* Designation */}
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

            {/* Email */}
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
                  placeholder="Admin Email *"
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

            {/* Phone Number */}
            <div className="relative">
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
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
                  data-callback="handleRecaptchaChange"
                  data-expired-callback="handleRecaptchaExpired"
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
                    Creating Account...
                  </div>
                ) : (
                  'Create Admin Account'
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

export default SchoolAdmin;