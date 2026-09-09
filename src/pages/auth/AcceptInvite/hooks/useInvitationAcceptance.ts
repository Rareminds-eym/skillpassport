import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { AuthClientError } from '@rareminds-eym/auth-client';
import type { ValidationData } from './useInvitationValidation';

type AcceptanceState = 'idle' | 'accepting' | 'success' | 'error';

interface UseInvitationAcceptanceReturn {
    state: AcceptanceState;
    error: string;
    acceptInvitation: (
        token: string,
        password: string,
        validationData: ValidationData,
        isRecruitmentInvite: boolean
    ) => Promise<void>;
    autoAcceptInvitation: (token: string, data: ValidationData) => Promise<void>;
    requestResend: (token: string) => Promise<void>;
    handleSignOut: () => Promise<void>;
}

/**
 * Hook to handle invitation acceptance logic
 * Manages the acceptance flow for both manual and auto-accept scenarios
 */
export function useInvitationAcceptance(): UseInvitationAcceptanceReturn {
    const [state, setState] = useState<AcceptanceState>('idle');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const acceptInvitation = async (
        token: string,
        password: string,
        validationData: ValidationData,
        isRecruitmentInvite: boolean
    ) => {
        setState('accepting');
        setError('');

        try {
            console.log('[AcceptInvite] 🚀 Starting invitation acceptance flow');
            console.log('[AcceptInvite] Parameters:', {
                isRecruitmentInvite,
                email: validationData.inviteeEmail,
                hasToken: !!token,
                hasPassword: !!password
            });

            if (isRecruitmentInvite) {
                console.log('[AcceptInvite] Step 1: Calling recruitment API...');

                // Recruitment flow: custom API + login
                const response = await fetch('/api/recruitment/invitations/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('[AcceptInvite] ❌ API call failed:', errorData);
                    throw new Error(errorData.error || 'Failed to accept invitation');
                }

                console.log('[AcceptInvite] ✅ Step 1 complete: Invitation API returned 200');
                console.log('[AcceptInvite] Step 2: Logging in user...');

                // Log in the user (use auth store's login to properly persist session)
                await useAuthStore.getState().login(validationData.inviteeEmail, password);

                console.log('[AcceptInvite] ✅ Step 2 complete: Login successful');
                console.log('[AcceptInvite] Auth state after login:', {
                    isAuthenticated: useAuthStore.getState().isAuthenticated,
                    userId: useAuthStore.getState().user?.id,
                    email: useAuthStore.getState().user?.email,
                    role: useAuthStore.getState().user?.role,
                    roles: useAuthStore.getState().user?.roles,
                    orgId: useAuthStore.getState().user?.orgId,
                });

                // CRITICAL: Wait for subscription and org context to load after login
                // Without this delay, SubscriptionProtectedRoute checks subscription before
                // the org membership is properly loaded, causing redirect to subscription plans
                console.log('[AcceptInvite] Step 3: Waiting 1000ms for contexts to load...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('[AcceptInvite] ✅ Step 3 complete: Wait finished');
            } else {
                // Standard flow: SSO client
                await ssoClient.acceptInvite({
                    token,
                    password: password || undefined,
                });

                // Update auth store for non-recruitment invites
                const me = await ssoClient.getMe();
                useAuthStore.setState({
                    user: {
                        id: me.sub,
                        email: me.email,
                        role: me.roles[0] ?? undefined,
                        orgId: me.org_id,
                        roles: me.roles,
                        products: me.products,
                        membershipStatus: me.membership_status,
                        isEmailVerified: me.is_email_verified,
                        isDemoMode: false,
                    },
                    isAuthenticated: true,
                    role: me.roles[0] ?? null,
                });
            }

            console.log('[AcceptInvite] Step 4: Setting state to success');
            setState('success');

            // Prefetch subscription before redirecting to ensure SubscriptionProtectedRoute has data
            // This prevents redirect loop to subscription plans
            console.log('[AcceptInvite] Step 5: Pre-fetching subscription...');
            try {
                // Trigger subscription fetch and wait for it
                const subResponse = await fetch('/api/payments/get-active-subscription');
                console.log('[AcceptInvite] Subscription API response status:', subResponse.status);

                if (subResponse.ok) {
                    const subData = await subResponse.json();
                    console.log('[AcceptInvite] ✅ Step 5 complete: Subscription data:', {
                        hasSubscription: !!subData?.data,
                        status: subData?.data?.status || 'none',
                        plan: subData?.data?.subscription_plan_code || 'none',
                        accessReason: subData?.accessReason,
                        fullData: subData
                    });

                    // Extra delay to ensure React Query cache is updated
                    console.log('[AcceptInvite] Step 6: Waiting 500ms for cache update...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    console.log('[AcceptInvite] ✅ Step 6 complete: Cache update wait finished');
                } else {
                    console.warn('[AcceptInvite] ⚠️ Subscription fetch returned non-OK:', subResponse.status);
                }
            } catch (prefetchErr) {
                console.warn('[AcceptInvite] ⚠️ Subscription prefetch failed (non-critical):', prefetchErr);
            }

            // Redirect after success with longer delay to ensure cache is ready
            console.log('[AcceptInvite] Step 7: Scheduling redirect in 2000ms...');
            setTimeout(() => {
                const targetPath = isRecruitmentInvite ? '/recruitment/overview' : '/';
                console.log('[AcceptInvite] 🎯 REDIRECTING NOW to:', targetPath);
                console.log('[AcceptInvite] Final auth state before redirect:', {
                    isAuthenticated: useAuthStore.getState().isAuthenticated,
                    userId: useAuthStore.getState().user?.id,
                    orgId: useAuthStore.getState().user?.orgId,
                    role: useAuthStore.getState().user?.role,
                    roles: useAuthStore.getState().user?.roles,
                });
                navigate(targetPath);
            }, 2000); // Increased from 1500ms to 2000ms
        } catch (err) {
            let errorMessage = 'Failed to accept invitation.';

            if (err instanceof AuthClientError) {
                if (err.httpStatus === 400) {
                    errorMessage = 'This invitation has expired or already been used.';
                } else if (err.httpStatus === 404) {
                    errorMessage = 'Invitation not found.';
                } else if (err.httpStatus === 409) {
                    errorMessage = 'You are already a member of this organization.';
                } else {
                    errorMessage = err.message || errorMessage;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setState('error');
            throw new Error(errorMessage);
        }
    };

    const autoAcceptInvitation = async (token: string, data: ValidationData) => {
        setState('accepting');
        setError('');

        try {
            const response = await fetch('/api/recruitment/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, auto_accept: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            setState('success');

            // Prefetch subscription before redirecting
            try {
                const subResponse = await fetch('/api/payments/get-active-subscription');
                if (subResponse.ok) {
                    const subData = await subResponse.json();
                    console.log('[AcceptInvite] Subscription prefetched:', subData?.data?.status || 'none');
                }
            } catch (prefetchErr) {
                console.warn('[AcceptInvite] Subscription prefetch failed (non-critical):', prefetchErr);
            }

            // Redirect after short delay
            setTimeout(() => {
                navigate('/recruitment/overview');
            }, 1500);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
            setError(errorMessage);
            setState('error');
            throw new Error(errorMessage);
        }
    };

    const requestResend = async (token: string) => {
        try {
            const response = await fetch(`/api/invites/request-resend?token=${token}`, {
                method: 'POST',
            });

            if (response.ok) {
                setError('A request for a new invitation has been sent to the organization admin.');
            } else {
                setError('Failed to request a new invitation. Please contact the organization admin directly.');
            }
        } catch (err) {
            setError('Failed to request a new invitation. Please contact the organization admin directly.');
        }
    };

    const handleSignOut = async () => {
        try {
            await ssoClient.logout();
            // Reload page to show form
            window.location.reload();
        } catch (err) {
            console.error('[useInvitationAcceptance] Sign out error:', err);
            throw err;
        }
    };

    return {
        state,
        error,
        acceptInvitation,
        autoAcceptInvitation,
        requestResend,
        handleSignOut,
    };
}
