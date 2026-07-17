import { FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { PASSWORD_MIN } from '@/shared/constants';

interface StandardInvitationFormProps {
    password: string;
    onPasswordChange: (value: string) => void;
    showPassword: boolean;
    onToggleShowPassword: () => void;
    loading: boolean;
    error: string;
    onClearError: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/**
 * Form component for standard (non-recruitment) invitations
 * Password is optional for existing users
 */
export function StandardInvitationForm({
    password,
    onPasswordChange,
    showPassword,
    onToggleShowPassword,
    loading,
    error,
    onClearError,
    onSubmit,
}: StandardInvitationFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Info banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>New user?</strong> Set a password below to create your account.
                    <br />
                    <strong>Existing user?</strong> Leave the password field empty to join with your current
                    account.
                </p>
            </div>

            {/* Password field */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password (required for new users)
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
                        minLength={PASSWORD_MIN}
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
                        placeholder="Set a password (10+ characters)"
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
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                    </>
                ) : (
                    <span>Accept Invitation</span>
                )}
            </button>
        </form>
    );
}
