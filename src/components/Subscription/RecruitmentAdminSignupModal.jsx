import { AlertCircle, Briefcase, Building2, Calendar, CheckCircle, Eye, EyeOff, Globe, Mail, MapPin, Phone, Shield, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sendOtp, verifyOtp as verifyOtpApi } from '../../services/otpService';

function RecruitmentAdminSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    // Step 1: Company Details
    name: '',
    code: '',
    industry: '',
    companySize: '',
    // Step 2: HQ Address
    hqAddress: '',
    hqCity: '',
    hqState: '',
    hqCountry: 'India',
    hqPincode: '',
    // Step 3: Contact Info
    phone: '',
    email: '',
    website: '',
    establishedYear: '',
    // Step 4: Contact Person
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    // Step 5: Admin Account
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
    adminOtp: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [checkingCode, setCheckingCode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const totalSteps = 5;

  const industries = [
    'IT & Software', 'Education', 'Manufacturing', 'Healthcare', 'Finance & Banking',
    'Retail & E-commerce', 'Construction', 'Hospitality', 'Transportation & Logistics',
    'Consulting', 'Media & Entertainment', 'Telecommunications', 'Real Estate',
    'Agriculture', 'Energy & Utilities', 'Other'
  ];

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

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
    'HR Business Partner', 'CEO', 'Founder', 'Other'
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setFormData({
        name: '', code: '', industry: '', companySize: '',
        hqAddress: '', hqCity: '', hqState: '', hqCountry: 'India', hqPincode: '',
        phone: '', email: '', website: '', establishedYear: '',
        contactPersonName: '', contactPersonDesignation: '', contactPersonEmail: '', contactPersonPhone: '',
        adminFullName: '', adminEmail: '', adminPhone: '', password: '', confirmPassword: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format phone numbers
    if (['phone', 'adminPhone', 'contactPersonPhone'].includes(name)) {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    // Format OTP
    if (name === 'adminOtp') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }
    // Format company code
    if (name === 'code') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    }
    // Format pincode
    if (name === 'hqPincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (error) setError('');
  };

  const handleSendOtp = async () => {
    if (!formData.adminPhone || formData.adminPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setSendingOtp(true);
    try {
      const result = await sendOtp(formData.adminPhone);
      if (result.success) {
        setOtpSent(true);
        setError('');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.adminOtp || formData.adminOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      const result = await verifyOtpApi(formData.adminPhone, formData.adminOtp);
      if (result.success) {
        setOtpVerified(true);
        setError('');
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const checkCompanyCode = async (code) => {
    if (!code || code.length < 2) return true;
    setCheckingCode(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('code')
        .eq('code', code)
        .maybeSingle();
      
      setCheckingCode(false);
      return !data;
    } catch (err) {
      setCheckingCode(false);
      return true;
    }
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.code || !formData.industry || !formData.companySize) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.code.length < 2) {
      setError('Company code must be at least 2 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.hqAddress || !formData.hqCity || !formData.hqState) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.hqPincode && formData.hqPincode.length !== 6) {
      setError('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.phone || !formData.email) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.phone.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.contactPersonName || !formData.contactPersonDesignation || 
        !formData.contactPersonEmail || !formData.contactPersonPhone) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.contactPersonPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (!formData.adminFullName || !formData.adminEmail || !formData.adminPhone || 
        !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.adminPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      if (!validateStep1()) return;
      // Check company code uniqueness
      const isUnique = await checkCompanyCode(formData.code);
      if (!isUnique) {
        setError('This company code is already taken. Please choose another.');
        return;
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      setStep(5);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep5()) return;

    setLoading(true);
    setError('');

    try {
      // Use the worker API for signup with proper rollback support
      const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'https://user-api.dark-mode-d021.workers.dev';
      
      const nameParts = formData.adminFullName.trim().split(' ');
      const firstName = capitalizeFirstLetter(nameParts[0] || '');
      const lastName = capitalizeFirstLetter(nameParts.slice(1).join(' ') || '');
      
      const response = await fetch(`${USER_API_URL}/signup/recruiter-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.password,
          companyName: formData.name,
          companyCode: formData.code,
          industry: formData.industry,
          companySize: formData.companySize,
          phone: formData.phone,
          website: formData.website || undefined,
          hqAddress: formData.hqAddress,
          hqCity: formData.hqCity,
          hqState: formData.hqState,
          hqCountry: formData.hqCountry,
          hqPincode: formData.hqPincode || undefined,
          establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
          contactPersonName: formData.contactPersonName,
          contactPersonDesignation: formData.contactPersonDesignation,
          contactPersonEmail: formData.contactPersonEmail,
          contactPersonPhone: formData.contactPersonPhone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create workspace');
      }

      // Success
      onSignupSuccess({
        id: result.data.userId,
        name: formData.adminFullName,
        email: formData.adminEmail,
        companyId: result.data.companyId,
        companyCode: result.data.companyCode
      });

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Company', 'Address', 'Contact', 'Person', 'Account'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                Create Recruitment Workspace
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Selected Plan */}
            {selectedPlan && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-900">
                  {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                </p>
              </div>
            )}

            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-4 w-full h-0.5 bg-gray-200 -z-10"></div>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex flex-col items-center bg-white px-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Step 1: Company Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">Company Details</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your company name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workspace ID (Company Code) *</label>
                    <input
                      type="text"
                      name="code"
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      placeholder="e.g., ACME2024"
                      value={formData.code}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier for your workspace (recruiters will use this to join)</p>
                    {checkingCode && <p className="text-xs text-blue-600 mt-1">Checking availability...</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                      <select
                        name="industry"
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.industry}
                        onChange={handleChange}
                      >
                        <option value="">Select Industry</option>
                        {industries.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Size *</label>
                      <select
                        name="companySize"
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.companySize}
                        onChange={handleChange}
                      >
                        <option value="">Select Size</option>
                        {companySizes.map(size => (
                          <option key={size} value={size}>{size} employees</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: HQ Address */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Headquarters Address</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        name="hqAddress"
                        required
                        rows="2"
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter complete address"
                        value={formData.hqAddress}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="hqCity"
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                        value={formData.hqCity}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <select
                        name="hqState"
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.hqState}
                        onChange={handleChange}
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="hqCountry"
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        value={formData.hqCountry}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="hqPincode"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="6-digit pincode"
                        value={formData.hqPincode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Phone className="w-5 h-5" />
                    <span className="font-semibold">Company Contact Information</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10-digit phone number"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contact@company.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          name="website"
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://company.com"
                          value={formData.website}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="establishedYear"
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 2010"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={formData.establishedYear}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Contact Person */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <User className="w-5 h-5" />
                    <span className="font-semibold">Primary Contact Person</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="contactPersonName"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contact person name"
                        value={formData.contactPersonName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="contactPersonDesignation"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.contactPersonDesignation}
                        onChange={handleChange}
                      >
                        <option value="">Select Designation</option>
                        {designations.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="contactPersonEmail"
                          required
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="contact@company.com"
                          value={formData.contactPersonEmail}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="contactPersonPhone"
                          required
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="10-digit phone"
                          value={formData.contactPersonPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Admin Account */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Admin Account Details</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="adminFullName"
                        required
                        className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your name"
                        value={formData.adminFullName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="adminEmail"
                          required
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@company.com"
                          value={formData.adminEmail}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="adminPhone"
                            required
                            className={`pl-10 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${otpVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                            placeholder="10-digit phone"
                            value={formData.adminPhone}
                            onChange={handleChange}
                            disabled={otpVerified}
                          />
                          {otpVerified && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                        </div>
                        {!otpVerified && (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp || formData.adminPhone.length !== 10}
                            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                      {otpVerified && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Phone verified
                        </p>
                      )}
                    </div>
                  </div>

                  {/* OTP Input */}
                  {otpSent && !otpVerified && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="adminOtp"
                          value={formData.adminOtp}
                          onChange={handleChange}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || formData.adminOtp.length !== 6}
                          className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">OTP sent to +91 {formData.adminPhone}. Valid for 5 minutes.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Min 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Must contain uppercase, lowercase & number</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          required
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={checkingCode}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {checkingCode ? 'Checking...' : 'Next Step'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !otpVerified}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Workspace...
                      </>
                    ) : (
                      'Create Workspace'
                    )}
                  </button>
                )}
              </div>

              {/* OTP Verification Warning */}
              {!otpVerified && step === 5 && (
                <p className="text-sm text-amber-600 text-center mt-2">
                  Please verify your phone number with OTP to continue
                </p>
              )}
            </form>

            <div className="mt-6 text-center border-t pt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruitmentAdminSignupModal;
