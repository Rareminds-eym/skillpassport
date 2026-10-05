import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/widgets/admin-navigation";
import Sidebar from '@/features/admin/ui/Sidebar';
import AICounsellingFAB from "@/features/admin/ui/AICounsellingFAB";
import { useAdminNavFeatures } from '@/features/admin/model/useAdminNavFeatures';
import { matchAdminNavFeature } from '@/features/admin/model/adminNavFeatureMatcher';
import { useUserRole } from '@/shared/model/authStore';
import { AdminFeatureLockedState } from '@/features/subscription/ui/shared/AdminFeatureLockedState';

const AdminLayout = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const location = useLocation();
    const { role } = useUserRole();

    // Ensure role matches the current admin portal section even before authStore settles
    const effectiveRole = useMemo(() => {
        if (role && ['college_admin', 'school_admin', 'university_admin'].includes(role)) {
            return role;
        }
        if (location.pathname.startsWith('/college-admin')) return 'college_admin';
        if (location.pathname.startsWith('/school-admin')) return 'school_admin';
        if (location.pathname.startsWith('/university-admin')) return 'university_admin';
        return null;
    }, [role, location.pathname]);

    const { navFeatures, isHybrid: isHybridOrg, features, ready, loading } = useAdminNavFeatures(effectiveRole);
    const grantedFeatureKeys = useMemo(() => new Set(features), [features]);

    // Check if the current route is gated and not included in this organization's hybrid plan
    const lockedFeature = useMemo(() => {
        if (!isHybridOrg || !ready) return null;
        const matched = matchAdminNavFeature(location.pathname, navFeatures);
        if (matched && !grantedFeatureKeys.has(matched.key)) {
            return matched;
        }
        return null;
    }, [isHybridOrg, ready, navFeatures, grantedFeatureKeys, location.pathname]);

    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    const handleMobileMenuClose = () => setShowMobileMenu(false);

    return (
            <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
            {/* ===== Fixed Header ===== */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b">
                <Header
                    onMenuToggle={() => setShowMobileMenu((prev) => !prev)}
                    showMobileMenu={showMobileMenu}
                />
            </div>

            {/* ===== Sidebar + Main Content ===== */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r fixed top-16 bottom-0 left-0 z-20">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        showMobileMenu={false}
                    />
                </div>

                {/* Mobile Sidebar */}
                {showMobileMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40 md:hidden"
                            onClick={handleMobileMenuClose}
                        />
                        <div className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg overflow-y-auto z-50 md:hidden">
                            <Sidebar
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                showMobileMenu={true}
                                onMobileMenuClose={handleMobileMenuClose}
                            />
                        </div>
                    </>
                )}

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto md:ml-72 flex flex-col pt-16">
                    <div className="mx-auto w-full flex-1">
                        {loading && !ready ? (
                            <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-8">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-gray-400">Verifying access...</span>
                                </div>
                            </div>
                        ) : lockedFeature ? (
                            <AdminFeatureLockedState key={lockedFeature.key} feature={lockedFeature} role={effectiveRole} />
                        ) : (
                            <Outlet />
                        )}
                    </div>
                    <footer className="bg-white border-t border-gray-200 py-4 px-6">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>© {new Date().getFullYear()} Admin Portal. All rights reserved.</span>
                            <div className="flex items-center gap-4">
                                <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-gray-700 transition-colors">Help</a>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>

            {/* AI Counselling Floating Action Button */}
            <AICounsellingFAB />
        </div>
    );
};

export default AdminLayout;
