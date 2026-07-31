/**
 * Organization Setup Page
 * Standalone page for organization onboarding
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OrganizationSetup from '@/features/onboarding/ui/OrganizationSetup';
import { OrganizationType } from '@/entities/organization/model/useOrganizationCheck';

export default function OrganizationSetupPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const organizationType = searchParams.get('type') as OrganizationType;

    useEffect(() => {
        // Validate organization type
        if (!organizationType || !['college', 'school', 'university'].includes(organizationType)) {
            navigate('/', { replace: true });
        }
    }, [organizationType, navigate]);

    if (!organizationType) {
        return null;
    }

    return <OrganizationSetup organizationType={organizationType} />;
}
