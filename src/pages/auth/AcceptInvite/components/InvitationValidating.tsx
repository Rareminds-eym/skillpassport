import { Loader2 } from 'lucide-react';

/**
 * Loading state component shown during invitation validation
 */
export function InvitationValidating() {
    return (
        <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Validating invitation...</p>
        </div>
    );
}
