import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SignInSchool = () => {
  const [formData, setFormData] = useState({
    passportId: '',
    studentId: '',
    emailOrPhone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const blobRefs = {
    passportId: useRef(null),
    studentId: useRef(null),
    emailOrPhone: useRef(null),
    password: useRef(null)
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };

    switch (name) {
      case 'passportId':
        if (!value) {
          newErrors.passportId = 'Passport ID is required';
          newSuccess.passportId = false;
        } else if (!/^[A-Z0-9]{6,12}$/.test(value)) {
          newErrors.passportId = 'Passport ID must be 6-12 alphanumeric characters';
          newSuccess.passportId = false;
        } else {
          newErrors.passportId = '';
          newSuccess.passportId = true;
        }
        break;

      case 'studentId':
        if (!value) {
          newErrors.studentId = 'Student ID is required';
          newSuccess.studentId = false;
        } else if (!/^\d{4,5}$/.test(value)) {
          newErrors.studentId = 'Student ID must be a 4-5 digit numeric code';
          newSuccess.studentId = false;
        } else {
          newErrors.studentId = '';
          newSuccess.studentId = true;
        }
        break;

      case 'emailOrPhone':
        if (!value) {
          newErrors.emailOrPhone = 'Email or phone number is required';
          newSuccess.emailOrPhone = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/^\+?[\d\s-]{10,}$/.test(value)) {
          newErrors.emailOrPhone = 'Please enter a valid email or phone number';
          newSuccess.emailOrPhone = false;
        } else {
          newErrors.emailOrPhone = '';
          newSuccess.emailOrPhone = true;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
          newSuccess.password = false;
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
          newSuccess.password = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = 'Password must contain uppercase, lowercase letters and numbers';
          newSuccess.password = false;
        } else {
          newErrors.password = '';
          newSuccess.password = true;
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
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    validateField(name, value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field]);
    });

    // Check form validity after validation
    setTimeout(() => {
      const hasErrors = Object.values(errors).some(error => error !== '');
      const allFieldsFilled = Object.values(formData).every(field => field.trim() !== '');

      if (!allFieldsFilled || hasErrors || !recaptchaVerified) {
        if (!recaptchaVerified) {
          alert('Please complete the reCAPTCHA verification');
        }
        return;
      }
      
      setIsSubmitting(true);
      submitForm();
    }, 100);
  };

  const submitForm = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Sign up successful!');
      // Reset form
      setFormData({
        passportId: '',
        studentId: '',
        emailOrPhone: '',
        password: ''
      });
      setRecaptchaVerified(false);
      setErrors({});
      setSuccess({});
    } catch (error) {
      alert('Sign up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaChange = (value) => {
    setRecaptchaVerified(!!value);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaVerified(false);
  };

  // Load reCAPTCHA script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Set up reCAPTCHA callbacks
  useEffect(() => {
    window.handleRecaptchaChange = (value) => {
      setRecaptchaVerified(!!value);
    };

    window.handleRecaptchaExpired = () => {
      setRecaptchaVerified(false);
    };
  }, []);

  const isButtonDisabled = () => {
    const allFieldsFilled = Object.values(formData).every(field => field.trim() !== '');
    const hasErrors = Object.values(errors).some(error => error !== '');
    return isSubmitting || !recaptchaVerified || !allFieldsFilled || hasErrors;
  };

  return (
    <div className="max-w-md mx-auto p-12">
      {/* Bulb Logo with Enhanced Glow Effect */}
      <div className="flex justify-center mb-4">
        <div className="relative group">
          <img 
            src="/RMLogo.webp" 
            alt="Bulb Logo" 
            className="w-20 h-20 transition-all duration-1000 group-hover:scale-110 group-hover:brightness-125 filter drop-shadow-lg group-hover:drop-shadow-[0_0_30px_rgba(255,255,0,0.7)]"
          />
          {/* Multiple glow layers for bulb effect */}
          <div className="absolute inset-0 bg-red-500 rounded-full opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-1000 group-hover:animate-pulse"></div>
          <div className="absolute inset-0 bg-red-300 rounded-full opacity-0 group-hover:opacity-30 blur-2xl backdrop-blur-2xl transition-all duration-700 delay-200"></div>
          {/* <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500 delay-100"></div> */}
        </div>
      </div>
      
      <h1 className="text-2xl font-semibold text-center mb-6 text-blue-600 uppercase">Student Sign In</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passport ID Field */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              name="passportId"
              value={formData.passportId}
              onChange={handleChange}
              onFocus={() => animateBlob('passportId')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.passportId 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.passportId 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Passport ID"
            />
            <div
              ref={blobRefs.passportId}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.passportId && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.passportId}
            </p>
          )}
          {success.passportId && (
            <p className="text-green-500 text-sm mt-1 flex items-center">
              <span className="mr-1">✓</span>
              Passport ID looks good!
            </p>
          )}
        </div>

        {/* Student ID Field */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              onFocus={() => animateBlob('studentId')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.studentId 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.studentId 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Student ID"
              maxLength="5"
            />
            <div
              ref={blobRefs.studentId}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.studentId && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.studentId}
            </p>
          )}
          {success.studentId && (
            <p className="text-green-500 text-sm mt-1 flex items-center">
              <span className="mr-1">✓</span>
              Student ID looks good!
            </p>
          )}
        </div>

        {/* Email/Phone Field */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
              onFocus={() => animateBlob('emailOrPhone')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                errors.emailOrPhone 
                  ? 'border-red-500 focus:border-red-500' 
                  : success.emailOrPhone 
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-blue-200 focus:border-blue-100'
              }`}
              placeholder="Email or Phone Number"
            />
            <div
              ref={blobRefs.emailOrPhone}
              className="absolute -inset-2 bg-blue-100 rounded-2xl opacity-50 -z-10 blur-sm"
            ></div>
          </div>
          {errors.emailOrPhone && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.emailOrPhone}
            </p>
          )}
          {success.emailOrPhone && (
            <p className="text-green-500 text-sm mt-1 flex items-center">
              <span className="mr-1">✓</span>
              Email/Phone looks good!
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="relative">
          <div className="relative">
            <input
              type="password"
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
              placeholder="Password"
            />
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
          {success.password && (
            <p className="text-green-500 text-sm mt-1 flex items-center">
              <span className="mr-1">✓</span>
              Strong password!
            </p>
          )}
        </div>

        {/* reCAPTCHA */}
        <div className="flex justify-center">
          <div
            className="g-recaptcha"
            data-sitekey="6Ldg8vwrAAAAALHVgjWqLKWEYMgPepeVvuOzesji"
            data-callback="handleRecaptchaChange"
            data-expired-callback="handleRecaptchaExpired"
          ></div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isButtonDisabled()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Forgot Password */}
        <div className="text-center">
          <Link 
            to="/forgot-password" 
            className="text-blue-600 hover:text-blue-700 transition-colors duration-300"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignInSchool;