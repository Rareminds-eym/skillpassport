/**
 * Invitation Login Page
 * 
 * This page is for users who received an organization invitation.
 * Users must have an existing account to accept the invitation.
 * 
 * Flow:
 * 1. User receives invitation email with link
 * 2. User clicks link and lands on this page
 * 3. User logs in with their existing credentials
 * 4. Invitation is automatically accepted and role is assigned
 * 5. User is redirected to complete their profile
 * 
 * If user doesn't have an account, they should:
 * 1. Click "Create Account" button
 * 2. Sign up through regular signup flow
 * 3. Return to invitation link and login
 */

import { AlertCircle, Building2, Check, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { getLogger } from '@/shared/config/logging';
import { PASSWORD_MIN } from '@/shared/constants';
import { memberInvitationService, OrganizationInvitation } from '@/entities/organization';

const logger = getLogger('invitation-signup');

interface SignupState {
    email: string;
    password: string;
    showPassword: boolean;
    loading: boolean;
    error: string;
}

export default function InvitationSignup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token');
    const invitationEmail = searchParams.get('email') || sessionStorage.getItem('invitation_email') || '';
    const invitationToken = token || sessionStorage.getItem('invitation_token') || '';

    const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
    const [organizationName, setOrganizationName] = useState<string>('');
    const [loadingInvitation, setLoadingInvitation] = useState(true);

    const [state, setState] = useState<SignupState>({
        email: invitationEmail,
        password: '',
        showPassword: false,
        loading: false,
        error: '',
    });

    // Load invitation details
    useEffect(() => {
        loadInvitationDetails();
    }, [invitationToken]);

    // Clear persisted auth state when loading invitation
    // This prevents old user email from localStorage interfering with invitation email
    useEffect(() => {
        if (invitationToken && invitationEmail) {
            console.log('[InvitationSignup] Invitation detected, clearing persisted auth state');
            console.log('[InvitationSignup] Invitation email:', invitationEmail);

            // Clear the Zustand persisted state
            localStorage.removeItem('skillpassport-auth-v1');
        }
    }, [invitationToken, invitationEmail]);

    const loadInvitationDetails = async () => {
        if (!invitationToken) {
            toast.error('No invitation token provided');
            navigate('/signup');
            return;
        }

        try {
            const inv = await memberInvitationService.getInvitationByToken(invitationToken);

            if (!inv) {
                toast.error('Invalid invitation link');
                navigate('/signup');
                return;
            }

            if (inv.status === 'accepted') {
                toast.error('This invitation has already been accepted');
                navigate('/login');
                return;
            }

            if (inv.status === 'cancelled' || inv.status === 'expired' || new Date(inv.expiresAt) < new Date()) {
                toast.error('This invitation has expired');
                navigate('/signup');
                return;
            }

            setInvitation(inv);
            setState(prev => ({ ...prev, email: inv.email }));

            // Get organization name
            const { supabase } = await import('@/shared/api');
            const { data } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', inv.organizationId)
                .single();

            setOrganizationName(data?.name || 'Organization');
        } catch (error) {
            logger.error('Failed to load invitation', error as Error);
            toast.error('Failed to load invitation details');
            navigate('/signup');
        } finally {
            setLoadingInvitation(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setState(prev => ({ ...prev, [name]: processedValue, error: '' }));
    };

    const validateForm = (): boolean => {
        if (!state.password || state.password.length < PASSWORD_MIN) {
            setState(prev => ({ ...prev, error: `Password must be at least ${PASSWORD_MIN} characters` }));
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm() || !invitation) return;

        setState(prev => ({ ...prev, loading: true, error: '' }));

        try {
            // Step 1: Try to login with provided credentials
            const loginResult = await ssoClient.login({
                email: state.email,
                password: state.password,
            });

            const ssoUserId = loginResult.user.id;

            // Step 2: Update auth store
            const me = await ssoClient.getMe();
            useAuthStore.setState({
                user: {
                    id: me.sub,
                    email: me.email,
                    role: 'recruiter',
                    orgId: me.org_id,
                    roles: me.roles,
                    products: me.products,
                    membershipStatus: me.membership_status,
                    isEmailVerified: me.is_email_verified,
                    isDemoMode: false,
                },
                isAuthenticated: true,
                role: 'recruiter',
            });

            // Step 3: Auto-accept the invitation (this adds the recruiter role)
            const invitationResponse = await fetch('/api/recruitment/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: invitationToken,
                    userId: ssoUserId,
                }),
            });

            if (!invitationResponse.ok) {
                const errorData = await invitationResponse.json();
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            const invitationResult = await invitationResponse.json();

            // Clear invitation data from session storage
            sessionStorage.removeItem('invitation_token');
            sessionStorage.removeItem('invitation_email');
            sessionStorage.removeItem('invitation_return_url');

            toast.success(`Welcome to ${organizationName}!`);

            // Step 4: Redirect to profile completion page
            setTimeout(() => {
                navigate('/complete-profile');
            }, 1000);

        } catch (error: unknown) {
            let errorMessage = 'An error occurred during login';
            if (error instanceof AuthFetchError) {
                if (error.status === 401) {
                    errorMessage = 'Invalid email or password. If you don\'t have an account yet, please create one first.';
                } else if (error.status === 429) {
                    errorMessage = 'Too many attempts. Please try again later.';
                } else {
                    errorMessage = error.message || errorMessage;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            logger.error('Invitation login failed', error as Error);
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        }
    };

    if (loadingInvitation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Invitation</h2>
                    <p className="text-gray-500">Please wait...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Login to Accept Invitation</h1>
                    <p className="text-blue-100">Enter your credentials to join {organizationName}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {invitation && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            You're invited as a {invitation.memberType.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-blue-700 mt-0.5">
                                            Login with your existing account to accept
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900">
                                            Don't have an account yet?
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            You need to create an account first before accepting this invitation.
                                        </p>
                                        <button
                                            onClick={() => {
                                                console.log('=== NAVIGATING TO SIGNUP FROM INVITATION ===');
                                                console.log('[InvitationSignup] Storing invitation data before redirect');
                                                console.log('[InvitationSignup] Token:', invitationToken ? `${invitationToken.substring(0, 8)}...` : 'missing');
                                                console.log('[InvitationSignup] Email:', state.email);

                                                // Store invitation data for after signup
                                                sessionStorage.setItem('invitation_token', invitationToken);
                                                sessionStorage.setItem('invitation_email', state.email);
                                                sessionStorage.setItem('invitation_return_url', `/invitation/accept?token=${invitationToken}`);

                                                // Verify storage
                                                const storedToken = sessionStorage.getItem('invitation_token');
                                                const storedEmail = sessionStorage.getItem('invitation_email');
                                                const storedReturnUrl = sessionStorage.getItem('invitation_return_url');
                                                console.log('[InvitationSignup] ✓ Stored token:', storedToken ? `${storedToken.substring(0, 8)}...` : 'FAILED');
                                                console.log('[InvitationSignup] ✓ Stored email:', storedEmail);
                                                console.log('[InvitationSignup] ✓ Stored return URL:', storedReturnUrl);
                                                console.log('[InvitationSignup] Navigating to /signup');

                                                navigate('/signup');
                                            }}
                                            className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                                        >
                                            Create Account First →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {state.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{state.error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={state.email}
                                readOnly
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">This email is from your invitation</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={state.showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={state.password}
                                    onChange={handleInputChange}
                                    disabled={state.loading}
                                    placeholder="••••••••••"
                                    className="block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setState(p => ({ ...p, showPassword: !p.showPassword }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={state.loading}
                                className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {state.loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Login & Accept Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{' '}
                            <button
                                onClick={() => {
                                    console.log('=== NAVIGATING TO SIGNUP FROM INVITATION (BOTTOM LINK) ===');
                                    console.log('[InvitationSignup] Storing invitation data before redirect');
                                    console.log('[InvitationSignup] Token:', invitationToken ? `${invitationToken.substring(0, 8)}...` : 'missing');
                                    console.log('[InvitationSignup] Email:', state.email);

                                    // Store invitation data for after signup
                                    sessionStorage.setItem('invitation_token', invitationToken);
                                    sessionStorage.setItem('invitation_email', state.email);
                                    sessionStorage.setItem('invitation_return_url', `/invitation/accept?token=${invitationToken}`);

                                    // Verify storage
                                    const storedToken = sessionStorage.getItem('invitation_token');
                                    const storedEmail = sessionStorage.getItem('invitation_email');
                                    const storedReturnUrl = sessionStorage.getItem('invitation_return_url');
                                    console.log('[InvitationSignup] ✓ Stored token:', storedToken ? `${storedToken.substring(0, 8)}...` : 'FAILED');
                                    console.log('[InvitationSignup] ✓ Stored email:', storedEmail);
                                    console.log('[InvitationSignup] ✓ Stored return URL:', storedReturnUrl);
                                    console.log('[InvitationSignup] Navigating to /signup');

                                    navigate('/signup');
                                }}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Create Account First
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
