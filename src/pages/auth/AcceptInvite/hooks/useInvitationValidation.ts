import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/model/authStore';

export interface ValidationData {
    valid: boolean;
    inviteeEmail: string;
    organizationId: string;
    organizationName: string;
    organizationType?: string;
    role: string;
    expiresAt: string;
}

export type ValidationState = 'validating' | 'validated' | 'conflict' | 'auto-accepting' | 'error';

interface UseInvitationValidationReturn {
    state: ValidationState;
    validationData: ValidationData | null;
    error: string;
    requiresSignOut: boolean;
    isRecruitmentInvite: boolean;
}

/**
 * Hook to validate invitation token and check for session conflicts
 * Handles the initial validation logic separated from the main component
 */
export function useInvitationValidation(
    token: string | null,
    onAutoAccept: (data: ValidationData) => Promise<void>
): UseInvitationValidationReturn {
    const [state, setState] = useState<ValidationState>(token ? 'validating' : 'error');
    const [validationData, setValidationData] = useState<ValidationData | null>(null);
    const [error, setError] = useState(token ? '' : 'No invitation token provided.');
    const [requiresSignOut, setRequiresSignOut] = useState(false);

    useEffect(() => {
        if (!token) {
            setState('error');
            setError('No invitation token provided.');
            return;
        }

        const validateToken = async () => {
            try {
                // Step 1: Check current session
                const currentUser = useAuthStore.getState().user;
                console.log('[useInvitationValidation] Current user:', currentUser?.email || 'none');

                // Step 2: Validate token
                const response = await fetch('/api/recruitment/invitations/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setState('error');
                    setError(errorData.error || 'Invalid invitation token');
                    return;
                }

                const data: ValidationData = await response.json();
                setValidationData(data);

                // Step 3: Check for session conflicts
                if (currentUser && data.inviteeEmail) {
                    const currentEmail = currentUser.email?.toLowerCase();
                    const inviteEmail = data.inviteeEmail.toLowerCase();

                    if (currentEmail === inviteEmail) {
                        // Auto-accept for matching email
                        console.log('[useInvitationValidation] Matching email, triggering auto-accept');
                        setState('auto-accepting');
                        await onAutoAccept(data);
                        return;
                    } else {
                        // Email mismatch - requires sign out
                        console.log('[useInvitationValidation] Email mismatch detected');
                        setState('conflict');
                        setRequiresSignOut(true);
                        setError(
                            `You're signed in as ${currentEmail}. This invitation was sent to ${inviteEmail}.`
                        );
                        return;
                    }
                }

                // Step 4: No conflicts, ready for form
                setState('validated');
            } catch (err) {
                console.error('[useInvitationValidation] Validation error:', err);
                setState('error');
                setError('Failed to validate invitation token');
            }
        };

        validateToken();
    }, [token, onAutoAccept]);

    const isRecruitmentInvite = validationData?.organizationType === 'company';

    return {
        state,
        validationData,
        error,
        requiresSignOut,
        isRecruitmentInvite,
    };
}
