import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../../../lib/supabaseClient';
import { AlertCircle, CheckCircle2, Building2, MapPin, Phone, User, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

// Input Field Component - Defined OUTSIDE to prevent re-creation
const InputField = ({ label, name, type = 'text', required = false, placeholder, icon: Icon, value, onChange, error, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-red-500 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

// Select Field Component - Defined OUTSIDE to prevent re-creation
const SelectField = ({ label, name, options, required = false, icon: Icon, value, onChange, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
    {error && (
      <p className="text-red-500 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const SignupAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Get plan data from navigation state (if coming from subscription page)
  const { plan, studentType, returnToPayment } = location.state || {};
  
  const [formData, setFormData] = useState({
    // Company Details (Step 1)
    name: '',
    code: '',
    industry: '',
    companySize: '',
    
    // HQ Address (Step 2)
    hqAddress: '',
    hqCity: '',
    hqState: '',
    hqCountry: 'India',
    hqPincode: '',
    
    // Contact Info (Step 3)
    phone: '',
    email: '',
    website: '',
    establishedYear: '',
    
    // Contact Person (Step 4)
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    
    // Admin Account (Step 5)
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  
  const industries = [
    'IT & Software', 'Education', 'Manufacturing', 'Healthcare', 'Finance & Banking',
    'Retail & E-commerce', 'Construction', 'Hospitality', 'Transportation & Logistics',
    'Consulting', 'Media & Entertainment', 'Telecommunications', 'Real Estate',
    'Agriculture', 'Energy & Utilities', 'Other'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh'
  ];

  const designations = [
    'HR Manager', 'Recruitment Manager', 'Talent Acquisition Head',
    'HR Director', 'Chief People Officer', 'Recruitment Lead',
    'HR Business Partner', 'Other'
  ];

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value) error = 'Company name is required';
        else if (value.length < 2) error = 'Company name must be at least 2 characters';
        break;
      case 'code':
        if (!value) error = 'Company code is required';
        else if (value.length < 2) error = 'Company code must be at least 2 characters';
        break;
      case 'email':
      case 'adminEmail':
      case 'contactPersonEmail':
        if (!value) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'phone':
      case 'adminPhone':
      case 'contactPersonPhone':
        if (!value) error = 'Phone number is required';
        else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) error = 'Phone must be 10 digits';
        break;
      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) error = 'Invalid website URL';
        break;
      case 'hqPincode':
        if (value && !/^\d{6}$/.test(value)) error = 'Pincode must be 6 digits';
        break;
      case 'establishedYear':
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (value && (year < 1800 || year > currentYear)) error = `Year must be between 1800 and ${currentYear}`;
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) 
          error = 'Password must contain uppercase, lowercase, and number';
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm password';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Format phone numbers
    let processedValue = newValue;
    if (['phone', 'adminPhone', 'contactPersonPhone'].includes(name) && type !== 'checkbox') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        ['name', 'code', 'industry', 'companySize'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        });
        break;
      case 2:
        ['hqAddress', 'hqCity', 'hqState', 'hqCountry'].forEach(field => {
          if (!formData[field]) newErrors[field] = 'This field is required';
        });
        if (formData.hqPincode) {
          const error = validateField('hqPincode', formData.hqPincode);
          if (error) newErrors.hqPincode = error;
        }
        break;
      case 3:
        ['phone', 'email'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        });
        if (formData.website) {
          const error = validateField('website', formData.website);
          if (error) newErrors.website = error;
        }
        if (formData.establishedYear) {
          const error = validateField('establishedYear', formData.establishedYear);
          if (error) newErrors.establishedYear = error;
        }
        break;
      case 4:
        ['contactPersonName', 'contactPersonDesignation', 'contactPersonEmail', 'contactPersonPhone'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error || !formData[field]) newErrors[field] = error || 'This field is required';
        });
        break;
      case 5:
        ['adminFullName', 'adminEmail', 'adminPhone', 'password', 'confirmPassword'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        });
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to terms';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep(5)) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminFullName,
            role: 'recruitment_admin'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // 2. Create user record in public.users table
      // Split full name into firstName and lastName
      const nameParts = formData.adminFullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.adminEmail,
          firstName: firstName,
          lastName: lastName,
          role: 'rm_admin',
          metadata: {
            phone: formData.adminPhone,
            isAdmin: true,
            fullName: formData.adminFullName
          }
        });

      if (userError) throw userError;

      // 3. Create company record
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          code: formData.code,
          industry: formData.industry,
          companySize: formData.companySize,
          hqAddress: formData.hqAddress,
          hqCity: formData.hqCity,
          hqState: formData.hqState,
          hqCountry: formData.hqCountry,
          hqPincode: formData.hqPincode || null,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null,
          contactPersonName: formData.contactPersonName,
          contactPersonDesignation: formData.contactPersonDesignation,
          contactPersonEmail: formData.contactPersonEmail,
          contactPersonPhone: formData.contactPersonPhone,
          accountStatus: 'pending',
          approvalStatus: 'pending',
          created_by: authData.user.id,
          metadata: {
            adminName: formData.adminFullName,
            adminEmail: formData.adminEmail,
            adminPhone: formData.adminPhone,
            registrationDate: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Success!
      if (returnToPayment && plan) {
        // If coming from subscription page, redirect to payment
        alert(`Workspace created successfully! Your Workspace ID is: ${companyData.code}\n\nProceeding to payment...`);
        navigate('/subscription/payment', { 
          state: { 
            plan, 
            studentType: studentType || 'recruitment-admin',
            isUpgrade: false 
          } 
        });
      } else {
        // Otherwise, show success message and go to login
        alert(`Workspace created successfully! Your Workspace ID is: ${companyData.code}\n\nYour account is pending approval. We'll notify you once it's activated.`);
        navigate('/login/recruiter');
      }
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Indicator Component
  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((step, idx) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              currentStep >= step 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              {step}
            </div>
            {idx < 4 && (
              <div className={`w-8 h-1 mx-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/RMLogo.webp" alt="Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recruitment Workspace</h1>
          <p className="text-gray-600">Setup your company workspace in a few simple steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>
                </div>
                
                <InputField
                  label="Company Name"
                  name="name"
                  required
                  placeholder="Enter your company name"
                  icon={Building2}
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                
                <InputField
                  label="Company Code"
                  name="code"
                  required
                  placeholder="Unique code (e.g., ACME2024)"
                  maxLength={50}
                  value={formData.code}
                  onChange={handleChange}
                  error={errors.code}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Industry"
                    name="industry"
                    options={industries}
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    error={errors.industry}
                  />
                  
                  <SelectField
                    label="Company Size"
                    name="companySize"
                    options={companySizes}
                    required
                    value={formData.companySize}
                    onChange={handleChange}
                    error={errors.companySize}
                  />
                </div>
              </div>
            )}

            {/* Step 2: HQ Address */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Headquarters Address</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="hqAddress"
                    value={formData.hqAddress}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows={3}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.hqAddress ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.hqAddress && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hqAddress}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="City"
                    name="hqCity"
                    required
                    placeholder="City"
                    value={formData.hqCity}
                    onChange={handleChange}
                    error={errors.hqCity}
                  />
                  
                  <SelectField
                    label="State"
                    name="hqState"
                    options={indianStates}
                    required
                    value={formData.hqState}
                    onChange={handleChange}
                    error={errors.hqState}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Country"
                    name="hqCountry"
                    required
                    disabled
                    value={formData.hqCountry}
                    onChange={handleChange}
                    error={errors.hqCountry}
                  />
                  
                  <InputField
                    label="Pincode"
                    name="hqPincode"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={formData.hqPincode}
                    onChange={handleChange}
                    error={errors.hqPincode}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                </div>
                
                <InputField
                  label="Company Phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="10-digit phone number"
                  icon={Phone}
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                
                <InputField
                  label="Company Email"
                  name="email"
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                
                <InputField
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://www.company.com"
                  value={formData.website}
                  onChange={handleChange}
                  error={errors.website}
                />
                
                <InputField
                  label="Established Year"
                  name="establishedYear"
                  type="number"
                  placeholder="e.g., 2010"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.establishedYear}
                  onChange={handleChange}
                  error={errors.establishedYear}
                />
              </div>
            )}

            {/* Step 4: Contact Person */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Primary Contact Person</h2>
                </div>
                
                <InputField
                  label="Full Name"
                  name="contactPersonName"
                  required
                  placeholder="Contact person name"
                  icon={User}
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  error={errors.contactPersonName}
                />
                
                <SelectField
                  label="Designation"
                  name="contactPersonDesignation"
                  options={designations}
                  required
                  value={formData.contactPersonDesignation}
                  onChange={handleChange}
                  error={errors.contactPersonDesignation}
                />
                
                <InputField
                  label="Email"
                  name="contactPersonEmail"
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                  error={errors.contactPersonEmail}
                />
                
                <InputField
                  label="Phone"
                  name="contactPersonPhone"
                  type="tel"
                  required
                  placeholder="10-digit phone number"
                  icon={Phone}
                  maxLength={10}
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  error={errors.contactPersonPhone}
                />
              </div>
            )}

            {/* Step 5: Admin Account & Security */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Admin Account</h2>
                </div>
                
                <InputField
                  label="Your Full Name"
                  name="adminFullName"
                  required
                  placeholder="Your name"
                  icon={User}
                  value={formData.adminFullName}
                  onChange={handleChange}
                  error={errors.adminFullName}
                />
                
                <InputField
                  label="Your Email"
                  name="adminEmail"
                  type="email"
                  required
                  placeholder="your.email@company.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  error={errors.adminEmail}
                />
                
                <InputField
                  label="Your Phone"
                  name="adminPhone"
                  type="tel"
                  required
                  placeholder="10-digit phone number"
                  icon={Phone}
                  maxLength={10}
                  value={formData.adminPhone}
                  onChange={handleChange}
                  error={errors.adminPhone}
                />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 8 characters"
                      className={`w-full px-4 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.password ? 'border-red-500' : 'border-gray-200'
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
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={`w-full px-4 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
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
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    I agree to the Terms and Conditions and Privacy Policy
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Create Workspace
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login/recruiter" className="text-blue-600 hover:text-blue-700 font-medium">
            Login here
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupAdmin;
