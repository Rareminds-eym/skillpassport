import { FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { PASSWORD_MIN } from '@/shared/constants';
import type { ValidationData } from '../hooks/useInvitationValidation';

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}

interface RecruitmentInvitationFormProps {
    validationData: ValidationData;
    password: string;
    onPasswordChange: (value: string) => void;
    confirmPassword: string;
    onConfirmPasswordChange: (value: string) => void;
    termsAccepted: boolean;
    onTermsChange: (value: boolean) => void;
    showPassword: boolean;
    onToggleShowPassword: () => void;
    showConfirmPassword: boolean;
    onToggleShowConfirmPassword: () => void;
    passwordStrength: PasswordStrength;
    loading: boolean;
    error: string;
    onClearError: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/**
 * Form component for recruitment invitations
 * Includes password, confirmation, terms acceptance, and strength indicator
 */
export function RecruitmentInvitationForm({
    validationData,
    password,
    onPasswordChange,
    confirmPassword,
    onConfirmPasswordChange,
    termsAccepted,
    onTermsChange,
    showPassword,
    onToggleShowPassword,
    showConfirmPassword,
    onToggleShowConfirmPassword,
    passwordStrength,
    loading,
    error,
    onClearError,
    onSubmit,
}: RecruitmentInvitationFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Context banner */}
            <div className="p-4 bg-[#278FD3] bg-opacity-10 border border-[#278FD3] border-opacity-30 rounded-lg">
                <p className="text-sm text-gray-800 text-center">
                    <strong>
                        You've been invited to join {validationData.organizationName} as{' '}
                        {validationData.role === 'company_admin' ? 'Recruiter Admin' : validationData.role}
                    </strong>
                </p>
                <p className="text-xs text-gray-600 text-center mt-2">
                    Invitation sent to: <strong>{validationData.inviteeEmail}</strong>
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Password field */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                            onPasswordChange(e.target.value);
                            onClearError();
                        }}
                        disabled={loading}
                        required
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#278FD3] focus:border-[#278FD3] disabled:bg-gray-50 transition-colors"
                        placeholder={`At least ${PASSWORD_MIN} characters`}
                    />
                    <button
                        type="button"
                        onClick={onToggleShowPassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${passwordStrength.color}`}
                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-600 min-w-[80px]">
                                {passwordStrength.label}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm password field */}
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                            onConfirmPasswordChange(e.target.value);
                            onClearError();
                        }}
                        disabled={loading}
                        required
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#278FD3] focus:border-[#278FD3] disabled:bg-gray-50 transition-colors"
                        placeholder="Re-enter your password"
                    />
                    <button
                        type="button"
                        onClick={onToggleShowConfirmPassword}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start gap-2">
                <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                        onTermsChange(e.target.checked);
                        onClearError();
                    }}
                    disabled={loading}
                    required
                    className="mt-1 h-4 w-4 text-[#278FD3] focus:ring-[#278FD3] border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                    I accept the{' '}
                    <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#278FD3] hover:underline"
                    >
                        Terms and Conditions
                    </a>
                </label>
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-[#278FD3] hover:bg-[#1f7ab8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                    </>
                ) : (
                    <span>Accept invitation and continue</span>
                )}
            </button>
        </form>
    );
}
