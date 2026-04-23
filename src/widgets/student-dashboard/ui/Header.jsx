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
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNotifications } from '@/features/notifications';
import { useStudentDataByEmail } from '@/entities/student';
import { isLearner } from '@/entities/student/lib/studentType';
import DigitalPortfolioSideDrawer from "./DigitalPortfolioSideDrawer";
import NotificationPanel from "./NotificationPanel";
import NavButton from "./NavButton";
import { PROFILE_MENU_ITEMS } from "../config/profileMenuItems";

import { useUser, useAuthActions } from '@/shared/model/authStore';
const ICON_MAP = {
  BookmarkIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
};

const Header = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { logout } = useAuthActions();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const isAssessmentResultRoute = location.pathname.startsWith('/student/assessment/result');
  const isPortfolioPage = location.pathname === '/student/digital-portfolio/portfolio';
  const isDigitalPortfolioRoute = location.pathname.startsWith('/student/digital-portfolio');

  const userEmail = user?.email || localStorage.getItem("userEmail");
  const { unreadCount } = useNotifications(userEmail);

  const { studentData, loading: studentDataLoading } = useStudentDataByEmail(userEmail);
  const isPartOfSchoolOrCollege = !studentDataLoading && (studentData?.school_id || studentData?.university_college_id) && !isLearner(studentData);

  const navigationItems = useMemo(() => [
    { id: "training", label: "My Learning", icon: AcademicCapIcon, path: "/student/my-learning" },
    { id: "courses", label: "Courses", icon: BookOpenIcon, path: "/student/courses" },
    { id: "digital-portfolio", label: "Digital Portfolio", icon: BriefcaseIcon, path: "/student/digital-portfolio" },
    { id: "opportunities", label: "Opportunities", icon: RocketLaunchIcon, path: "/student/opportunities" },
    { id: "career-ai", label: "Career AI", icon: null, path: "/student/career-ai" },
    ...(isPartOfSchoolOrCollege ? [{ id: "assignments", label: "My Class", icon: ClipboardDocumentListIcon, path: "/student/my-class" }] : []),
    { id: "messages", label: "Messages", icon: EnvelopeIcon, path: "/student/messages" },
  ], [isPartOfSchoolOrCollege]);
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

  const closeAllModals = useCallback(() => setActiveModal(null), []);
  const toggleNotifications = useCallback(() => setActiveModal(prev => prev === 'notifications' ? null : 'notifications'), []);
  const toggleProfile = useCallback(() => setActiveModal(prev => prev === 'profile' ? null : 'profile'), []);

  const handleNavigation = useCallback((item) => {
    setActiveTab(item.id);
    navigate(item.path);
    setMobileMenuOpen(false);
  }, [setActiveTab, navigate]);

  const handleDashboard = useCallback(() => {
    setActiveTab("dashboard");
    localStorage.removeItem("dashboardActiveNav");
    navigate("/student/dashboard");
    setMobileMenuOpen(false);
  }, [setActiveTab, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
            <NavButton
              onClick={handleDashboard}
              isActive={activeTab === "dashboard"}
              icon={HomeIcon}
              label="Dashboard"
            />
            <NavButton
              onClick={() => handleNavigation({ id: "training", path: "/student/my-learning" })}
              isActive={activeTab === "training"}
              icon={AcademicCapIcon}
              label="My Learning"
              dataTour="my-learning-nav"
            />
            <NavButton
              onClick={() => handleNavigation({ id: "courses", path: "/student/courses" })}
              isActive={activeTab === "courses"}
              icon={BookOpenIcon}
              label="Courses"
              dataTour="courses-nav"
            />
            <NavButton
              onClick={() => handleNavigation({ id: "digital-portfolio", path: "/student/digital-portfolio" })}
              isActive={activeTab === "digital-portfolio" || isDigitalPortfolioRoute}
              icon={BriefcaseIcon}
              label="Digital Portfolio"
              dataTour="digital-portfolio-nav"
            />
            <NavButton
              onClick={() => handleNavigation({ id: "opportunities", path: "/student/opportunities" })}
              isActive={activeTab === "opportunities"}
              icon={RocketLaunchIcon}
              label="Opportunities"
              dataTour="opportunities-nav"
            />
            <NavButton
              onClick={() => handleNavigation({ id: "career-ai", path: "/student/career-ai" })}
              isActive={activeTab === "career-ai"}
              label="Career AI"
              dataTour="career-ai-nav"
            />
            {isPartOfSchoolOrCollege && (
              <NavButton
                onClick={() => handleNavigation({ id: "assignments", path: "/student/my-class" })}
                isActive={activeTab === "assignments"}
                icon={ClipboardDocumentListIcon}
                label="My Class"
              />
            )}
            <NavButton
              onClick={() => handleNavigation({ id: "messages", path: "/student/messages" })}
              isActive={activeTab === "messages"}
              icon={EnvelopeIcon}
              label="Messages"
            />
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
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
                    {PROFILE_MENU_ITEMS.map((item) => {
                      const Icon = ICON_MAP[item.iconName];
                      return (
                        <div key={item.id}>
                          {item.isDivider && <div className="border-t border-gray-200 my-1" />}
                          <button
                            onClick={() => {
                              if (item.id === 'logout') {
                                handleLogout();
                              } else {
                                setActiveTab(item.id);
                                navigate(item.path);
                                setActiveModal(null);
                              }
                            }}
                            className={`w-full flex items-center px-4 py-2 text-sm ${item.className} text-left`}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </button>
                        </div>
                      );
                    })}
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
                className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${activeTab === "dashboard"
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
                  (item.id === "digital-portfolio" && isDigitalPortfolioRoute);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${isActive
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

      {/* Digital Portfolio Side Drawer */}
      {isPortfolioPage && (
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