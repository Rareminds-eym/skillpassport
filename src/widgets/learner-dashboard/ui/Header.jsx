import { useAuthStore } from '@/shared/model/authStore';
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
  LockClosedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNotifications } from '@/features/notifications';
import { useLearnerDataByEmail } from '@/entities/learner';
import { isLearner } from '@/entities/learner/lib/learnerType';
import DigitalPortfolioSideDrawer from "./DigitalPortfolioSideDrawer";
import NotificationPanel from "./NotificationPanel";
import NavButton from "./NavButton";
import { PROFILE_MENU_ITEMS } from "../config/profileMenuItems";

import { useUser, useAuthActions } from '@/shared/model/authStore';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';
import { PLAN_IDS } from '@/shared/config/subscriptionPlans';
const ICON_MAP = {
  BookmarkIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
};

const Header = ({ activeTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showFreemiumBanner, setShowFreemiumBanner] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { logout } = useAuthActions();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const isAssessmentResultRoute = location.pathname.startsWith('/learner/assessment/result');
  const isPortfolioPage = location.pathname === '/learner/digital-portfolio/portfolio';
  const isDigitalPortfolioRoute = location.pathname.startsWith('/learner/digital-portfolio');

  const userEmail = user?.email || (useAuthStore.getState().user?.email || localStorage.getItem("userEmail"));
  const { unreadCount } = useNotifications(userEmail);

  const { learnerData, loading: learnerDataLoading } = useLearnerDataByEmail(userEmail);
  const isPartOfSchoolOrCollege = !learnerDataLoading && (learnerData?.school_id || learnerData?.university_college_id) && !isLearner(learnerData);

  // Get subscription data for feature gating
  const { subscriptionData } = useSubscriptionQuery();
  const userPlan = subscriptionData?.plan || PLAN_IDS.FREEMIUM;
  const isFreemium = userPlan === PLAN_IDS.FREEMIUM;

  // Map navigation items to feature keys
  const featureKeyMap = {
    "training": "course_enrollment",
    "courses": "courses_listing_access",
    "digital-portfolio": "portfolio",
    "opportunities": "opportunities_listing_access",
    "career-ai": "career_paths",
    "assignments": "assessments",
    "messages": "priority_support",
  };

  // Check feature access for each navigation item
  const navigationItems = useMemo(() => {
    const items = [
      { id: "training", label: "My Learning", icon: AcademicCapIcon, path: "/learner/my-learning", featureKey: "course_enrollment" },
      { id: "courses", label: "Courses", icon: BookOpenIcon, path: "/learner/courses", featureKey: "courses_listing_access" },
      { id: "digital-portfolio", label: "Digital Portfolio", icon: BriefcaseIcon, path: "/learner/digital-portfolio", featureKey: "portfolio" },
      { id: "opportunities", label: "Opportunities", icon: RocketLaunchIcon, path: "/learner/opportunities", featureKey: "opportunities_listing_access" },
      { id: "career-ai", label: "Career AI", icon: null, path: "/learner/career-ai", featureKey: "career_paths" },
      ...(isPartOfSchoolOrCollege ? [{ id: "assignments", label: "My Class", icon: ClipboardDocumentListIcon, path: "/learner/my-class", featureKey: "assessments" }] : []),
      { id: "messages", label: "Messages", icon: EnvelopeIcon, path: "/learner/messages", featureKey: "priority_support" },
    ];

    // Add access check to each item
    return items.map(item => {
      const accessResult = checkFeatureAccess(userPlan, item.featureKey, [], {}, user?.id);
      return {
        ...item,
        hasAccess: accessResult.hasAccess,
        locked: !accessResult.hasAccess,
        upgradeRequired: accessResult.upgradeRequired,
      };
    });
  }, [isPartOfSchoolOrCollege, userPlan, user?.id]);
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
    // Check if feature is locked
    if (item.locked) {
      // Show upgrade prompt instead of navigating
      setShowUpgradePrompt(true);
      return;
    }

    navigate(item.path);
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleDashboard = useCallback(() => {
    localStorage.removeItem("dashboardActiveNav");
    navigate("/learner/dashboard");
    setMobileMenuOpen(false);
  }, [navigate]);

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
    <>
      {/* Thin Freemium Banner - Above navbar */}
      {isFreemium && showFreemiumBanner && (
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 text-white py-2 px-4 text-center text-sm font-medium sticky top-0 z-[60]">
          <div className="flex items-center justify-center gap-2 relative">
            <SparklesIcon className="w-4 h-4" />
            <span>You're on Freemium Plan.</span>
            <button
              onClick={() => navigate('/subscription/plans?type=learner')}
              className="ml-2 px-3 py-0.5 bg-white text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </button>
            {/* Close button */}
            <button
              onClick={() => setShowFreemiumBanner(false)}
              className="absolute right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close banner"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className={`bg-white border-b border-gray-200 shadow-sm sticky z-50 ${isFreemium && showFreemiumBanner ? 'top-[30px]' : 'top-0'}`}>
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
              {navigationItems.map((item) => (
                <NavButton
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  isActive={activeTab === item.id || (item.id === "digital-portfolio" && isDigitalPortfolioRoute)}
                  icon={item.icon}
                  label={item.label}
                  locked={item.locked}
                  dataTour={`${item.id}-nav`}
                />
              ))}
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
                      learnerEmail={userEmail}
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
                      disabled={item.locked}
                      className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${item.locked
                        ? "text-gray-400 cursor-not-allowed opacity-60"
                        : isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      {Icon ? <Icon className="h-4 sm:h-5 w-4 sm:w-5 mr-3" /> : <div className="w-4 sm:w-5 h-4 sm:h-5 mr-3" />}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.locked && <LockClosedIcon className="h-4 sm:h-5 w-4 sm:w-5" />}
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

        {/* Upgrade Prompt Modal */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-md">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <LockClosedIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Upgrade Required</h3>
              <p className="text-gray-600 text-center mb-6">
                This feature is not available on the Freemium plan. Upgrade to a paid plan to unlock all features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUpgradePrompt(false);
                    navigate('/subscription/plans?type=learner');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;