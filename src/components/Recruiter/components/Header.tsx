import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { savedSearches } from '../../../data/sampleData'
import { HeaderProps } from '../../../types/recruiter'
import { useAuth } from '../../../context/AuthContext'
import { useSearch } from '../../../context/SearchContext'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationPanel from './NotificationPanel' 
import { useNavigate } from "react-router-dom" 

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  const { searchQuery, handleSearch: contextHandleSearch } = useSearch()
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery || '')
  const [showSavedSearches, setShowSavedSearches] = useState<boolean>(false)
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate() // ✅ navigation hook

  // ✅ Pass email to useNotifications
  const { unreadCount } = useNotifications(user?.email || null)

  // Handle search execution
  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim()
    contextHandleSearch(trimmedQuery)
  }

  const handleSearchChange = (value: string) => setLocalSearchQuery(value)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(localSearchQuery)
      setShowSavedSearches(false)
    }
  }

  const handleSavedSearchClick = (search: string) => {
    setLocalSearchQuery(search)
    setShowSavedSearches(false)
    handleSearch(search)
  }

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
            {/* 🔔 Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <BellIcon className="h-6 w-6" />
                {/* red dot */}
                { unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
                )}
              </button>

              {/* ✅ Pass email to NotificationPanel */}
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
                          // optional redirect
                          // navigate("/login")
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
