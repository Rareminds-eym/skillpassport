import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { AuthFetchError } from '@rareminds-eym/auth-client';
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
            if (isRecruitmentInvite) {
                // Recruitment flow: custom API + login
                const response = await fetch('/api/recruitment/invitations/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to accept invitation');
                }

                // Log in the user
                await ssoClient.login({
                    email: validationData.inviteeEmail,
                    password,
                });
            } else {
                // Standard flow: SSO client
                await ssoClient.acceptInvite({
                    token,
                    password: password || undefined,
                });
            }

            // Update auth store
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

            setState('success');

            // Redirect after success
            setTimeout(() => {
                navigate(isRecruitmentInvite ? '/recruitment/overview' : '/');
            }, 1500);
        } catch (err) {
            let errorMessage = 'Failed to accept invitation.';

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err instanceof AuthFetchError) {
                if (err.status === 400) {
                    errorMessage = 'This invitation has expired or already been used.';
                } else if (err.status === 404) {
                    errorMessage = 'Invitation not found.';
                } else if (err.status === 409) {
                    errorMessage = 'You are already a member of this organization.';
                } else {
                    errorMessage = err.message || errorMessage;
                }
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
