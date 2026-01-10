import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle,
    Globe,
    GraduationCap,
    Landmark,
    Loader2,
    Mail,
    MapPin,
    Phone,
    School
} from 'lucide-react';
import React, { useState } from 'react';
// @ts-ignore - AuthContext is a JS file
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface OrganizationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

type OrganizationType = 'school' | 'college' | 'university';

interface OrganizationSetupProps {
  organizationType: OrganizationType;
  onComplete: () => void;
}

const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ organizationType, onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    phone: '',
    email: user?.email || '',
    website: '',
  });
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof OrganizationFormData, string>>>({});

  const getOrganizationLabel = (): string => {
    switch (organizationType) {
      case 'school': return 'School';
      case 'college': return 'College';
      case 'university': return 'University';
    }
  };

  const getIcon = () => {
    switch (organizationType) {
      case 'school': return <School className="h-12 w-12 text-blue-600" />;
      case 'college': return <GraduationCap className="h-12 w-12 text-purple-600" />;
      case 'university': return <Landmark className="h-12 w-12 text-indigo-600" />;
    }
  };

  const getColorScheme = () => {
    switch (organizationType) {
      case 'school': return { 
        primary: 'blue', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        button: 'bg-blue-600 hover:bg-blue-700',
        gradient: 'from-blue-600 to-blue-700'
      };
      case 'college': return { 
        primary: 'purple', 
        bg: 'bg-purple-50', 
        border: 'border-purple-200', 
        button: 'bg-purple-600 hover:bg-purple-700',
        gradient: 'from-purple-600 to-purple-700'
      };
      case 'university': return { 
        primary: 'indigo', 
        bg: 'bg-indigo-50', 
        border: 'border-indigo-200', 
        button: 'bg-indigo-600 hover:bg-indigo-700',
        gradient: 'from-indigo-600 to-indigo-700'
      };
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof OrganizationFormData, string>> = {};

    // Required fields
    if (!formData.name.trim()) {
      errors.name = `${getOrganizationLabel()} name is required`;
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Name must be less than 200 characters';
    }

    // City is required
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    // State is required
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && !/^[+]?[\d\s()-]{7,20}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Website validation
    if (formData.website && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(formData.website)) {
      errors.website = 'Please enter a valid website URL';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof OrganizationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setError('User session not found. Please log in again.');
      setStep('error');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      // Check if organization with same name and type already exists
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .ilike('name', formData.name.trim())
        .eq('organization_type', organizationType)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing organizations: ${checkError.message}`);
      }

      if (existingOrg) {
        setValidationErrors({ name: `A ${getOrganizationLabel().toLowerCase()} with this name already exists` });
        setStep('form');
        return;
      }

      // Create the organization in the unified organizations table
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          organization_type: organizationType,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          country: formData.country.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          admin_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create ${getOrganizationLabel().toLowerCase()}: ${createError.message}`);
      }

      console.log(`[OrganizationSetup] ${getOrganizationLabel()} created successfully:`, newOrg.id);
      setStep('success');

      // Wait a moment to show success, then call onComplete
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err) {
      console.error('[OrganizationSetup] Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('error');
    }
  };

  const colors = getColorScheme();

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className={`h-16 w-16 animate-spin text-${colors.primary}-600 mx-auto mb-4`} />
          <h2 className="text-xl font-semibold text-gray-900">Creating your {getOrganizationLabel().toLowerCase()}...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set everything up</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">{getOrganizationLabel()} Created Successfully!</h2>
          <p className="text-gray-500 mt-2">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setStep('form')}
              className={`px-6 py-2 ${colors.button} text-white rounded-lg transition-colors`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${colors.bg} mb-4`}>
            {getIcon()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your {getOrganizationLabel()}</h1>
          <p className="mt-2 text-gray-600 max-w-lg mx-auto">
            Welcome! Before you can access your dashboard, please provide some basic information about your {getOrganizationLabel().toLowerCase()}.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name - Required */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {getOrganizationLabel()} Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-${colors.primary}-500 focus:border-transparent transition-colors ${
                    validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={`Enter your ${getOrganizationLabel().toLowerCase()} name`}
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Street address"
                />
              </div>
            </div>

            {/* City, State, Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {validationErrors.city && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="State"
                />
                {validationErrors.state && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="contact@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.website ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://www.example.com"
                />
              </div>
              {validationErrors.website && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.website}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 ${colors.button} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                <span>Create {getOrganizationLabel()}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              You can update these details later from your settings page.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSetup;
