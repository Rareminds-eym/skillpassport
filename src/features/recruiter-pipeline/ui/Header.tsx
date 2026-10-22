import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeaderProps } from '@/shared/types/recruiter'

import { useNotifications } from '@/features/notifications'
import NotificationPanel from './NotificationPanel'

import { useUser, useAuthActions } from '@/shared/model/authStore';
const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const user = useUser()
  const { logout } = useAuthActions()
  const navigate = useNavigate()

  // Determine if user is admin based on roles
  const userDisplayRole = useMemo(() => {
    const userRoles = user?.roles || [];
    const isAdmin = userRoles.includes('owner') || userRoles.includes('company_admin');
    return isAdmin ? 'Admin' : 'Recruiter';
  }, [user?.roles]);

  const isUserAdmin = useMemo(() => {
    const userRoles = user?.roles || [];
    return userRoles.includes('owner') || userRoles.includes('company_admin');
  }, [user?.roles]);

  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const notificationButtonRef = useRef<HTMLButtonElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close profile menu and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
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
      document.addEventListener('pointerdown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [showProfileMenu, showNotifications])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showProfileMenu) { setShowProfileMenu(false); profileButtonRef.current?.focus(); }
      if (showNotifications) { setShowNotifications(false); notificationButtonRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showProfileMenu, showNotifications]);

  // ✅ get realtime unread notifications
  const { unreadCount } = useNotifications(user?.email || null)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={showMobileMenu}
              aria-controls={showMobileMenu ? 'recruiter-mobile-navigation' : undefined}
              onClick={onMenuToggle}
              className="md:hidden p-3 rounded-md text-gray-500 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="h-auto max-h-12 w-[min(40vw,160px)] object-contain"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            {/* 🔔 Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                ref={notificationButtonRef}
                type="button"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={showNotifications}
                aria-controls={showNotifications ? 'recruiter-notifications' : undefined}
                onClick={() => {
                  setShowNotifications((s) => !s)
                  setShowProfileMenu(false)
                }}
                className="relative p-3 text-gray-500 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <BellIcon className="h-6 w-6" />
                {/* red dot shows only if unread > 0 */}
                {unreadCount > 0 && (
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
            <div ref={profileRef} className="relative">
              <button
                ref={profileButtonRef}
                type="button"
                aria-label="Account options"
                aria-controls={showProfileMenu ? 'recruiter-account-options' : undefined}
                onClick={() => {
                  setShowProfileMenu((s) => !s)
                  setShowNotifications(false)
                }}
                className="flex min-h-11 min-w-11 items-center justify-center space-x-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-expanded={showProfileMenu}
              >
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden min-w-0 max-w-[min(35vw,320px)] md:flex flex-col items-start">
                  <span className="max-w-full truncate text-gray-700 font-medium">{user?.name || userDisplayRole}</span>
                  <span className="max-w-full truncate text-xs text-gray-500">{userDisplayRole} • {user?.email}</span>
                </div>
              </button>

              {showProfileMenu && (
                <div id="recruiter-account-options" className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    {/* ✅ Navigate to recruiter profile page */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate("/recruitment/profile")
                      }}
                      className="min-h-11 w-full text-left px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Profile
                    </button>
                    {/* Only show Manage Subscription for admins */}
                    {isUserAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate("/recruitment/subscription/manage")
                        }}
                        className="min-h-11 w-full text-left px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Manage Subscription
                      </button>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        setShowProfileMenu(false)
                        try {
                          await logout()
                        } finally {
                          // Redirect to unified login after logout
                          navigate("/login");
                        }
                      }}
                      className="min-h-11 w-full text-left px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 text-sm text-red-600 hover:bg-red-50"
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
