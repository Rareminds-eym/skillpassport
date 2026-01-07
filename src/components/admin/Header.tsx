import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import NotificationPanel from "./NotificationPanel";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

interface HeaderProps {
  onMenuToggle: () => void;
  showMobileMenu: boolean;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showMobileMenu,
  notificationCount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close profile menu and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile Dropdown
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      // Notification Panel
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showProfileMenu || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu, showNotifications]);

  // Get real-time notifications for admin
  const { unreadCount, loading: notificationsLoading } = useAdminNotifications(user?.id);

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout?.(); // optional: clear auth context
    navigate("/login");
  };

  // Get settings path based on role (same logic as sidebar)
  const getSettingsPath = () => {
    if (user?.role === "school_admin") return "/school-admin/settings";
    if (user?.role === "college_admin") return "/college-admin/settings";
    if (user?.role === "university_admin") return "/university-admin/settings";
    return "/college-admin/settings";
  };

  // Fallbacks
  const userName = user?.name || "Admin User";
  const userRoleLabel =
    user?.role === "school_admin"
      ? "School Admin"
      : user?.role === "college_admin"
        ? "College Admin"
        : user?.role === "university_admin"
          ? "University Admin"
          : "Administrator";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 transition"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/RareMinds ISO Logo-01.png"
                alt="RareMinds Logo"
                className="h-8 sm:h-11 w-auto"
              />
            </div>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-indigo-500 transition"
              >
                <BellIcon className="h-6 w-6" />
                {(unreadCount > 0) && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              {showNotifications && (
                <NotificationPanel
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  userId={user?.id}
                />
              )}
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1.5 sm:p-2"
              >
                <UserCircleIcon className="h-7 w-7 text-gray-500" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userRoleLabel}</p>
                </div>
                <ChevronDownIcon
                  className={`hidden sm:block h-4 w-4 text-gray-500 transition-transform ${showProfileMenu ? "rotate-180" : ""
                    }`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => navigate(getSettingsPath())}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay for menu */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-30 top-16"
          onClick={onMenuToggle}
        />
      )}
    </header>
  );
};

export default Header;
