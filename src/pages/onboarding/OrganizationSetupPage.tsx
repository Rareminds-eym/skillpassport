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

    const handleComplete = () => {
        // Navigate back to the admin dashboard after setup
        const dashboardPaths: Record<OrganizationType, string> = {
            college: '/college-admin/dashboard',
            school: '/school-admin/dashboard',
            university: '/university-admin/dashboard',
        };

        navigate(dashboardPaths[organizationType] || '/', { replace: true });
    };

    if (!organizationType) {
        return null;
    }

    return (
        <OrganizationSetup
            organizationType={organizationType}
            onComplete={handleComplete}
        />
    );
}
