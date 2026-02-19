import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  HomeIcon,
  RocketLaunchIcon,
  UserCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../hooks/useNotifications";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import DigitalPortfolioSideDrawer from "./DigitalPortfolioSideDrawer";
import NotificationPanel from "./NotificationPanel";

const Header = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'notifications' | 'profile' | null
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Check if current route is assessment result page - hide header completely
  const isAssessmentResultRoute = location.pathname.startsWith('/student/assessment/result');

  // Fetch real-time notifications
  const userEmail = user?.email || localStorage.getItem("userEmail");
  const { unreadCount } = useNotifications(userEmail);

  // Fetch student data to check school/college association
  const { studentData } = useStudentDataByEmail(userEmail);
  const isPartOfSchoolOrCollege = studentData?.school_id || studentData?.university_college_id;

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target) &&
          profileRef.current && !profileRef.current.contains(event.target)) {
        setActiveModal(null);
      }
    };

    if (activeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeModal]);

  // Modal control functions
  const toggleNotifications = () => {
    setActiveModal(activeModal === 'notifications' ? null : 'notifications');
  };

  const toggleProfile = () => {
    setActiveModal(activeModal === 'profile' ? null : 'profile');
  };

  const closeAllModals = () => {
    setActiveModal(null);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Navigation items
  const navigationItems = [
    { id: "training", label: "My Learning", icon: AcademicCapIcon, path: "/student/my-learning" },
    { id: "courses", label: "Courses", icon: BookOpenIcon, path: "/student/courses" },
    { id: "digital-portfolio", label: "Digital Portfolio", icon: BriefcaseIcon, path: "/student/digital-portfolio" },
    { id: "opportunities", label: "Opportunities", icon: RocketLaunchIcon, path: "/student/opportunities" },
    { id: "career-ai", label: "Career AI", icon: null, path: "/student/career-ai" },
    ...(isPartOfSchoolOrCollege ? [{ id: "assignments", label: "My Class", icon: ClipboardDocumentListIcon, path: "/student/my-class" }] : []),
    { id: "messages", label: "Messages", icon: EnvelopeIcon, path: "/student/messages" },
  ];

  // Handle navigation
  const handleNavigation = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  const handleDashboard = () => {
    setActiveTab("dashboard");
    localStorage.removeItem("dashboardActiveNav");
    navigate("/student/dashboard");
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Don't render header on assessment result page
  if (isAssessmentResultRoute) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 lg:px-8">
          
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <img
              src="/RareMinds.webp"
              alt="RareMinds Logo"
              className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain"
            />
          </div>

          {/* Center: Navigation - Desktop Only (1024px+) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {/* Dashboard */}
            <button
              onClick={handleDashboard}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <HomeIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>Dashboard</span>
            </button>

            {/* My Learning */}
            <button
              data-tour="my-learning-nav"
              onClick={() => handleNavigation({ id: "training", path: "/student/my-learning" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "training"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <AcademicCapIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>My Learning</span>
            </button>

            {/* Courses */}
            <button
              data-tour="courses-nav"
              onClick={() => handleNavigation({ id: "courses", path: "/student/courses" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "courses"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <BookOpenIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>Courses</span>
            </button>

            {/* Digital Portfolio */}
            <button
              data-tour="digital-portfolio-nav"
              onClick={() => handleNavigation({ id: "digital-portfolio", path: "/student/digital-portfolio" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "digital-portfolio" || location.pathname.startsWith('/student/digital-portfolio')
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <BriefcaseIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>Digital Portfolio</span>
            </button>

            {/* Opportunities */}
            <button
              data-tour="opportunities-nav"
              onClick={() => handleNavigation({ id: "opportunities", path: "/student/opportunities" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "opportunities"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <RocketLaunchIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>Opportunities</span>
            </button>

            {/* Career AI */}
            <button
              data-tour="career-ai-nav"
              onClick={() => handleNavigation({ id: "career-ai", path: "/student/career-ai" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "career-ai"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>Career AI</span>
            </button>

            {/* My Class - Only if applicable */}
            {isPartOfSchoolOrCollege && (
              <button
                onClick={() => handleNavigation({ id: "assignments", path: "/student/my-class" })}
                className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === "assignments"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <ClipboardDocumentListIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
                <span>My Class</span>
              </button>
            )}

            {/* Messages */}
            <button
              onClick={() => handleNavigation({ id: "messages", path: "/student/messages" })}
              className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "messages"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <EnvelopeIcon className="h-3 xl:h-4 w-3 xl:w-4 mr-1 xl:mr-2" />
              <span>Messages</span>
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">

            {/* Digital Portfolio Menu Button - Only show on portfolio page */}
            {/* {location.pathname === '/student/digital-portfolio/portfolio' && (
              <button
                onClick={() => setSideDrawerOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
                title="Portfolio Menu"
              >
                <Cog6ToothIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )} */}
            
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotifications}
                className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
              >
                <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] bg-red-500 text-white text-xs font-semibold rounded-full px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              {activeModal === 'notifications' && (
                <div className="absolute right-0 mt-2 z-50">
                  <NotificationPanel
                    isOpen={true}
                    onClose={closeAllModals}
                    studentEmail={userEmail}
                  />
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={toggleProfile}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
              >
                <UserCircleIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              {activeModal === 'profile' && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                  <div className="py-1">
                    {/* Only show Edit Profile if student is NOT part of school or college */}
                    {/* {!isPartOfSchoolOrCollege && (
                      <button
                        onClick={() => {
                          setActiveTab("profile");
                          navigate("/student/profile");
                          setActiveModal(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit Profile
                      </button>
                    )} */}
                    <button
                      onClick={() => {
                        setActiveTab("saved-jobs");
                        navigate("/student/saved-jobs");
                        setActiveModal(null);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Saved Jobs
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        navigate("/student/settings");
                        setActiveModal(null);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-8 h-8 md:w-9 md:h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Bars3Icon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Show on tablet and mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 sm:space-y-2">
              
              {/* Dashboard - Mobile */}
              <button
                onClick={handleDashboard}
                className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <HomeIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-3" />
                Dashboard
              </button>

              {/* All Navigation Items - Mobile */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || 
                  (item.id === "digital-portfolio" && location.pathname.startsWith('/student/digital-portfolio'));
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {Icon ? <Icon className="h-4 sm:h-5 w-4 sm:w-5 mr-3" /> : <div className="w-4 sm:w-5 h-4 sm:h-5 mr-3" />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Digital Portfolio Side Drawer - Only shown on portfolio page */}
      {location.pathname === '/student/digital-portfolio/portfolio' && (
        <DigitalPortfolioSideDrawer
          isOpen={sideDrawerOpen}
          onClose={() => setSideDrawerOpen(false)}
          onOpen={() => setSideDrawerOpen(true)}
        />
      )}
    </header>
  );
};

export default Header;