import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import NotificationPanel from "./NotificationPanel";

interface HeaderProps {
  onMenuToggle: () => void;
  showMobileMenu: boolean;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showMobileMenu,
  notificationCount = 3,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate("/");
  };

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
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-indigo-500 transition"
              >
                <BellIcon className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              {showNotifications && (
                <NotificationPanel
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1.5 sm:p-2"
              >
                <UserCircleIcon className="h-7 w-7 text-gray-500" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <ChevronDownIcon
                  className={`hidden sm:block h-4 w-4 text-gray-500 transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => navigate("/college-admin/settings")}
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
