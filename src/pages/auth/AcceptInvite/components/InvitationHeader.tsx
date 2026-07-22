import { Users } from 'lucide-react';

interface InvitationHeaderProps {
    isRecruitmentInvite: boolean;
}

/**
 * Header component for invitation page
 * Shows different headers for recruitment vs standard invitations
 */
export function InvitationHeader({ isRecruitmentInvite }: InvitationHeaderProps) {
    if (isRecruitmentInvite) {
        return (
            <div className="text-center mb-6">
                <img
                    src="/RareMinds ISO Logo-01.png"
                    alt="SkillPassport"
                    className="h-16 mx-auto mb-4"
                />
            </div>
        );
    }

    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
            <p className="text-gray-600">Join the organization and start collaborating</p>
        </div>
    );
}
