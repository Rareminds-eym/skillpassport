import { CheckCircle } from 'lucide-react';

interface InvitationSuccessProps {
    organizationName?: string;
    isRecruitmentInvite: boolean;
    onNavigate: () => void;
}

/**
 * Success state component shown after invitation acceptance
 */
export function InvitationSuccess({
    organizationName,
    isRecruitmentInvite,
    onNavigate,
}: InvitationSuccessProps) {
    return (
        <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You're in!</h2>
            <p className="text-gray-600 mb-6">
                {organizationName
                    ? `You've successfully joined ${organizationName}.`
                    : "You've successfully joined the organization."}
            </p>
            <button
                onClick={onNavigate}
                className="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
                Go to Dashboard
            </button>
        </div>
    );
}
