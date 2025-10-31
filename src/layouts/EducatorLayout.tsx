import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/educator/Header";
import Sidebar from "../components/educator/Sidebar";
import StudentProfileDrawer from "../components/educator/components/StudentProfileDrawer";

const EducatorLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDrawer, setShowStudentDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => {
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
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b">
        <Header
          onMenuToggle={() => setShowMobileMenu((prev) => !prev)}
          showMobileMenu={showMobileMenu}
        />
      </div>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar (fixed for desktop) */}
        <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r fixed top-16 bottom-0 left-0 z-20">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showMobileMenu={false}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
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

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto md:ml-64">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ onViewProfile: handleViewProfile }} />
          </div>
        </main>
      </div>

      {/* Student Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={showStudentDrawer}
        onClose={handleCloseStudentDrawer}
      />
    </div>
  );
};

export default EducatorLayout;
