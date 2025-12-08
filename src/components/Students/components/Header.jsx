import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  Settings,
  Edit3,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Bell,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../../../context/AuthContext";
import { useStudentRealtimeActivities } from "../../../hooks/useStudentRealtimeActivities";
import { recentUpdates as mockRecentUpdates } from '../data/mockData';

const Header = ({ activeTab, setActiveTab }) => {
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
      .nav-tab {
        text-decoration: none;
        transition: 0.4s;
        position: relative;
      }
      .nav-tab::before {
        content: "";
        position: absolute;
        width: 0;
        height: 4px;
        background-color: #3B82F6;
        bottom: 0;
        left: 0;
        transition: width 0.4s;
      }
      .nav-tab:hover::before {
        width: 100%;
      }
      .nav-tab.active::before {
        width: 100%;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const { logout, user } = useAuth();

  // Fetch real-time student activities
  const userEmail = user?.email || localStorage.getItem("userEmail");
  const {
    activities: recentActivities,
    isLoading: activitiesLoading,
    isError: activitiesError
  } = useStudentRealtimeActivities(userEmail, 10);

  // Use real activities instead of mock data
  const recentUpdates = recentActivities.length > 0 ? recentActivities : mockRecentUpdates;

  // Read/Unread tracking using localStorage
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(`readNotifications_${userEmail}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save read notifications to localStorage whenever it changes
  React.useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`readNotifications_${userEmail}`, JSON.stringify(readNotifications));
    }
  }, [readNotifications, userEmail]);

  // Calculate unread count
  const unreadCount = recentUpdates.filter(update =>
    !readNotifications.includes(update.id || update.timestamp)
  ).length;

  // Mark notification as read
  const markAsRead = (notificationId) => {
    if (!readNotifications.includes(notificationId)) {
      setReadNotifications(prev => [...prev, notificationId]);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = recentUpdates.map(update => update.id || update.timestamp);
    setReadNotifications(allIds);
  };

  // Check if notification is read
  const isNotificationRead = (notificationId) => {
    return readNotifications.includes(notificationId);
  };

  // Generate profile link
  const profileLink = useMemo(() => {
    const email = userEmail || "student";
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get icon for mobile menu tabs
  const getTabIcon = (tabId) => {
    const icons = {
      skills: "🎯",
      training: "📚",
      experience: "💼",
      courses: "📚",
      "digital-portfolio": "🎨",
      opportunities: "🚀",
      "career-ai": "✨",
      assignments: "📋",
      messages: "💬",
      clubs: "🎭",
    };
    return icons[tabId] || "📄";
  };

  const tabs = [
    // { id: "skills", label: "Skills" },
    { id: "training", label: "My Learning" },
    // { id: "experience", label: "Experience" },
    { id: "courses", label: "Courses", },
    { id: "digital-portfolio", label: "Digital Portfolio" },
    { id: "opportunities", label: "Opportunities" },
    { id: "career-ai", label: "Career AI", icon: "✨" },
    { id: "assignments", label: "My Class" },
    // {id: "clubs", label: "Co-Curriculars"},
    { id: "messages", label: "Messages" },
    // Analytics removed - now integrated in Dashboard with tabs
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-2 px-1 sm:px-2 lg:px-4 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center flex-shrink-0">
          <img
            src="/RareMinds.webp"
            alt="RareMinds Logo"
            className="w-20 h-7 sm:w-24 sm:h-8 lg:w-28 lg:h-9 object-contain bg-white"
          />
        </div>

        {/* Center Tabs - Desktop and Large Tablets */}
        <nav className="hidden lg:flex flex-1 justify-center items-center mx-1 lg:mx-2 xl:mx-4">
          <div className="flex items-center space-x-0 lg:space-x-1 xl:space-x-2">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                localStorage.removeItem("dashboardActiveNav");
                navigate("/student/dashboard");
              }}
              className={`nav-tab relative py-2 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm xl:text-sm font-medium transition-all duration-200 text-gray-900 hover:text-blue-600 bg-transparent border-none outline-none whitespace-nowrap ${activeTab === "dashboard" ? "active font-semibold text-blue-600" : ""
                }`}
            >
              Dashboard
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
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
                    navigate("/student/assignments");
                  // } 
                  // else if (tab.id === "clubs") {
                  //   navigate("/student/clubs");
                  } else if (tab.id === "career-ai") {
                    navigate("/student/career-ai");
                  } else if (tab.id === "messages") {
                    navigate("/student/messages");
                  }
                }}
                className={`nav-tab relative py-2 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm xl:text-sm font-medium transition-all duration-200 text-gray-900 hover:text-blue-600 bg-transparent border-none outline-none whitespace-nowrap ${activeTab === tab.id ? "active font-semibold text-blue-600" : ""
                  }`}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
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
              className={`nav-tab relative py-2 px-3 text-xs font-medium transition-all duration-200 text-gray-900 hover:text-blue-600 bg-transparent border-none outline-none whitespace-nowrap flex-shrink-0 ${activeTab === "dashboard" ? "active font-semibold text-blue-600" : ""
                }`}
            >
              Dashboard
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
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
                    navigate("/student/assignments");
                  // } else if (tab.id === "clubs") {
                  //   navigate("/student/clubs");
                  } else if (tab.id === "career-ai") {
                    navigate("/student/career-ai");
                  } else if (tab.id === "messages") {
                    navigate("/student/messages");
                  }
                }}
                className={`nav-tab relative py-2 px-3 text-xs font-medium transition-all duration-200 text-gray-900 hover:text-blue-600 bg-transparent border-none outline-none whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? "active font-semibold text-blue-600" : ""
                  }`}
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label.split(' ').map(word => word.charAt(0)).join('')}
              </button>
            ))}
          </div>
        </nav>

        {/* Right Side - Mobile Menu and Profile */}
        <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
          {/* Hamburger Menu - Mobile and Small Tablets */}
          <div className="flex md:hidden items-center">
            <button
              className="p-2 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-blue-50 transition-colors">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 hover:text-blue-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 sm:w-96 bg-white border border-gray-200 shadow-xl max-h-[500px] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recent Updates
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs ml-2">
                        {unreadCount} new
                      </Badge>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-3">
                {activitiesLoading && recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Loading activities...</span>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activities yet</p>
                    <p className="text-xs text-gray-400 mt-1">Recruiters' actions will appear here</p>
                  </div>
                ) : (
                  recentUpdates?.slice(0, showAllUpdates ? recentUpdates.length : 4).map((update, index) => {
                    const notificationId = update.id || update.timestamp;
                    const timestamp = update.timestamp;
                    const isRead = isNotificationRead(notificationId);

                    const getActivityColor = (type, isRead) => {
                      if (isRead) {
                        return 'from-gray-50 to-white border-l-gray-300 opacity-70';
                      }
                      switch(type) {
                        case 'shortlist_added': return 'from-yellow-50 to-white border-l-yellow-400';
                        case 'offer_extended': return 'from-green-50 to-white border-l-green-400';
                        case 'offer_accepted': return 'from-emerald-50 to-white border-l-emerald-400';
                        case 'placement_hired': return 'from-purple-50 to-white border-l-purple-400';
                        case 'stage_change': return 'from-indigo-50 to-white border-l-indigo-400';
                        case 'application_rejected': return 'from-red-50 to-white border-l-red-400';
                        default: return 'from-blue-50 to-white border-l-blue-400';
                      }
                    };

                    return (
                      <div
                        key={notificationId || index}
                        onClick={() => markAsRead(notificationId)}
                        className={`p-3 bg-gradient-to-r ${getActivityColor(update.type, isRead)} rounded-lg border-l-2 hover:shadow-md transition-all cursor-pointer relative ${!isRead ? 'border-l-4' : ''}`}
                      >
                        {!isRead && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-900'} font-medium`}>
                          {update.user && <span className={isRead ? 'text-gray-500' : 'text-blue-700'}>{update.user}</span>}
                          {update.action && <span className="text-gray-600"> {update.action} </span>}
                          {update.candidate && <span className={isRead ? 'font-normal' : 'font-semibold'}>{update.candidate}</span>}
                        </p>
                        {update.details && (
                          <p className="text-xs text-gray-600 mt-1">{update.details}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof timestamp === 'string' && timestamp.includes('ago')
                            ? timestamp
                            : new Date(timestamp).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
                {recentActivities.length > 4 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 mt-2"
                  >
                    {showAllUpdates ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        View All Updates ({recentActivities.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl"
            >
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("profile");
                  navigate("/student/profile");
                }}
                className="cursor-pointer"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("saved-jobs");
                  navigate("/student/saved-jobs");
                }}
                className="cursor-pointer"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Jobs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("settings");
                  navigate("/student/settings");
                }}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg px-2 pt-2 pb-3 animate-fade-in-down max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            <button
              key="dashboard"
              onClick={() => {
                setActiveTab("dashboard");
                localStorage.removeItem("dashboardActiveNav");
                navigate("/student/dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left py-3 px-4 rounded-lg text-gray-900 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200 ${activeTab === "dashboard" ? "font-semibold bg-blue-100 text-blue-700" : ""
                }`}
            >
              <div className="flex items-center">
                <span>📊</span>
                <span className="ml-3">Dashboard</span>
              </div>
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
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
                    navigate("/student/assignments");
                  // } else if (tab.id === "clubs") {
                  //   navigate("/student/clubs");
                  } else if (tab.id === "messages") {
                    navigate("/student/messages");
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-lg text-gray-900 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200 ${activeTab === tab.id ? "font-semibold bg-blue-100 text-blue-700" : ""
                  }`}
              >
                <div className="flex items-center">
                  <span>{tab.icon || getTabIcon(tab.id)}</span>
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
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

