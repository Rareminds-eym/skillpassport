/**
 * Recruitment Onboarding - Step 1: Company Details
 * 
 * Collects company information and replaces the placeholder org name created during signup.
 * This is the first and most critical step - the company name is required.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ArrowRight, Globe, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOnboarding } from './OnboardingContext';
import { INDUSTRIES, COMPANY_SIZES } from './types';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';

export default function OnboardingStep1() {
    const navigate = useNavigate();
    const { data, updateCompanyDetails } = useOnboarding();
    const user = useAuthStore(state => state.user);

    const [formData, setFormData] = useState(data.companyDetails);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pre-fill email from user
    useEffect(() => {
        if (user?.email && !formData.email) {
            setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
    }, [user?.email, formData.email]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }
        if (!formData.industry) {
            newErrors.industry = 'Please select an industry';
        }
        if (!formData.companySize) {
            newErrors.companySize = 'Please select company size';
        }
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            // Get org ID from user context
            const orgId = user?.orgId;
            if (!orgId) {
                throw new Error('Organization ID not found');
            }

            console.log('[OnboardingStep1] Updating organization with real company name', {
                orgId,
                companyName: formData.companyName,
            });

            // Step 1: Ensure organization exists in local DB with the company name
            // This handles duplicate names by appending a counter if needed
            try {
                console.log('[OnboardingStep1] Creating/updating local organization');
                await apiPost('/organization/handler', {
                    action: 'createLocalOrganization',
                    p_organization_id: orgId,
                    p_organization_name: formData.companyName,
                    p_recruitment_enabled: true,
                    p_max_recruiters: 10,
                });
                console.log('[OnboardingStep1] Local organization created/verified');
            } catch (error: any) {
                // If organization already exists, that's fine - it will be updated
                console.log('[OnboardingStep1] Note:', error.message);
            }

            // Step 2: Store all company details in public.organizations
            await apiPost('/organization/handler', {
                action: 'updateOrganization',
                id: orgId,
                name: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                website: formData.website || null,
                organization_type: 'recruitment',
                metadata: {
                    industry: formData.industry,
                    company_size: formData.companySize,
                },
            });

            console.log('[OnboardingStep1] Organization updated successfully');

            // Step 3: Create/update recruitment settings with company details
            await apiPost('/organization/handler', {
                action: 'createOrganizationRecruitmentSettings',
                p_organization_id: orgId,
                p_industry: formData.industry,
                p_company_size: formData.companySize,
                p_admin_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin',
                p_phone: formData.phone,
                p_email: formData.email,
                p_address: formData.address,
            });

            console.log('[OnboardingStep1] Recruitment settings created successfully');

            // Save to context
            updateCompanyDetails(formData);

            toast.success('Company details saved!');

            // Navigate to Step 2
            navigate('/recruitment/onboarding/step-2');
        } catch (error: any) {
            console.error('[OnboardingStep1] Error saving company details:', error);
            toast.error(error.message || 'Failed to save company details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Company Details</h2>
                <p className="text-slate-600">
                    Tell us about your company to set up your recruitment workspace
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            placeholder="e.g., Acme Corporation"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.companyName ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                    )}
                </div>

                {/* Industry */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.industry}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.industry ? 'border-red-300 bg-red-50' : 'border-slate-300'
                            }`}
                    >
                        <option value="">Select industry...</option>
                        {INDUSTRIES.map((industry) => (
                            <option key={industry} value={industry}>
                                {industry}
                            </option>
                        ))}
                    </select>
                    {errors.industry && (
                        <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                    )}
                </div>

                {/* Company Size */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Size <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.companySize}
                        onChange={(e) => handleChange('companySize', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.companySize ? 'border-red-300 bg-red-50' : 'border-slate-300'
                            }`}
                    >
                        <option value="">Select company size...</option>
                        {COMPANY_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    {errors.companySize && (
                        <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="123 Business St, City, State, ZIP"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.address ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="contact@company.com"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                {/* Website (Optional) */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Website <span className="text-slate-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="https://www.company.com"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>Continue to Team Settings</span>
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
