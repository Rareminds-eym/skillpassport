import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * AdminProtectedRoute - Restricts access to company admins only
 * 
 * Checks if the user has admin privileges (company_admin or owner role).
 * If not, redirects to the recruiter overview page.
 * 
 * Usage:
 * ```tsx
 * <Route 
 *   path="admin" 
 *   element={
 *     <AdminProtectedRoute>
 *       <AdminDashboard />
 *     </AdminProtectedRoute>
 *   } 
 * />
 * ```
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { orgContext, loading } = useOrgContext();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Give a brief moment for org context to load
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [loading]);

    // Show loading state while checking permissions
    if (loading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Check if user is admin
    const isAdmin = orgContext?.isAdmin || orgContext?.ssoRoleName === 'owner' || orgContext?.recruitmentRole === 'company_admin';

    // 🔒 Production logging disabled - uncomment for debugging
    // if (import.meta.env.DEV) {
    //     console.log('[AdminProtectedRoute] Access check:', {
    //         isAdmin,
    //         ssoRoleName: orgContext?.ssoRoleName,
    //         recruitmentRole: orgContext?.recruitmentRole,
    //         orgContextIsAdmin: orgContext?.isAdmin,
    //     });
    // }

    // If not admin, redirect to overview
    if (!isAdmin) {
        // console.log('[AdminProtectedRoute] ❌ Access denied - User is not an admin, redirecting to overview');
        return <Navigate to="/recruitment/overview" replace />;
    }

    // console.log('[AdminProtectedRoute] ✓ Access granted - User is admin');
    return <>{children}</>;
};

export default AdminProtectedRoute;
