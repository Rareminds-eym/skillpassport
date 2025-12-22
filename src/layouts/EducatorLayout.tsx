import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/educator/Header";
import Sidebar from "../components/educator/Sidebar";
import StudentProfileDrawer from "../components/shared/StudentProfileDrawer";
import FloatingEducatorAIButton from "../components/FloatingEducatorAIButton";
import { useEducatorSchool } from "../hooks/useEducatorSchool";

const EducatorLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDrawer, setShowStudentDrawer] = useState(false);
  const location = useLocation();
  
  // Get educator information to determine type
  const { school: educatorSchool, college: educatorCollege, educatorType } = useEducatorSchool();

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
        <main className="flex-1 md:ml-64 overflow-auto flex flex-col">
          <div className="flex-1 w-full">
            <Outlet context={{ onViewProfile: handleViewProfile }} />
          </div>
          <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>© {new Date().getFullYear()} Educator Portal. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Help</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Student Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={showStudentDrawer}
        onClose={handleCloseStudentDrawer}
        userRole={educatorType === 'school' ? 'school_educator' : 'college_educator'}
        schoolId={educatorSchool?.id}
        collegeId={educatorCollege?.id}
      />
      
      {/* Floating AI Button */}
      <FloatingEducatorAIButton />
    </div>
  );
};

export default EducatorLayout;
