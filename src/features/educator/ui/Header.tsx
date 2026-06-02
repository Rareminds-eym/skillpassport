import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import NotificationPanel from './NotificationPanel'
import { apiPost } from '@/shared/api/apiClient'
import { useNotifications } from '@/features/notifications'
import { getLogger } from '@/shared/config/logging'

const logger = getLogger('EducatorHeader')

interface HeaderProps {
  onMenuToggle: () => void
  showMobileMenu: boolean
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [educatorProfile, setEducatorProfile] = useState<any>(null)
  const [educatorEmail, setEducatorEmail] = useState<string | null>(null)
  const navigate = useNavigate()
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile Dropdown
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      // Notification Panel
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showProfileMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu, showNotifications])

  // Get notifications using the unified notification system
  const {
    unreadCount,
  } = useNotifications(educatorEmail)


  // Load educator profile for header
  const loadEducatorProfile = async () => {
    try {
      // Get email from localStorage (same method as ProfileFixed)
      const storedUser = localStorage.getItem('user')
      const storedEmail = localStorage.getItem('userEmail')

      let email = 'karthikeyan@rareminds.in' // Default fallback

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          email = userData.email || email
        } catch (e) {
          logger.error('Failed to parse stored user data', e as Error);
        }
      } else if (storedEmail) {
        email = storedEmail
      }

      setEducatorEmail(email)

      // Fetch educator data
      const res = await apiPost('/educator/actions', { action: 'fetch-educator-by-email', email })
      const educatorData = res?.data

      if (!educatorData) {
        return
      }

      if (educatorData) {
        setEducatorProfile({
          name: educatorData.first_name && educatorData.last_name
            ? `${educatorData.first_name} ${educatorData.last_name}`
            : educatorData.first_name || 'Educator',
          photo_url: educatorData.photo_url,
          email: educatorData.email,
          specialization: educatorData.specialization || 'Account'
        })
      }
    } catch (error) {
      logger.error('Failed to load educator profile', error as Error);
    }
  }

  useEffect(() => {
    loadEducatorProfile()

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadEducatorProfile()
    }

    // Add event listener for profile updates
    window.addEventListener('educatorProfileUpdated', handleProfileUpdate)

    // Cleanup
    return () => {
      window.removeEventListener('educatorProfileUpdated', handleProfileUpdate)
    }
  }, [])

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev)
    setShowProfileMenu(false)
  }

  const handleProfile = () => {
    setShowProfileMenu(false)
    navigate('/educator/profile')
  }

  const handleSettings = () => {
    setShowProfileMenu(false)
    navigate('/educator/settings')
  }

  const handleLogout = () => {
    setShowProfileMenu(false)
    navigate('/')
  }

  const handleProfileClick = () => {
    setShowProfileMenu((prev) => !prev)
    setShowNotifications(false)
  }

  // Menu button click handler
  const handleMenuClick = () => {
    onMenuToggle()
    setShowNotifications(false)
    setShowProfileMenu(false)
  }

  return (
    <header className="bg-white  border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              aria-expanded={showMobileMenu}
              type="button"
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

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Button */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label={`Notifications (${unreadCount})`}
                type="button"
              >
                <BellIcon className="h-5 sm:h-6 w-5 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Panel */}
              {showNotifications && (
                <NotificationPanel
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  educatorEmail={educatorEmail}
                />
              )}

            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 sm:gap-3 text-sm rounded-full hover:bg-gray-100 p-1.5 sm:p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-haspopup="true"
                aria-expanded={showProfileMenu}
                type="button"
              >
                {educatorProfile?.photo_url ? (
                  <img
                    src={educatorProfile.photo_url}
                    alt={educatorProfile.name}
                    className="h-6 sm:h-8 w-6 sm:w-8 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                ) : null}
                <UserCircleIcon
                  className={`h-6 sm:h-8 w-6 sm:w-8 text-gray-400 ${educatorProfile?.photo_url ? 'hidden' : 'block'}`}
                />
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {educatorProfile?.name || 'Educator'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {educatorProfile?.specialization || 'Computer Science'}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    Educator
                  </span>
                </div>
                <ChevronDownIcon
                  className={`hidden sm:block h-4 w-4 text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="md:hidden fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Mobile Profile Info */}
                    <div className="sm:hidden px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        {educatorProfile?.photo_url ? (
                          <img
                            src={educatorProfile.photo_url}
                            alt={educatorProfile.name}
                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {educatorProfile?.name || 'Educator'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {educatorProfile?.specialization || 'Account'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        type="button"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={handleSettings}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        type="button"
                      >
                        Settings
                      </button>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        type="button"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile backdrop - clicks here close the menu */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-30 top-16"
          onClick={onMenuToggle}
        />
      )}
    </header>
  )
}

export default Header