/**
 * Common validation functions for signup forms
 */

/**
 * Validate all common signup fields
 * @param {Object} formData - Form data object
 * @param {Object} options - Validation options
 * @returns {Object} - Errors object
 */
export function validateSignupFields(formData, options = {}) {
  const {
    requirePhone = true,
    requireOtp = false,
    requireLocation = true,
    emailExists = false,
  } = options;

  const errors = {};

  // First Name validation
  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  // Last Name validation
  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  // Date of Birth validation
  if (!formData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (dob > today) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    } else if (age < 5) {
      errors.dateOfBirth = 'You must be at least 5 years old';
    } else if (age > 120) {
      errors.dateOfBirth = 'Please enter a valid date of birth';
    }
  }

  // Email validation
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  } else if (emailExists) {
    errors.email = 'This email is already registered. Please sign in instead.';
  }

  // Phone validation
  if (requirePhone) {
    if (!formData.phone?.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
  } else if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid 10-digit mobile number';
  }

  // OTP validation (if required)
  if (requireOtp && !formData.otpVerified) {
    errors.otp = 'Please verify your mobile number with OTP';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and number';
  }

  // Confirm Password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Location validation
  if (requireLocation) {
    if (!formData.country) {
      errors.country = 'Country is required';
    }
    if (!formData.state) {
      errors.state = 'State / Province is required';
    }
    if (!formData.city) {
      errors.city = 'City / District is required';
    }
  }

  // Terms agreement validation
  if (!formData.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the Terms and Privacy Policy';
  }

  return errors;
}

/**
 * Get initial form data with default values
 * @returns {Object} - Initial form data
 */
export function getInitialFormData() {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'IN',
    state: '',
    city: '',
    preferredLanguage: 'en',
    referralCode: '',
    agreeToTerms: false,
    otp: '',
    otpVerified: false,
  };
}

/**
 * Format phone number (remove non-digits and limit to 10)
 * @param {string} value - Input value
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(value) {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Format OTP (remove non-digits and limit to 6)
 * @param {string} value - Input value
 * @returns {string} - Formatted OTP
 */
export function formatOtp(value) {
  return value.replace(/\D/g, '').slice(0, 6);
}

/**
 * Capitalize the first letter of a name
 * @param {string} name - Name to capitalize
 * @returns {string} - Name with first letter capitalized
 */
export function capitalizeFirstLetter(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word in a name (for multi-word names)
 * @param {string} name - Name to capitalize
 * @returns {string} - Name with each word's first letter capitalized
 */
export function capitalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
