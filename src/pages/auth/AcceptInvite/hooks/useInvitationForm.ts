import { useState, useEffect, FormEvent } from 'react';
import { PASSWORD_MIN } from '@/shared/constants';

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}

interface UseInvitationFormReturn {
    // Form state
    password: string;
    setPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
    termsAccepted: boolean;
    setTermsAccepted: (value: boolean) => void;
    showPassword: boolean;
    toggleShowPassword: () => void;
    showConfirmPassword: boolean;
    toggleShowConfirmPassword: () => void;

    // Password strength
    passwordStrength: PasswordStrength;

    // Form validation
    validate: (isRecruitmentInvite: boolean) => string | null;

    // Form submission
    handleSubmit: (
        e: FormEvent<HTMLFormElement>,
        onSubmit: (password: string) => Promise<void>
    ) => Promise<void>;

    // Loading state
    loading: boolean;
    error: string;
    clearError: () => void;
}

/**
 * Hook to manage invitation acceptance form state and validation
 * Handles password, confirmation, terms, and validation logic
 */
export function useInvitationForm(): UseInvitationFormReturn {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        label: '',
        color: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Calculate password strength
    useEffect(() => {
        if (!password) {
            setPasswordStrength({ score: 0, label: '', color: '' });
            return;
        }

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

        setPasswordStrength({ score, label: labels[score], color: colors[score] });
    }, [password]);

    const validate = (isRecruitmentInvite: boolean): string | null => {
        // Recruitment invites require password
        if (isRecruitmentInvite) {
            if (!password || password.length < PASSWORD_MIN) {
                return `Password must be at least ${PASSWORD_MIN} characters`;
            }
            if (password !== confirmPassword) {
                return 'Passwords do not match';
            }
            if (!termsAccepted) {
                return 'You must accept the terms and conditions';
            }
        } else {
            // Other org types: password is optional, but must be valid if provided
            if (password && password.length < PASSWORD_MIN) {
                return `Password must be at least ${PASSWORD_MIN} characters`;
            }
        }

        return null;
    };

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>,
        onSubmit: (password: string) => Promise<void>
    ) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept invitation');
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
    const clearError = () => setError('');

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        termsAccepted,
        setTermsAccepted,
        showPassword,
        toggleShowPassword,
        showConfirmPassword,
        toggleShowConfirmPassword,
        passwordStrength,
        validate,
        handleSubmit,
        loading,
        error,
        clearError,
    };
}
