import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeaderProps } from '../../../types/recruiter'
import { useAuth } from '../../../context/AuthContext'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationPanel from './NotificationPanel'

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ✅ get realtime unread notifications
  const { unreadCount } = useNotifications(user?.email || null)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 md:ml-0">
              <img
                src="/RareMinds ISO Logo-01.png"
                alt="RareMinds Logo"
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* 🔔 Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <BellIcon className="h-6 w-6" />
                {/* red dot shows only if unread > 0 */}
                { unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* ✅ Notification Panel */}
              <NotificationPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                recruiterEmail={user?.email}
              />
            </div>

            {/* 👤 Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((s) => !s)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-haspopup="true"
                aria-expanded={showProfileMenu}
              >
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-gray-700 font-medium">{user?.name || "Recruiter"}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {/* ✅ Navigate to recruiter profile page */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate("/recruitment/profile")
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Profile
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        try {
                          logout()
                        } finally {
                          // Redirect to unified login after logout
                          navigate("/login");
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
