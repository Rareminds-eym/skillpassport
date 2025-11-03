import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/educator/Header";
import Sidebar from "../components/educator/Sidebar";
import CandidateProfileDrawer from "../components/educator/components/CandidateProfileDrawer";



const EducatorLayout: React.FC = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showStudentDrawer, setShowStudentDrawer] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    const handleMobileMenuClose = () => {
        setShowMobileMenu(false);
    };

    const handleViewProfile = (student: any) => {
        setSelectedStudent(student);
        setShowStudentDrawer(true);
    };

    const handleCloseStudentDrawer = () => {
        setShowStudentDrawer(false);
        setSelectedStudent(null);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                onMenuToggle={() => setShowMobileMenu((prev) => !prev)}
                showMobileMenu={showMobileMenu}
            />

            <div className="flex flex-1 w-full overflow-hidden">
                <div className="hidden md:flex md:fixed md:inset-y-0 md:pt-16 md:w-64 md:flex-col">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        showMobileMenu={false}
                    />
                </div>

                {showMobileMenu && (
                    <>
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden pt-16"
                            onClick={() => setShowMobileMenu(false)}
                            aria-hidden="true"
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

                <main className="flex-1 w-full md:ml-64 overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8 min-h-full max-w-7xl mx-auto w-full">
                        <Outlet context={{ onViewProfile: handleViewProfile }} />
                    </div>
                </main>
            </div>
            <CandidateProfileDrawer
                candidate={selectedStudent}
                isOpen={showStudentDrawer}
                onClose={handleCloseStudentDrawer}
            />
        </div>
    );
};

export default EducatorLayout;