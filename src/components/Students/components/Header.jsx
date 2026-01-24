import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  HomeIcon,
  PencilIcon,
  RocketLaunchIcon,
  UserCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../hooks/useNotifications";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import DigitalPortfolioSideDrawer from "./DigitalPortfolioSideDrawer";
import NotificationPanel from "./NotificationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Header = ({ activeTab, setActiveTab }) => {
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const location = useLocation();

  // Check if current route is a digital portfolio route
  const isDigitalPortfolioRoute = location.pathname.startsWith('/student/digital-portfolio');
  
  // Check if current route is assessment result page - hide header completely
  const isAssessmentResultRoute = location.pathname.startsWith('/student/assessment/result');

  // Add scrollbar-hide and navbar hover styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .header-hidden {
        transform: translateY(-100%);
      }
      .header-visible {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Handle scroll to hide/show header - DISABLED: Keep header always visible
  // React.useEffect(() => {
  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;

  //     if (currentScrollY < 10) {
  //       // At the top, always show
  //       setScrolled(false);
  //     } else if (currentScrollY > lastScrollY) {
  //       // Scrolling down
  //       setScrolled(true);
  //     } else {
  //       // Scrolling up
  //       setScrolled(false);
  //     }

  //     setLastScrollY(currentScrollY);
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [lastScrollY, isDigitalPortfolioRoute]);

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout, user } = useAuth();
  const notificationRef = React.useRef(null);

  // Close notifications when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Notification Panel
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Fetch real-time notifications
  const userEmail = user?.email || localStorage.getItem("userEmail");
  const { unreadCount } = useNotifications(userEmail);

  // Fetch student data to check school/college association
  const { studentData } = useStudentDataByEmail(userEmail);

  // Check if student is part of a school or college
  const isPartOfSchoolOrCollege = studentData?.school_id || studentData?.university_college_id;

  // Generate profile link
  const profileLink = useMemo(() => {
    const studentId = studentData?.id || "student";
    return `${window.location.origin}/student/profile/${studentId}`;
  }, [studentData?.id]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    // { id: "skills", label: "Skills" },
    { id: "training", label: "My Learning", icon: AcademicCapIcon },
    // { id: "experience", label: "Experience" },
    { id: "courses", label: "Courses", icon: BookOpenIcon },
    { id: "digital-portfolio", label: "Digital Portfolio", icon: BriefcaseIcon },
    { id: "opportunities", label: "Opportunities", icon: RocketLaunchIcon },
    { id: "career-ai", label: "Career AI" },
    // Only show "My Class" if student is part of a school or college
    ...(isPartOfSchoolOrCollege ? [{ id: "assignments", label: "My Class", icon: ClipboardDocumentListIcon }] : []),
    // {id: "clubs", label: "Co-Curriculars"},
    { id: "messages", label: "Messages", icon: EnvelopeIcon },
    // Analytics removed - now integrated in Dashboard with tabs
  ];

  // Handle tab click - navigate to appropriate route
  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    if (tab.id === "share") {
      setShowShareModal(true);
    } else if (tab.id === "skills") {
      navigate("/student/my-skills");
    } else if (tab.id === "training") {
      navigate("/student/my-learning");
    } else if (tab.id === "experience") {
      navigate("/student/my-experience");
    } else if (tab.id === "courses") {
      navigate("/student/courses");
    } else if (tab.id === "digital-portfolio") {
      navigate("/student/digital-portfolio");
    } else if (tab.id === "opportunities") {
      navigate("/student/opportunities");
    } else if (tab.id === "applications") {
      navigate("/student/applications");
    } else if (tab.id === "assignments") {
      navigate("/student/my-class");
    } else if (tab.id === "career-ai") {
      navigate("/student/career-ai");
    } else if (tab.id === "messages") {
      navigate("/student/messages");
    }
  };

  // Don't render header on assessment result page (after all hooks are called)
  if (isAssessmentResultRoute) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-2 px-1 sm:px-2 lg:px-4 sticky top-0 z-[100]">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center flex-shrink-0">
          <img
            src="/RareMinds.webp"
            alt="RareMinds Logo"
            className="w-20 h-7 sm:w-24 sm:h-8 lg:w-auto lg:h-10 object-contain bg-white"
          />
        </div>

        {/* Center Tabs - Desktop Only (lg and above) */}
        <nav className="hidden lg:flex flex-1 justify-center items-center mx-2">
          <div className="flex items-center space-x-2">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                localStorage.removeItem("dashboardActiveNav");
                navigate("/student/dashboard");
              }}
              className={`group flex items-center py-2 px-1.5 lg:px-2 xl:px-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${activeTab === "dashboard"
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <HomeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="hidden xl:inline">Dashboard</span>
              <span className="xl:hidden">D</span>
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-tour={`nav-${tab.id}`}
                onClick={() => handleTabClick(tab)}
                className={`group flex items-center py-2 px-1.5 lg:px-2 xl:px-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${activeTab === tab.id || (tab.id === "digital-portfolio" && isDigitalPortfolioRoute)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-2 flex-shrink-0" />}
                <span className="hidden xl:inline">{tab.label}</span>
                <span className="xl:hidden">{tab.label.split(' ').map(word => word.charAt(0)).join('')}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Medium Tablets - Horizontal Scroll Navigation */}
        <nav className="hidden md:flex lg:hidden flex-1 justify-start items-center mx-1 overflow-hidden">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                localStorage.removeItem("dashboardActiveNav");
                navigate("/student/dashboard");
              }}
              className={`group flex items-center py-2 px-1 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === "dashboard"
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <HomeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              D
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`group flex items-center py-2 px-1 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id || (tab.id === "digital-portfolio" && isDigitalPortfolioRoute)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-2 flex-shrink-0" />}
                {tab.label.split(' ').map(word => word.charAt(0)).join('')}
              </button>
            ))}
          </div>
        </nav>

        {/* Right Side - Mobile Menu and Profile */}
        <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
          {/* Hamburger Menu - Mobile and Tablets (up to lg) */}
          <div className="flex lg:hidden items-center">
            <button
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => {
                setMobileMenuOpen((open) => !open)
                setShowNotifications(false)
              }}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => {
                setShowNotifications((s) => !s)
                setMobileMenuOpen(false)
              }}
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Notification Panel */}
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              studentEmail={userEmail}
            />
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-gray-200 shadow-xl"
            >
              {/* Only show Edit Profile if student is NOT part of school or college */}
              {!isPartOfSchoolOrCollege && (
                <DropdownMenuItem
                  onClick={() => {
                    setActiveTab("profile");
                    navigate("/student/profile");
                  }}
                  className="cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("saved-jobs");
                  navigate("/student/saved-jobs");
                }}
                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                Saved Jobs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("settings");
                  navigate("/student/settings");
                }}
                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Cog6ToothIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Mobile Menu Dropdown - Shows on mobile and tablets (up to lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg px-2 pt-2 pb-3 animate-fade-in-down max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                localStorage.removeItem("dashboardActiveNav");
                navigate("/student/dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "dashboard"
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <div className="flex items-center">
                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">Dashboard</span>
              </div>
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  handleTabClick(tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id || (tab.id === "digital-portfolio" && isDigitalPortfolioRoute)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center">
                  {tab.icon && <tab.icon className="h-5 w-5 flex-shrink-0" />}
                  <span className="ml-3">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Share Passport Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative animate-fade-in-up">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              Share Your Skill Passport
            </h2>

            <div className="space-y-4">
              {/* Web Share API button for supported devices */}
              {navigator.share && (
                <button
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md"
                  onClick={() => {
                    navigator
                      .share({
                        title: "My Skill Passport",
                        text: "Check out my Skill Passport!",
                        url: profileLink,
                      })
                      .catch(() => {
                        // Ignore if user cancels
                      });
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 6l-4-4-4 4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2v14"
                    />
                  </svg>
                  <span>Share via Device</span>
                </button>
              )}

              {/* Social Media Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "Check out my Skill Passport: " + profileLink
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    profileLink
                  )}&text=${encodeURIComponent(
                    "Check out my Skill Passport!"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.371 0 0 5.371 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12c0-6.629-5.371-12-12-12zm5.707 7.293l-2.828 10.607c-.211.789-.678.979-1.372.609l-3.797-2.803-1.834-.883c-.399-.211-.408-.399.084-.588l7.16-2.763c.312-.123.604.075.469.588l-1.153 4.66c-.084.338-.258.408-.525.252l-2.262-1.484-1.084 1.045c-.112.112-.213.217-.436.112l.155-2.197 4.004-3.617c.174-.155.338-.07.282.155z" />
                  </svg>
                  <span>Telegram</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    profileLink
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    "Check out my Skill Passport"
                  )}&body=${encodeURIComponent(
                    "Here is my Skill Passport: " + profileLink
                  )}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </a>
              </div>

              {/* Copy Link */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Or copy link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                    title={copied ? "Copied!" : "Copy Link"}
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Portfolio Side Drawer - Only shown on digital portfolio routes */}
      {isDigitalPortfolioRoute && (
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

