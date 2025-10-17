import React, { useState } from 'react'
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { recentActivity } from '../../../data/sampleData'
import { HeaderProps } from '../../../types/recruiter'
import { useAuth } from '../../../context/AuthContext'

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('')
  const [showSavedSearches, setShowSavedSearches] = useState<boolean>(false)
  const { user, logout } = useAuth()

  const savedSearches = ['Senior React Developer', 'UI/UX Designer', 'Full Stack Engineer']

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Implement search logic here
      console.log('Searching for:', localSearchQuery)
    }
  }

  const handleSavedSearchClick = (search: string) => {
    setLocalSearchQuery(search)
    setShowSavedSearches(false)
    // Implement search logic here
    console.log('Searching for:', search)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
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

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-4 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSavedSearches(true)}
                onBlur={() => setTimeout(() => setShowSavedSearches(false), 200)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search candidates, skills, locations... (Press Enter to search)"
              />
            </div>
            
            {showSavedSearches && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg border border-gray-200 rounded-lg z-50">
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Saved Searches
                  </p>
                  <div className="space-y-1">
                    {savedSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSavedSearchClick(search)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-haspopup="true"
                aria-expanded={showNotifications}
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentActivity && recentActivity.length > 0 ? (
                      recentActivity.slice(0, 10).map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-gray-50">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{n.user}</span> {n.action} <span className="font-medium">{n.candidate}</span>
                          </p>
                          <p className="text-xs text-gray-500">{n.timestamp}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">No new notifications</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
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
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        alert('Profile page coming soon')
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
                          // Optionally redirect after logout; keep minimal to avoid breaking routes
                          // window.location.href = '/login'
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