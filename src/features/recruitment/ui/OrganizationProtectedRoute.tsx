/**
 * OrganizationProtectedRoute
 * 
 * Route guard for recruitment features that checks organization membership
 * instead of individual user subscriptions.
 * 
 * Features:
 * - Authentication check
 * - Role verification (recruiter)
 * - Organization membership check
 * - Organization status check (active/suspended)
 * - No subscription requirement (organization-based access)
 * 
 * Usage:
 * <OrganizationProtectedRoute allowedRoles={['recruiter']}>
 *   <RecruiterLayout />
 * </OrganizationProtectedRoute>
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthLoading, useUserRole } from '@/shared/model/authStore';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import Loader from '@/shared/ui/Loader';

interface OrganizationProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    loginFallbackPath?: string;
}

const OrganizationProtectedRoute: React.FC<OrganizationProtectedRouteProps> = ({
    children,
    allowedRoles = ['recruiter'],
    loginFallbackPath = '/login',
}) => {
    const isAuthenticated = useIsAuthenticated();
    const authLoading = useAuthLoading();
    const { role } = useUserRole();
    const location = useLocation();
    const { orgContext, isLoading: orgLoading, error: orgError, isWaitingForSync } = useOrgContext();
    const [hasCheckedOrg, setHasCheckedOrg] = useState(false);

    // Debug logging
    console.log('[OrganizationProtectedRoute] State:', {
        isAuthenticated,
        authLoading,
        role,
        pathname: location.pathname,
        orgContext,
        orgLoading,
        orgError: orgError?.message,
        hasCheckedOrg,
        isWaitingForSync
    });

    // Mark that we've attempted to load org context
    useEffect(() => {
        if (!orgLoading) {
            setHasCheckedOrg(true);
        }
    }, [orgLoading]);

    // Show loading state during auth or org context check
    if (authLoading || (orgLoading && !hasCheckedOrg)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center max-w-md">
                    <Loader />
                    {isWaitingForSync ? (
                        <>
                            <p className="text-gray-700 text-base font-medium mt-4">Setting up your organization...</p>
                            <p className="text-gray-500 text-sm mt-2">
                                This usually takes just a few seconds. Thank you for your patience!
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm mt-4">Loading...</p>
                    )}
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to={loginFallbackPath} state={{ from: location }} replace />;
    }

    // Role check - must be in allowed roles
    // For recruitment routes, we check BOTH auth store role AND org context recruitment role
    const hasValidAuthRole = allowedRoles.length === 0 || allowedRoles.includes(role || '');
    const hasValidOrgRole = orgContext && (
        allowedRoles.includes(orgContext.recruitmentRole || '') ||
        (allowedRoles.includes('recruiter') && ['company_admin', 'recruiter'].includes(orgContext.recruitmentRole || ''))
    );

    console.log('[OrganizationProtectedRoute] Role check:', {
        userRole: role,
        orgRecruitmentRole: orgContext?.recruitmentRole,
        allowedRoles,
        hasValidAuthRole,
        hasValidOrgRole,
        pathname: location.pathname
    });

    // Allow access if EITHER auth role OR org role is valid
    // This handles cases where user has 'recruiter' in auth but 'company_admin' in org
    if (allowedRoles.length > 0 && !hasValidAuthRole && !hasValidOrgRole) {
        console.log('[OrganizationProtectedRoute] Role check failed - neither auth role nor org role is valid');
        return (
            <Navigate
                to="/unauthorized"
                state={{
                    message: `Access denied. This area is for ${allowedRoles.join(', ')} only.`,
                    from: location
                }}
                replace
            />
        );
    }

    console.log('[OrganizationProtectedRoute] Role check passed');

    // Organization membership check
    // EXCEPTION: For subscription pages, allow access even if org context fails to load
    // This allows users to purchase subscriptions even if FDW is down
    const isSubscriptionPage = location.pathname.includes('/subscription');

    console.log('[OrganizationProtectedRoute] Organization check:', {
        hasOrgContext: !!orgContext,
        hasCheckedOrg,
        isSubscriptionPage,
        pathname: location.pathname
    });

    if (!orgContext && hasCheckedOrg && !isSubscriptionPage) {
        console.log('[OrganizationProtectedRoute] No organization found, redirecting to onboarding');
        // User is not part of any organization - redirect to onboarding to create it
        // This handles the case where the user signed up with NULL org_name and hasn't completed onboarding yet

        // Prevent redirect loop: if already on onboarding, don't redirect again
        if (location.pathname.startsWith('/recruitment/onboarding')) {
            return <>{children}</>;
        }

        return <Navigate to="/recruitment/onboarding/step-1" replace />;
    }

    // Organization status check
    if (orgContext && !orgContext.isActive) {
        console.log('[OrganizationProtectedRoute] Organization inactive:', {
            orgId: orgContext.orgId,
            membershipStatus: orgContext.membershipStatus
        });
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Inactive</h2>
                    <p className="text-gray-600 mb-2">
                        Your organization membership is currently <span className="font-semibold">{orgContext.membershipStatus}</span>.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Please contact your organization administrator for assistance.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // Check if user has recruitment access
    // EXCEPTION: Allow access to subscription pages even without recruitment access
    // so users can purchase/manage subscriptions
    // Note: isSubscriptionPage is already declared above for organization membership check

    console.log('[OrganizationProtectedRoute] Recruitment access check:', {
        hasRecruitmentAccess: orgContext?.hasRecruitmentAccess,
        isSubscriptionPage,
        pathname: location.pathname
    });

    if (orgContext && !orgContext.hasRecruitmentAccess && !isSubscriptionPage) {
        console.log('[OrganizationProtectedRoute] No recruitment access, showing upgrade message');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recruitment Access Required</h2>
                    <p className="text-gray-600 mb-2">
                        Your organization does not have recruitment features enabled.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Please contact your organization administrator to enable recruitment features.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = '/subscription/plans?type=recruiter'}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            View Subscription Plans
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Error state - allow access with warning for subscription pages, block others
    if (orgError) {
        console.error('[OrganizationProtectedRoute] Error loading org context:', orgError);

        // For subscription pages, allow access with warning (FDW might be down)
        if (isSubscriptionPage) {
            return (
                <>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Unable to verify organization status. You can still access subscription features.
                                </p>
                            </div>
                        </div>
                    </div>
                    {children}
                </>
            );
        }

        // For other pages, show error
        return (
            <>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Unable to verify organization status. Some features may be limited.
                            </p>
                        </div>
                    </div>
                </div>
                {children}
            </>
        );
    }

    // All checks passed - grant access
    console.log('[OrganizationProtectedRoute] All checks passed, granting access', {
        orgId: orgContext?.orgId,
        orgName: orgContext?.orgName,
        role: orgContext?.recruitmentRole,
        pathname: location.pathname
    });
    return <>{children}</>;
};

export default OrganizationProtectedRoute;
