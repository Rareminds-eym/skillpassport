import { AlertCircle, Loader2 } from 'lucide-react';

interface InvitationErrorProps {
    error: string;
    token: string | null;
    requiresSignOut: boolean;
    loading: boolean;
    onSignOut: () => void;
    onRequestResend: () => void;
    onNavigateToLogin: () => void;
}

/**
 * Error state component for invitation page
 * Shows different actions based on error type
 */
export function InvitationError({
    error,
    token,
    requiresSignOut,
    loading,
    onSignOut,
    onRequestResend,
    onNavigateToLogin,
}: InvitationErrorProps) {
    return (
        <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>

            <div className="space-y-3">
                {/* Sign out button for session conflicts */}
                {requiresSignOut && (
                    <button
                        onClick={onSignOut}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg bg-[#278FD3] text-white hover:bg-[#1f7ab8] transition-colors disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing out...
                            </span>
                        ) : (
                            'Sign out and continue'
                        )}
                    </button>
                )}

                {/* Request resend button for other errors */}
                {token && !requiresSignOut && (
                    <button
                        onClick={onRequestResend}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg border border-[#278FD3] text-[#278FD3] hover:bg-[#278FD3] hover:bg-opacity-10 transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Requesting...' : 'Request new invitation'}
                    </button>
                )}

                {/* Back to login */}
                <button
                    onClick={onNavigateToLogin}
                    className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
