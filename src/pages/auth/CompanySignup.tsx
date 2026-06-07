/**
 * Company Signup Page
 * Matches UnifiedLogin styling with two-column layout
 */

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Building2,
    Mail,
    Phone,
    Loader2,
    AlertCircle,
    Briefcase,
    Users,
} from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

interface CompanySignupState {
    companyName: string;
    industry: string;
    companySize: string;
    address: string;
    workEmail: string;
    phone: string;
    agreeToTerms: boolean;
    loading: boolean;
    error: string;
    // Fields from previous page (not editable)
    firstName: string;
    lastName: string;
    password: string;
    personalEmail: string; // Store personal email separately
}

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Real Estate', 'Media & Entertainment',
    'Transportation', 'Hospitality', 'Other',
];

const COMPANY_SIZES = [
    '1-10 employees', '11-50 employees', '51-200 employees',
    '201-500 employees', '501-1000 employees', '1000+ employees',
];

export const CompanySignup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get data passed from UnifiedSignup
    const signupData = location.state as {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        password?: string;
        country?: string;
        state?: string;
        city?: string;
        preferredLanguage?: string;
        dateOfBirth?: string;
    } | null;

    const [state, setState] = useState<CompanySignupState>({
        companyName: '',
        industry: '',
        companySize: '',
        address: '',
        workEmail: '', // Empty - user must enter work email
        phone: signupData?.phone || '',
        agreeToTerms: false,
        loading: false,
        error: '',
        // Store data from previous page
        firstName: signupData?.firstName || '',
        lastName: signupData?.lastName || '',
        password: signupData?.password || '',
        personalEmail: signupData?.email || '', // Store personal email
    });

    // Redirect to signup if no data was passed
    useEffect(() => {
        if (!signupData || !signupData.email || !signupData.password) {
            navigate('/signup', { replace: true });
        }
    }, [signupData, navigate]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setState((prev) => ({ ...prev, [name]: processedValue, error: '' }));
    };

    const validateForm = (): boolean => {
        if (!state.companyName.trim()) {
            setState((prev) => ({ ...prev, error: 'Please enter your company name' }));
            return false;
        }
        if (!state.industry) {
            setState((prev) => ({ ...prev, error: 'Please select your industry' }));
            return false;
        }
        if (!state.companySize) {
            setState((prev) => ({ ...prev, error: 'Please select your company size' }));
            return false;
        }
        if (!state.address.trim()) {
            setState((prev) => ({ ...prev, error: 'Please enter your company address' }));
            return false;
        }
        if (!state.workEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.workEmail)) {
            setState((prev) => ({ ...prev, error: 'Please enter a valid work email' }));
            return false;
        }
        if (!state.agreeToTerms) {
            setState((prev) => ({ ...prev, error: 'Please agree to the Terms & Privacy Policy' }));
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        setState((prev) => ({ ...prev, loading: true, error: '' }));

        try {
            console.log('[CompanySignup] Starting signup process...');

            // Step 1: Create organization and user in SSO
            const ssoResult = await ssoClient.signup({
                email: state.workEmail,
                password: state.password,
                org_name: state.companyName,
                redirect_url: window.location.origin,
            });

            const userId = ssoResult.user.id;
            const orgId = ssoResult.org?.id;

            console.log('[CompanySignup] SSO signup successful', { userId, orgId });

            if (!orgId) {
                throw new Error('Organization was not created in SSO');
            }

            // Step 2: Get fresh user data with roles from SSO
            const me = await ssoClient.getMe();
            console.log('[CompanySignup] Got user data from SSO', {
                userId: me.sub,
                orgId: me.org_id,
                roles: me.roles,
                membershipStatus: me.membership_status
            });

            // Step 3: Create user profile in Supabase
            // Must run before createLocalOrganization because organization_members
            // has a FK constraint referencing public.users(id)
            console.log('[CompanySignup] Creating user profile...');
            await apiPost('/user/handler', {
                action: 'createUserProfile',
                id: userId,
                email: state.workEmail,
                firstName: state.firstName,
                lastName: state.lastName,
                phone: state.phone || null,
                role: 'recruiter',
            });
            console.log('[CompanySignup] User profile created successfully');

            // Step 4: Create local organization record in SkillPassport database
            // This also inserts the creator as 'owner' in organization_members
            console.log('[CompanySignup] Creating local organization record...', {
                orgId,
                companyName: state.companyName,
                recruitment_enabled: true,
                max_recruiters: 10
            });

            const orgData = await apiPost('/organization/handler', {
                action: 'createLocalOrganization',
                p_organization_id: orgId,
                p_organization_name: state.companyName,
                p_recruitment_enabled: true,
                p_max_recruiters: 10,
            });

            console.log('[CompanySignup] Local organization record created successfully:', orgData);

            // Step 5: Create recruitment settings for the organization
            console.log('[CompanySignup] Creating recruitment settings...');
            const adminName = `${state.firstName} ${state.lastName}`.trim();
            const settingsData = await apiPost('/organization/handler', {
                action: 'createOrganizationRecruitmentSettings',
                p_organization_id: orgId,
                p_industry: state.industry,
                p_company_size: state.companySize,
                p_admin_name: adminName,
                p_phone: state.phone || null,
                p_email: state.workEmail,
                p_address: state.address,
            });

            console.log('[CompanySignup] Recruitment settings created:', settingsData);

            // Step 6: Set auth store with recruiter role
            // Note: The user has 'owner' role in SSO, but we map it to 'recruiter' in the app
            console.log('[CompanySignup] Setting auth store...');
            useAuthStore.setState({
                user: {
                    id: me.sub,
                    email: me.email,
                    role: 'recruiter', // App-level role (mapped from 'owner')
                    orgId: me.org_id,
                    roles: me.roles, // Keep original SSO roles (includes 'owner')
                    products: me.products,
                    membershipStatus: me.membership_status,
                    isEmailVerified: me.is_email_verified,
                    isDemoMode: false,
                },
                isAuthenticated: true,
                role: 'recruiter',
            });

            console.log('[CompanySignup] Signup complete, redirecting to email verification...');

            // Step 7: Redirect to email verification page (same flow as normal signup)
            // After email verification, user will be redirected to /recruitment/subscription/plans
            navigate('/verify-email', {
                replace: true, // Replace history to prevent back button issues
            });
        } catch (error) {
            console.error('[CompanySignup] Signup error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create company account. Please try again.';
            setState((prev) => ({
                ...prev, loading: false,
                error: errorMessage,
            }));
        }
    };

    return (
        <div className="flex items-center lg:py-8 bg-white">
            <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 min-h-screen lg:min-h-[700px] overflow-hidden">
                {/* LEFT SIDE - Illustration */}
                <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f] overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img src="/login/login.jpg" alt="Company signup" className="w-full h-full object-cover opacity-20" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl text-center font-bold leading-tight">
                            Build Your Hiring Team
                        </h2>
                        <p className="mt-4 max-w-xl text-center text-[#edf2f9]">
                            Create your company account and start collaborating with your recruitment team
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Organization Management</h3>
                                <p className="text-sm text-white/80 mt-1">Create your company profile and manage your recruitment team</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Team Collaboration</h3>
                                <p className="text-sm text-white/80 mt-1">Invite recruiters and collaborate on hiring decisions</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Centralized Hiring</h3>
                                <p className="text-sm text-white/80 mt-1">Manage all jobs and candidates in one place</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Signup Form */}
                <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-8 lg:py-8 overflow-y-auto">
                    <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a6aba] to-[#09277f]" aria-hidden />
                    <div className="hidden lg:block absolute inset-0 bg-white" />

                    <div className="relative w-full max-w-md">
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-white lg:text-gray-900">Sign Up Your Company</h3>
                            <p className="text-sm text-white/80 lg:text-gray-600 mt-2">Create an organization account to start hiring</p>
                        </div>

                        <div className="rounded-2xl bg-transparent lg:bg-white/95 lg:shadow-xl lg:ring-1 lg:ring-black/5 p-5 sm:p-6 lg:p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {state.error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{state.error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Company Name <span className="text-red-400 lg:text-red-500">*</span>
                                    </label>
                                    <input type="text" name="companyName" value={state.companyName} onChange={handleInputChange} required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        placeholder="Acme Corporation" />
                                </div>

                                {/* Industry */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Industry <span className="text-red-400 lg:text-red-500">*</span>
                                    </label>
                                    <select name="industry" value={state.industry} onChange={handleInputChange} required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                                        <option value="">Select industry...</option>
                                        {INDUSTRIES.map((industry) => (
                                            <option key={industry} value={industry}>{industry}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Company Size */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Company Size <span className="text-red-400 lg:text-red-500">*</span>
                                    </label>
                                    <select name="companySize" value={state.companySize} onChange={handleInputChange} required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                                        <option value="">Select company size...</option>
                                        {COMPANY_SIZES.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Company Address <span className="text-red-400 lg:text-red-500">*</span>
                                    </label>
                                    <input type="text" name="address" value={state.address} onChange={handleInputChange} required
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        placeholder="123 Business St, City, State, ZIP" />
                                </div>

                                {/* Work Email (editable) */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Work Email <span className="text-red-400 lg:text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="email" name="workEmail" value={state.workEmail} onChange={handleInputChange} required
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            placeholder="john@company.com" />
                                    </div>
                                    <p className="mt-1 text-xs text-white/70 lg:text-gray-500">
                                        Use your company email (different from personal: {state.personalEmail})
                                    </p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-2">
                                        Phone <span className="text-gray-400">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="tel" name="phone" value={state.phone} onChange={handleInputChange}
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            placeholder="+1 (555) 123-4567" />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="flex items-start">
                                    <input type="checkbox" name="agreeToTerms" checked={state.agreeToTerms} onChange={handleInputChange} required
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                    <label className="ml-2 text-sm text-white lg:text-gray-600">
                                        I agree to the{' '}
                                        <Link to="/terms" className="text-white lg:text-blue-600 hover:underline">Terms & Conditions</Link>
                                        {' '}and{' '}
                                        <Link to="/privacy-policy" className="text-white lg:text-blue-600 hover:underline">Privacy Policy</Link>
                                    </label>
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={state.loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                                    {state.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <span>Create Company Account</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-white lg:text-gray-600">
                                    Already have an account?{' '}
                                    <Link to="/login" className="font-medium text-white lg:text-blue-600 hover:underline">Sign in</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanySignup;
